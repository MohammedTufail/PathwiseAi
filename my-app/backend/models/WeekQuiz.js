// backend/models/WeekQuiz.js  (v3)
// ─────────────────────────────────────────────────────────────────────────────
// One document per (courseId + weekNumber).
// Questions are stored per-topic in a Map so each topic quiz is independent.
//
// Structure:
//   WeekQuiz {
//     courseId, weekNumber, weekTitle, subject, topics,
//     topicBanks: Map<topicName, TopicBank>
//   }
//
//   TopicBank {
//     questions: Question[],
//     generatedAt: Date
//   }
//
//   Question {
//     question, options, answer, explanation,
//     topic, subtopic,          ← NEW: subtopic for fine-grained analysis
//     difficulty, question_type
//   }
// ─────────────────────────────────────────────────────────────────────────────

const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: { type: [String], required: true },
    answer: { type: String, required: true },
    explanation: { type: String, required: true },
    topic: { type: String, required: true },
    subtopic: { type: String, default: "" }, // e.g. "method overriding", "super keyword"
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

const TopicBankSchema = new mongoose.Schema(
  {
    questions: { type: [QuestionSchema], default: [] },
    generatedAt: { type: Date, default: Date.now },
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
    // Map: topic name → TopicBank
    // Using Mixed so Mongoose doesn't try to enforce a fixed schema on keys
    topicBanks: { type: Map, of: TopicBankSchema, default: {} },
  },
  { timestamps: true },
);

WeekQuizSchema.index({ courseId: 1, weekNumber: 1 }, { unique: true });

module.exports = mongoose.model("WeekQuiz", WeekQuizSchema);
