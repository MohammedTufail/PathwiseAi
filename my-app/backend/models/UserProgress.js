// models/UserProgress.js
// ─────────────────────────────────────────────────────────────────────────────
// Single document per (userId + courseId) pair.
// All week progress is stored as an embedded array so one DB read loads
// everything the frontend needs for a full course view.
// ─────────────────────────────────────────────────────────────────────────────

const mongoose = require("mongoose");

// ── Resource (article / video link) ──────────────────────────────────────────
const ResourceSchema = new mongoose.Schema(
  {
    resourceId: { type: String, required: true }, // e.g. "w1-t0-r0"
    url: { type: String, default: "" },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { _id: false },
);

// ── Quiz ─────────────────────────────────────────────────────────────────────
const QuizSchema = new mongoose.Schema(
  {
    bestScore: { type: Number, default: 0 }, // highest score ever (0-10)
    passed: { type: Boolean, default: false }, // true once score >= 8, stays true
    attempts: { type: Number, default: 0 },
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

// ── Root document ─────────────────────────────────────────────────────────────
const UserProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: { type: String, required: true }, // e.g. "java-backend-w1"
    weeks: { type: [WeekSchema], default: [] },
  },
  { timestamps: true },
);

// Unique index: one progress doc per user-course pair
UserProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model("UserProgress", UserProgressSchema);
