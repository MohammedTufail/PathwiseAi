// controllers/progressController.js
// ─────────────────────────────────────────────────────────────────────────────
// Five controller functions, one per API endpoint.
// Every mutating function calls checkAndSave() at the end to:
//   a) re-evaluate week completion
//   b) save the document exactly once (avoids double-save bugs)
//
// Auth assumption: req.userId is populated by auth middleware BEFORE these
// controllers run. See middleware/auth.js.
// ─────────────────────────────────────────────────────────────────────────────

const UserProgress = require("../models/UserProgress");
const { isWeekComplete, PASS_SCORE } = require("../utils/weekCompletion");

// ── Shared helper ─────────────────────────────────────────────────────────────
// Re-evaluates completion for every week, then saves.
// Called at the end of every mutation so logic lives in one place.
async function checkAndSave(progressDoc) {
  for (const week of progressDoc.weeks) {
    // Once a week is completed it STAYS completed (no regression)
    if (!week.isCompleted && isWeekComplete(week)) {
      week.isCompleted = true;
      week.completedAt = new Date();
    }
  }
  return progressDoc.save();
}

// ── Ensure week exists inside the progress doc ────────────────────────────────
// Creates an empty week entry if it doesn't already exist.
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

// ── Ensure resource entry exists inside a week ────────────────────────────────
function ensureResource(week, resourceId, url = "") {
  let res = week.resources.find((r) => r.resourceId === resourceId);
  if (!res) {
    week.resources.push({
      resourceId,
      url,
      completed: false,
      completedAt: null,
    });
    res = week.resources[week.resources.length - 1];
  }
  return res;
}

// =============================================================================
// 1. GET /api/progress/:courseId
//    Returns the full progress document for the authenticated user + course.
//    Creates an empty one on first access (upsert pattern).
// =============================================================================
const getProgress = async (req, res) => {
  try {
    const { courseId } = req.params;

    // findOneAndUpdate with upsert so first call auto-creates the document
    let progress = await UserProgress.findOneAndUpdate(
      { userId: req.userId, courseId },
      { $setOnInsert: { userId: req.userId, courseId, weeks: [] } },
      { upsert: true, new: true },
    );

    res.json({ success: true, data: progress });
  } catch (err) {
    console.error("[getProgress]", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to load progress" });
  }
};

// =============================================================================
// 2. POST /api/progress/:courseId/resource
//    Marks a single resource as completed.
//    Body: { weekNumber: Number, resourceId: String, url: String }
// =============================================================================
const markResource = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { weekNumber, resourceId, url } = req.body;

    if (!weekNumber || !resourceId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "weekNumber and resourceId required",
        });
    }

    let progress = await UserProgress.findOneAndUpdate(
      { userId: req.userId, courseId },
      { $setOnInsert: { userId: req.userId, courseId, weeks: [] } },
      { upsert: true, new: true },
    );

    const week = ensureWeek(progress, Number(weekNumber));
    const resource = ensureResource(week, resourceId, url);

    // Idempotent — only update if not already completed
    if (!resource.completed) {
      resource.completed = true;
      resource.completedAt = new Date();
    }

    await checkAndSave(progress);
    res.json({ success: true, data: progress });
  } catch (err) {
    console.error("[markResource]", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to mark resource" });
  }
};

// =============================================================================
// 3. POST /api/progress/:courseId/quiz
//    Saves a quiz attempt. Stores BEST score only. Once passed, stays passed.
//    Body: { weekNumber: Number, score: Number }  (score is out of 10)
// =============================================================================
const submitQuizScore = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { weekNumber, score } = req.body;

    if (weekNumber == null || score == null) {
      return res
        .status(400)
        .json({ success: false, message: "weekNumber and score required" });
    }

    const numericScore = Number(score);
    if (numericScore < 0 || numericScore > 10) {
      return res
        .status(400)
        .json({ success: false, message: "score must be 0–10" });
    }

    let progress = await UserProgress.findOneAndUpdate(
      { userId: req.userId, courseId },
      { $setOnInsert: { userId: req.userId, courseId, weeks: [] } },
      { upsert: true, new: true },
    );

    const week = ensureWeek(progress, Number(weekNumber));

    // ── Quiz rules ──────────────────────────────────────────────────────────
    // bestScore: keep the highest score ever
    week.quiz.bestScore = Math.max(week.quiz.bestScore || 0, numericScore);

    // passed: once true, never goes back to false
    if (!week.quiz.passed && numericScore >= PASS_SCORE) {
      week.quiz.passed = true;
    }

    week.quiz.attempts = (week.quiz.attempts || 0) + 1;
    week.quiz.lastAttemptAt = new Date();

    await checkAndSave(progress);
    res.json({ success: true, data: progress });
  } catch (err) {
    console.error("[submitQuizScore]", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to save quiz score" });
  }
};

// =============================================================================
// 4. POST /api/progress/:courseId/project
//    Marks the project as done and optionally saves a GitHub link.
//    Body: { weekNumber: Number, githubLink?: String }
// =============================================================================
const markProject = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { weekNumber, githubLink = "" } = req.body;

    if (!weekNumber) {
      return res
        .status(400)
        .json({ success: false, message: "weekNumber required" });
    }

    let progress = await UserProgress.findOneAndUpdate(
      { userId: req.userId, courseId },
      { $setOnInsert: { userId: req.userId, courseId, weeks: [] } },
      { upsert: true, new: true },
    );

    const week = ensureWeek(progress, Number(weekNumber));

    week.project.completed = true;
    week.project.githubLink = githubLink;
    week.project.completedAt = new Date();

    await checkAndSave(progress);
    res.json({ success: true, data: progress });
  } catch (err) {
    console.error("[markProject]", err);
    res.status(500).json({ success: false, message: "Failed to mark project" });
  }
};

// =============================================================================
// 5. GET /api/progress/:courseId/week/:weekNumber
//    Returns progress for a single week (useful for detail page).
// =============================================================================
const getWeekProgress = async (req, res) => {
  try {
    const { courseId, weekNumber } = req.params;

    const progress = await UserProgress.findOne({
      userId: req.userId,
      courseId,
    });

    if (!progress) {
      return res.json({ success: true, data: null });
    }

    const week = progress.weeks.find(
      (w) => w.weekNumber === Number(weekNumber),
    );
    res.json({ success: true, data: week || null });
  } catch (err) {
    console.error("[getWeekProgress]", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to load week progress" });
  }
};

module.exports = {
  getProgress,
  markResource,
  submitQuizScore,
  markProject,
  getWeekProgress,
};
