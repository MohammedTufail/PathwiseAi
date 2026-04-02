// backend/models/WeekQuiz.js
// ─────────────────────────────────────────────────────────────────────────────
// Stores the generated question bank for a (courseId + weekNumber) pair.
// Questions are generated ONCE and reused across all users and all attempts.
// This means:
//   - Zero Groq calls after first generation for that week
//   - Every student gets the same fair question set
//   - Scores are directly comparable across attempts
//
// One document per (courseId + weekNumber).
// Multiple users share the same question bank — it's course-level, not user-level.
// ─────────────────────────────────────────────────────────────────────────────

const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: { type: [String], required: true }, // 4 for MCQ, 2 for true_false
    answer: { type: String, required: true }, // "A"|"B"|"C"|"D"|"True"|"False"
    explanation: { type: String, required: true },
    topic: { type: String, required: true }, // which topic this question covers
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    question_type: {
      type: String,
      enum: ["mcq", "true_false", "scenario"],
      default: "mcq",
    },
  },
  { _id: false },
);

const WeekQuizSchema = new mongoose.Schema(
  {
    courseId: { type: String, required: true },
    weekNumber: { type: Number, required: true },
    weekTitle: { type: String, default: "" },
    subject: { type: String, default: "" },
    topics: { type: [String], default: [] },
    questions: { type: [QuestionSchema], default: [] },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// One question bank per course+week
WeekQuizSchema.index({ courseId: 1, weekNumber: 1 }, { unique: true });

module.exports = mongoose.model("WeekQuiz", WeekQuizSchema);
