// backend/models/ChatSession.js
// ─────────────────────────────────────────────────────────────────────────────
// One document per (userId + courseId).
// Only the last MAX_HISTORY messages are kept to control token usage.
// Context (week, topic, quiz score) is re-injected on every request —
// it is NOT stored here. That keeps the schema minimal.
// ─────────────────────────────────────────────────────────────────────────────

const mongoose = require("mongoose");

const MAX_HISTORY = 10; // messages kept per session (5 exchanges)

const MessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
  },
  { _id: false },
);

const ChatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: { type: String, required: true },
    messages: { type: [MessageSchema], default: [] },
  },
  { timestamps: true },
);

ChatSessionSchema.index({ userId: 1, courseId: 1 }, { unique: true });

// Trim to last MAX_HISTORY before save — keeps token usage bounded
ChatSessionSchema.pre("save", function () {
  if (this.messages.length > MAX_HISTORY) {
    this.messages = this.messages.slice(-MAX_HISTORY);
  }
  
});

module.exports = mongoose.model("ChatSession", ChatSessionSchema);
