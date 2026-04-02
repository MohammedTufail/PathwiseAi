// backend/models/UserProgress.js  (updated)
// ─────────────────────────────────────────────────────────────────────────────
// Changes from v1:
//   - QuizSchema now has an `attempts` array instead of a flat score
//   - Each attempt stores per-question results (questionIndex + correct)
//   - bestScore and passed are STILL kept as top-level fields for fast
//     week-completion checks (no need to iterate attempts for that)
//   - Topic analysis is derived from attempts at read time — not stored
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

// ── Per-question result inside one attempt ────────────────────────────────────
const QuestionResultSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true }, // index in WeekQuiz.questions
    topic: { type: String, required: true }, // denormalised for fast analysis
    correct: { type: Boolean, required: true },
    selected: { type: String, default: "" }, // what the user chose
  },
  { _id: false },
);

// ── One quiz attempt ──────────────────────────────────────────────────────────
const AttemptSchema = new mongoose.Schema(
  {
    score: { type: Number, required: true }, // correct count out of totalQuestions
    total: { type: Number, required: true }, // total questions in that attempt
    results: { type: [QuestionResultSchema], default: [] },
    attemptedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

// ── Quiz (per week, per user) ──────────────────────────────────────────────────
const QuizSchema = new mongoose.Schema(
  {
    bestScore: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
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
    quiz: { type: QuizSchema, default: () => ({}) },
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
