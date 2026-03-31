// backend/controllers/chatController.js
// ─────────────────────────────────────────────────────────────────────────────
// Two endpoints:
//   POST /api/chat/:courseId       — send a message, get a reply
//   DELETE /api/chat/:courseId     — clear conversation history
//
// Token efficiency strategy:
//   - System prompt ~200 tokens (lean context injection)
//   - History capped at 10 messages (ChatSession pre-save hook)
//   - max_tokens: 400 per reply — enough for clear explanations
//   - temperature: 0.4 — creative enough to feel natural, focused enough to be accurate
// ─────────────────────────────────────────────────────────────────────────────
require("dotenv").config({ path: "./backend/.env" });

const ChatSession = require("../models/ChatSession");
const { buildSystemPrompt } = require("../utils/buildPrompt");

const Groq  = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ── POST /api/chat/:courseId ──────────────────────────────────────────────────
// Body: {
//   message:    string,       — the user's question
//   context: {                — current learning state
//     subject:    string,
//     weekNumber: number,
//     weekTitle:  string,
//     topics:     string[],
//     quizScore:  number|null,
//     quizPassed: boolean,
//   }
// }
const sendMessage = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { message, context = {} } = req.body;

    if (!message || !message.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "message is required" });
    }

    const trimmedMessage = message.trim().slice(0, 500); // guard against huge inputs

    // ── Load or create session ───────────────────────────────────────────────
    let session = await ChatSession.findOneAndUpdate(
      { userId: req.userId, courseId },
      { $setOnInsert: { userId: req.userId, courseId, messages: [] } },
      { upsert: true, new: true },
    );

    // ── Build messages array for Groq ────────────────────────────────────────
    const systemPrompt = buildSystemPrompt(context, trimmedMessage);

    const groqMessages = [
      { role: "system", content: systemPrompt },
      // Inject the last N messages as history
      ...session.messages.map((m) => ({ role: m.role, content: m.content })),
      // Current user message
      { role: "user", content: trimmedMessage },
    ];

    // ── Call Groq ────────────────────────────────────────────────────────────
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: groqMessages,
      temperature: 0.4,
      max_tokens: 400,
    });

    const reply =
      completion.choices[0]?.message?.content?.trim() ??
      "Sorry, I could not generate a response. Please try again.";

    // ── Persist the exchange ─────────────────────────────────────────────────
    session.messages.push({ role: "user", content: trimmedMessage });
    session.messages.push({ role: "assistant", content: reply });
    await session.save(); // pre-save hook trims to MAX_HISTORY

    res.json({ success: true, reply });
  } catch (err) {
    console.error("[chatController.sendMessage]", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to get AI response" });
  }
};

// ── DELETE /api/chat/:courseId ────────────────────────────────────────────────
// Clears conversation history for the current user + course.
const clearHistory = async (req, res) => {
  try {
    const { courseId } = req.params;

    await ChatSession.findOneAndUpdate(
      { userId: req.userId, courseId },
      { $set: { messages: [] } },
    );

    res.json({ success: true, message: "Conversation cleared" });
  } catch (err) {
    console.error("[chatController.clearHistory]", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to clear history" });
  }
};

module.exports = { sendMessage, clearHistory };
