// backend/models/UserProgress.js  (v3)
// ─────────────────────────────────────────────────────────────────────────────
// Key change from v2:
//   - week.quiz (single quiz) → week.topicQuizzes (array, one entry per topic)
//   - Each TopicQuiz tracks attempts with subtopic-level results
//   - week.quizSummary computed field: how many topics passed / total
//
// Week completion now checks:
//   - Resources ≥ 70% complete
//   - At least 75% of topic quizzes passed
//   - Project done
// ─────────────────────────────────────────────────────────────────────────────

const mongoose = require("mongoose");

// ── Resource ──────────────────────────────────────────────────────────────────
const ResourceSchema = new mongoose.Schema(
  {
    resourceId: { type: String, required: true },
    url: { type: String, default: "" },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { _id: false },
);

// ── Per-question result ───────────────────────────────────────────────────────
const QuestionResultSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    topic: { type: String, required: true },
    subtopic: { type: String, default: "" }, // for fine-grained weakness detection
    correct: { type: Boolean, required: true },
    selected: { type: String, default: "" },
  },
  { _id: false },
);

// ── One attempt ───────────────────────────────────────────────────────────────
const AttemptSchema = new mongoose.Schema(
  {
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    results: { type: [QuestionResultSchema], default: [] },
    attemptedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

// ── Per-topic quiz ────────────────────────────────────────────────────────────
const TopicQuizSchema = new mongoose.Schema(
  {
    topic: { type: String, required: true },
    bestScore: { type: Number, default: 0 },
    passed: { type: Boolean, default: false }, // bestScore >= PASS_SCORE, permanent
    attempts: { type: [AttemptSchema], default: [] },
    lastAttemptAt: { type: Date, default: null },
  },
  { _id: false },
);

// ── Project ───────────────────────────────────────────────────────────────────
const ProjectSchema = new mongoose.Schema(
  {
    completed: { type: Boolean, default: false },
    githubLink: { type: String, default: "" },
    completedAt: { type: Date, default: null },
  },
  { _id: false },
);

// ── Week ──────────────────────────────────────────────────────────────────────
const WeekSchema = new mongoose.Schema(
  {
    weekNumber: { type: Number, required: true },
    resources: { type: [ResourceSchema], default: [] },
    topicQuizzes: { type: [TopicQuizSchema], default: [] }, // one per topic
    project: { type: ProjectSchema, default: () => ({}) },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { _id: false },
);

// ── Root ──────────────────────────────────────────────────────────────────────
const UserProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: { type: String, required: true },
    weeks: { type: [WeekSchema], default: [] },
  },
  { timestamps: true },
);

UserProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model("UserProgress", UserProgressSchema);
