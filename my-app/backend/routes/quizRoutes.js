// backend/routes/quizRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
// Mounted at /api/quiz in app.js
// Replaces the old /generate-quiz Flask route.
// ─────────────────────────────────────────────────────────────────────────────

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getQuestions,
  submitAttempt,
  getAnalysis,
} = require("../controllers/quizController");

router.use(auth);

// GET  /api/quiz/:courseId/:weekNumber        — fetch (or generate) questions
// POST body optional on GET — pass { subject, weekTitle, topics } for first generation

router.get("/:courseId/:weekNumber", getQuestions);
router.post("/:courseId/:weekNumber", getQuestions);

// POST /api/quiz/:courseId/:weekNumber/attempt — submit completed attempt
router.post("/:courseId/:weekNumber/attempt", submitAttempt);

// GET  /api/quiz/:courseId/:weekNumber/analysis — topic weakness analysis
router.get("/:courseId/:weekNumber/analysis", getAnalysis);

module.exports = router;
