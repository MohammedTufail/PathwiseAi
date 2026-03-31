// routes/progressRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
// All routes are prefixed with /api/progress when mounted in app.js.
// Auth middleware runs on every route — replace with your own JWT middleware.
// ─────────────────────────────────────────────────────────────────────────────

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getProgress,
  markResource,
  submitQuizScore,
  markProject,
  getWeekProgress,
} = require("../controllers/progressController");

// All progress routes require authentication
router.use(auth);

// GET  /api/progress/:courseId              → full progress for a course
router.get("/:courseId", getProgress);

// GET  /api/progress/:courseId/week/:weekNumber → single week progress
router.get("/:courseId/week/:weekNumber", getWeekProgress);

// POST /api/progress/:courseId/resource     → mark a resource as completed
router.post("/:courseId/resource", markResource);

// POST /api/progress/:courseId/quiz         → submit quiz score
router.post("/:courseId/quiz", submitQuizScore);

// POST /api/progress/:courseId/project      → mark project done + optional github link
router.post("/:courseId/project", markProject);

module.exports = router;
