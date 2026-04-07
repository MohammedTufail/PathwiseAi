// backend/routes/quizRoutes.js  (v3)
// Mounted at /api/quiz in app.js

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getTopicQuestions,
  submitTopicAttempt,
  getWeekSummary,
  getRemediation,
} = require("../controllers/quizController");

router.use(auth);

// GET  /api/quiz/:courseId/:weekNumber/summary
//   → week-level topic pass/fail summary
//   → query: ?topics=Topic1,Topic2,Topic3
router.get("/:courseId/:weekNumber/summary", getWeekSummary);

// GET  /api/quiz/:courseId/:weekNumber/:topic
//   → fetch (or generate) questions for one topic
//   → query on first call: ?subject=&weekTitle=
router.get("/:courseId/:weekNumber/:topic", getTopicQuestions);

// POST /api/quiz/:courseId/:weekNumber/:topic/attempt
//   → submit completed topic quiz attempt
router.post("/:courseId/:weekNumber/:topic/attempt", submitTopicAttempt);

// GET  /api/quiz/:courseId/:weekNumber/:topic/remediation
//   → weak subtopics + chatbot prompt + re-quiz questions
router.get("/:courseId/:weekNumber/:topic/remediation", getRemediation);

module.exports = router;
