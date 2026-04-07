// backend/controllers/quizController.js  (v3)
// ─────────────────────────────────────────────────────────────────────────────
// Endpoints:
//
//   GET  /api/quiz/:courseId/:weekNumber/:topic
//     → Fetch (or generate) questions for ONE topic
//     → Query param ?subject=&weekTitle= needed only for first generation
//
//   POST /api/quiz/:courseId/:weekNumber/:topic/attempt
//     → Save a topic quiz attempt, return subtopic analysis
//
//   GET  /api/quiz/:courseId/:weekNumber/summary
//     → Return all topics' pass/fail status + weak subtopics for the week
//
//   GET  /api/quiz/:courseId/:weekNumber/:topic/remediation
//     → Return weak subtopics + chatbot prompt + re-quiz questions
// ─────────────────────────────────────────────────────────────────────────────

const WeekQuiz = require("../models/WeekQuiz");
const UserProgress = require("../models/UserProgress");
const { generateTopicQuestions } = require("../utils/generateQuestions");
const {
  analyzeSubtopics,
  getWeakSubtopics,
  buildTopicSummary,
} = require("../utils/topicAnalysis");
const { isWeekComplete } = require("../utils/weekCompletion");

const { validateCourseId } = require("../utils/validateCourseId");

const PASS_SCORE = 3; // 3/5 = 60% — pass threshold for a topic quiz

// ── Shared helpers ────────────────────────────────────────────────────────────

function ensureWeek(progressDoc, weekNumber) {
  let week = progressDoc.weeks.find((w) => w.weekNumber === weekNumber);
  if (!week) {
    progressDoc.weeks.push({
      weekNumber,
      resources: [],
      topicQuizzes: [],
      project: {},
    });
    week = progressDoc.weeks[progressDoc.weeks.length - 1];
  }
  return week;
}

function ensureTopicQuiz(week, topic) {
  let tq = week.topicQuizzes.find((q) => q.topic === topic);
  if (!tq) {
    week.topicQuizzes.push({
      topic,
      bestScore: 0,
      passed: false,
      attempts: [],
      lastAttemptAt: null,
    });
    tq = week.topicQuizzes[week.topicQuizzes.length - 1];
  }
  return tq;
}

async function checkAndSave(progressDoc, totalTopicsPerWeek = {}) {
  for (const week of progressDoc.weeks) {
    if (!week.isCompleted) {
      const total = totalTopicsPerWeek[week.weekNumber] || 0;
      if (isWeekComplete(week, total)) {
        week.isCompleted = true;
        week.completedAt = new Date();
      }
    }
  }
  return progressDoc.save();
}

// =============================================================================
// GET /api/quiz/:courseId/:weekNumber/:topic
// Fetch (or generate) questions for a single topic.
// On first call: pass ?subject=&weekTitle= as query params.
// After that: returns cached questions — no Groq call.
// =============================================================================
const getTopicQuestions = async (req, res) => {
  try {
    const { courseId, weekNumber, topic } = req.params;
    if (!validateCourseId(courseId, res)) return;
    const weekNum = Number(weekNumber);
    const decodedTopic = decodeURIComponent(topic);

    // Load the WeekQuiz doc (or create empty shell)
    let weekQuiz = await WeekQuiz.findOne({ courseId, weekNumber: weekNum });

    // Check if this topic bank already exists
    if (weekQuiz && weekQuiz.topicBanks?.get(decodedTopic)?.questions?.length) {
      const bank = weekQuiz.topicBanks.get(decodedTopic);
      return res.json({
        success: true,
        topic: decodedTopic,
        questions: bank.questions,
        cached: true,
        generatedAt: bank.generatedAt,
      });
    }

    // Need to generate — require subject + weekTitle
    const { subject = "", weekTitle = "" } = req.query;

    if (!subject || !weekTitle) {
      return res.status(400).json({
        success: false,
        message:
          "subject and weekTitle query params required for first generation",
      });
    }

    console.log(
      `📝 Generating topic quiz: course=${courseId} week=${weekNum} topic="${decodedTopic}"`,
    );

    const questions = await generateTopicQuestions(
      subject,
      weekTitle,
      decodedTopic,
    );

    if (!questions.length) {
      return res
        .status(500)
        .json({ success: false, message: "Generation returned no questions" });
    }

    // Upsert the WeekQuiz doc, setting this topic's bank
    weekQuiz = await WeekQuiz.findOneAndUpdate(
      { courseId, weekNumber: weekNum },
      {
        $setOnInsert: { courseId, weekNumber: weekNum, weekTitle, subject },
        $set: {
          [`topicBanks.${decodedTopic}`]: {
            questions,
            generatedAt: new Date(),
          },
        },
      },
      { upsert: true, new: true },
    );

    console.log(
      `✅ Generated ${questions.length} questions for "${decodedTopic}"`,
    );

    res.json({
      success: true,
      topic: decodedTopic,
      questions,
      cached: false,
      generatedAt: new Date(),
    });
  } catch (err) {
    console.error("[getTopicQuestions]", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to get topic questions" });
  }
};

// =============================================================================
// POST /api/quiz/:courseId/:weekNumber/:topic/attempt
// Save a completed topic quiz attempt.
// Body: { score, total, results: [{ questionIndex, topic, subtopic, correct, selected }] }
// Returns: { score, total, passed, bestScore, subtopicStats, weakSubtopics }
// =============================================================================
const submitTopicAttempt = async (req, res) => {
  try {
    const { courseId, weekNumber, topic } = req.params;
    if (!validateCourseId(courseId, res)) return;
    const weekNum = Number(weekNumber);
    const decodedTopic = decodeURIComponent(topic);
    const { score, total, results = [], totalTopicsInWeek = 0 } = req.body;

    if (score == null || total == null) {
      return res
        .status(400)
        .json({ success: false, message: "score and total required" });
    }

    const numericScore = Number(score);
    const numericTotal = Number(total);

    let progress = await UserProgress.findOneAndUpdate(
      { userId: req.userId, courseId },
      { $setOnInsert: { userId: req.userId, courseId, weeks: [] } },
      { upsert: true, new: true },
    );

    const week = ensureWeek(progress, weekNum);
    const tq = ensureTopicQuiz(week, decodedTopic);

    // ── Save attempt ─────────────────────────────────────────────────────────
    const attempt = {
      score: numericScore,
      total: numericTotal,
      results,
      attemptedAt: new Date(),
    };
    tq.attempts.push(attempt);
    if (tq.attempts.length > 5) tq.attempts = tq.attempts.slice(-5);

    // Best score — keep highest
    tq.bestScore = Math.max(tq.bestScore || 0, numericScore);

    // Passed — once true stays true
    if (!tq.passed && numericScore >= PASS_SCORE) {
      tq.passed = true;
    }
    tq.lastAttemptAt = new Date();

    // Pass totalTopics so week completion check works correctly
    await checkAndSave(progress, { [weekNum]: Number(totalTopicsInWeek) });

    // ── Subtopic analysis ─────────────────────────────────────────────────────
    const subtopicStats = analyzeSubtopics(tq.attempts);
    const weakSubtopics = subtopicStats
      .filter((s) => s.isWeak)
      .map((s) => s.subtopic);

    res.json({
      success: true,
      topic: decodedTopic,
      score: numericScore,
      total: numericTotal,
      passed: tq.passed,
      bestScore: tq.bestScore,
      subtopicStats,
      weakSubtopics,
    });
  } catch (err) {
    console.error("[submitTopicAttempt]", err);
    res.status(500).json({ success: false, message: "Failed to save attempt" });
  }
};

// =============================================================================
// GET /api/quiz/:courseId/:weekNumber/summary
// Returns per-topic pass/fail status and weak subtopics for the whole week.
// Used by WeekCard to render the TopicQuizBar.
// =============================================================================
const getWeekSummary = async (req, res) => {
  try {
    const { courseId, weekNumber } = req.params;
    if (!validateCourseId(courseId, res)) return;
    const weekNum = Number(weekNumber);

    // topics[] sent as comma-separated query param
    const topics = req.query.topics
      ? req.query.topics.split(",").map((t) => t.trim())
      : [];
    const progress = await UserProgress.findOne({
      userId: req.userId,
      courseId,
    });

    if (!progress) {
      return res.json({
        success: true,
        topicSummary: [],
        weekCompleted: false,
      });
    }

    const week = progress.weeks.find((w) => w.weekNumber === weekNum);
    const topicSummary = buildTopicSummary(week?.topicQuizzes ?? [], topics);
    const weekCompleted = week?.isCompleted ?? false;

    res.json({ success: true, topicSummary, weekCompleted });
  } catch (err) {
    console.error("[getWeekSummary]", err);
    res.status(500).json({ success: false, message: "Failed to get summary" });
  }
};

// =============================================================================
// GET /api/quiz/:courseId/:weekNumber/:topic/remediation
// Returns:
//   - weakSubtopics: string[]
//   - chatPrompt: a ready-made message to send to the AI chatbot
//   - reQuizQuestions: filtered questions covering only weak subtopics
//     (pulled from the cached bank — no new Groq call unless bank is thin)
// =============================================================================
const getRemediation = async (req, res) => {
  try {
    const { courseId, weekNumber, topic } = req.params;
    if (!validateCourseId(courseId, res)) return;
    const weekNum = Number(weekNumber);
    const decodedTopic = decodeURIComponent(topic);

    // Get the user's weak subtopics for this topic
    const progress = await UserProgress.findOne({
      userId: req.userId,
      courseId,
    });
    const week = progress?.weeks.find((w) => w.weekNumber === weekNum);
    const tq = week?.topicQuizzes?.find((q) => q.topic === decodedTopic);

    if (!tq || !tq.attempts?.length) {
      return res
        .status(400)
        .json({ success: false, message: "No attempts yet for this topic" });
    }

    const weakSubtopics = getWeakSubtopics(tq.attempts);

    if (!weakSubtopics.length) {
      return res.json({
        success: true,
        weakSubtopics: [],
        chatPrompt: null,
        reQuizQuestions: [],
      });
    }

    // Chatbot prompt — auto-send to the chat endpoint or display to user
    const chatPrompt = `I just took the "${decodedTopic}" quiz and I'm struggling with: ${weakSubtopics.join(", ")}. Can you explain these concepts simply with examples?`;

    // Re-quiz questions — filter the cached bank to weak subtopics
    const weekQuiz = await WeekQuiz.findOne({ courseId, weekNumber: weekNum });
    const bank = weekQuiz?.topicBanks?.get(decodedTopic);
    const allQuestions = bank?.questions ?? [];

    const reQuizQuestions = allQuestions.filter((q) =>
      weakSubtopics.some(
        (ws) => ws.toLowerCase() === (q.subtopic || "").toLowerCase(),
      ),
    );

    // If not enough questions from the bank (< 2), include all topic questions as fallback
    const finalQuestions =
      reQuizQuestions.length >= 2 ? reQuizQuestions : allQuestions.slice(0, 3);

    res.json({
      success: true,
      weakSubtopics,
      chatPrompt,
      reQuizQuestions: finalQuestions,
    });
  } catch (err) {
    console.error("[getRemediation]", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to get remediation data" });
  }
};

module.exports = {
  getTopicQuestions,
  submitTopicAttempt,
  getWeekSummary,
  getRemediation,
};
