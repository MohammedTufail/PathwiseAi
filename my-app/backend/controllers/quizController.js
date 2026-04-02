// backend/controllers/quizController.js
// ─────────────────────────────────────────────────────────────────────────────
// Three endpoints:
//
//   GET  /api/quiz/:courseId/:weekNumber
//     → Returns questions (generates and caches on first call)
//
//   POST /api/quiz/:courseId/:weekNumber/attempt
//     → Saves attempt with per-question results
//     → Returns score, topic analysis, weak topics
//
//   GET  /api/quiz/:courseId/:weekNumber/analysis
//     → Returns topic stats + weak topics for focused quiz
// ─────────────────────────────────────────────────────────────────────────────

const WeekQuiz = require("../models/WeekQuiz");
const UserProgress = require("../models/UserProgress");
const { generateWeekQuestions } = require("../utils/generateQuestions");
const { analyzeTopics, getWeakTopics } = require("../utils/topicAnalysis");
const { isWeekComplete, PASS_SCORE } = require("../utils/weekCompletion");

// ── Ensure week exists in UserProgress ───────────────────────────────────────
function ensureWeek(progressDoc, weekNumber) {
  let week = progressDoc.weeks.find((w) => w.weekNumber === weekNumber);
  if (!week) {
    progressDoc.weeks.push({
      weekNumber,
      resources: [],
      quiz: {},
      project: {},
    });
    week = progressDoc.weeks[progressDoc.weeks.length - 1];
  }
  return week;
}

// ── Re-evaluate week completion and save ─────────────────────────────────────
async function checkAndSave(progressDoc) {
  for (const week of progressDoc.weeks) {
    if (!week.isCompleted && isWeekComplete(week)) {
      week.isCompleted = true;
      week.completedAt = new Date();
    }
  }
  return progressDoc.save();
}

// =============================================================================
// GET /api/quiz/:courseId/:weekNumber
// Returns the question bank. Generates it if it doesn't exist yet.
// Body (optional): { subject, weekTitle, topics } — needed only for generation
// =============================================================================
const getQuestions = async (req, res) => {
  try {
    let { courseId, weekNumber } = req.params;

    // ✅ normalize courseId (fix spaces → hyphens issue)
    

    const weekNum = Number(weekNumber);

    if (!courseId || isNaN(weekNum)) {
      return res.status(400).json({
        success: false,
        message: "Invalid courseId or weekNumber",
      });
    }

    // ✅ Check if quiz already exists
    let weekQuiz = await WeekQuiz.findOne({
      courseId,
      weekNumber: weekNum,
    });

    // ✅ If exists → return immediately (NO crash possible)
    if (weekQuiz && weekQuiz.questions?.length > 0) {
      return res.json({
        success: true,
        questions: weekQuiz.questions,
        cached: true,
        generatedAt: weekQuiz.generatedAt,
      });
    }

    // ✅ FIX: safely read body (no undefined crash)
    const subject = req.body?.subject || "";
    const weekTitle = req.body?.weekTitle || "";
    const topics = req.body?.topics || [];

    if (!topics.length) {
      return res.status(400).json({
        success: false,
        message: "topics array is required for first generation",
      });
    }

    console.log(`📝 Generating quiz for course=${courseId} week=${weekNum}`);

    const questions = await generateWeekQuestions(subject, weekTitle, topics);

    if (!questions || !questions.length) {
      return res.status(500).json({
        success: false,
        message: "Question generation failed",
      });
    }
    
    // ✅ FIX: updated mongoose option (removes warning)
    weekQuiz = await WeekQuiz.findOneAndUpdate(
      { courseId, weekNumber: weekNum },
      {
        courseId,
        weekNumber: weekNum,
        weekTitle,
        subject,
        topics,
        questions,
        generatedAt: new Date(),
      },

      {
        upsert: true,
        returnDocument: "after", // ✅ replaces deprecated `new: true`
      },
    );

    console.log(`✅ Generated ${questions.length} questions`);

    return res.json({
      success: true,
      questions: weekQuiz.questions,
      cached: false,
      generatedAt: weekQuiz.generatedAt,
    });
  } catch (err) {
    console.error("[getQuestions]", err);
    return res.status(500).json({
      success: false,
      message: "Failed to get quiz questions",
    });
  }
};

// =============================================================================
// POST /api/quiz/:courseId/:weekNumber/attempt
// Saves a completed quiz attempt with per-question results.
// Body: {
//   score: number,          // correct answer count
//   total: number,          // total questions
//   results: [              // per-question detail
//     { questionIndex, topic, correct, selected }
//   ]
// }
// Returns: { score, total, passed, bestScore, topicStats, weakTopics }
// =============================================================================
const submitAttempt = async (req, res) => {
  try {
    const { courseId, weekNumber } = req.params;
    const weekNum = Number(weekNumber);
    const { score, total, results = [] } = req.body;

    if (score == null || total == null) {
      return res
        .status(400)
        .json({ success: false, message: "score and total are required" });
    }

    const numericScore = Number(score);
    const numericTotal = Number(total);

    // Load or create progress doc
    let progress = await UserProgress.findOneAndUpdate(
      { userId: req.userId, courseId },
      { $setOnInsert: { userId: req.userId, courseId, weeks: [] } },
      { upsert: true, new: true },
    );

    const week = ensureWeek(progress, weekNum);

    // ── Quiz rules ────────────────────────────────────────────────────────────
    const newAttempt = {
      score: numericScore,
      total: numericTotal,
      results,
      attemptedAt: new Date(),
    };

    // Keep last 5 attempts to bound storage — older ones aren't needed for analysis
    week.quiz.attempts = week.quiz.attempts || [];
    week.quiz.attempts.push(newAttempt);
    if (week.quiz.attempts.length > 5) {
      week.quiz.attempts = week.quiz.attempts.slice(-5);
    }

    // Best score: keep highest
    week.quiz.bestScore = Math.max(week.quiz.bestScore || 0, numericScore);

    // Passed: once true stays true
    if (!week.quiz.passed && numericScore >= PASS_SCORE) {
      week.quiz.passed = true;
    }

    week.quiz.lastAttemptAt = new Date();

    await checkAndSave(progress);

    // ── Topic analysis ────────────────────────────────────────────────────────
    const topicStats = analyzeTopics(week.quiz.attempts);
    const weakTopics = topicStats.filter((t) => t.isWeak).map((t) => t.topic);

    res.json({
      success: true,
      score: numericScore,
      total: numericTotal,
      passed: week.quiz.passed,
      bestScore: week.quiz.bestScore,
      topicStats,
      weakTopics,
    });
  } catch (err) {
    console.error("[submitAttempt]", err);
    res.status(500).json({ success: false, message: "Failed to save attempt" });
  }
};

// =============================================================================
// GET /api/quiz/:courseId/:weekNumber/analysis
// Returns topic stats and weak topics for the current user.
// Used to decide whether to show the focused mini-quiz button.
// =============================================================================
const getAnalysis = async (req, res) => {
  try {
    const { courseId, weekNumber } = req.params;
    const weekNum = Number(weekNumber);

    const progress = await UserProgress.findOne({
      userId: req.userId,
      courseId,
    });

    if (!progress) {
      return res.json({
        success: true,
        topicStats: [],
        weakTopics: [],
        attempted: false,
      });
    }

    const week = progress.weeks.find((w) => w.weekNumber === weekNum);

    if (!week || !week.quiz.attempts?.length) {
      return res.json({
        success: true,
        topicStats: [],
        weakTopics: [],
        attempted: false,
      });
    }

    const topicStats = analyzeTopics(week.quiz.attempts);
    const weakTopics = topicStats.filter((t) => t.isWeak).map((t) => t.topic);

    res.json({
      success: true,
      topicStats,
      weakTopics,
      attempted: true,
      bestScore: week.quiz.bestScore,
      passed: week.quiz.passed,
      attemptCount: week.quiz.attempts.length,
    });
  } catch (err) {
    console.error("[getAnalysis]", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to load analysis" });
  }
};

module.exports = { getQuestions, submitAttempt, getAnalysis };
