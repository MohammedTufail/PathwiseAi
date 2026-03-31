// backend/utils/buildPrompt.js
// ─────────────────────────────────────────────────────────────────────────────
// Builds the system prompt sent to Groq on every request.
// Goal: max ~200 tokens in the system prompt so the majority of the
// context window is available for conversation history and the reply.
//
// Context object shape:
// {
//   subject:    "Java Backend Development",
//   weekNumber: 2,
//   weekTitle:  "Object Oriented Programming",
//   topics:     ["Classes and Objects", "Inheritance", "Polymorphism"],
//   quizScore:  7,          // null if not attempted
//   quizPassed: false,
//   mode:       "explain" | "hint" | "general"  (detected automatically)
// }
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detect the intent of a user message to shape the prompt mode.
 * Returns "hint" | "explain" | "general"
 */
function detectMode(message) {
  const m = message.toLowerCase();
  const isHint =
    m.includes("hint") ||
    m.includes("quiz") ||
    m.includes("answer") ||
    m.includes("question") ||
    m.includes("stuck");
  const isExplain =
    m.includes("explain") ||
    m.includes("what is") ||
    m.includes("how does") ||
    m.includes("why") ||
    m.includes("difference") ||
    m.includes("example");
  if (isHint) return "hint";
  if (isExplain) return "explain";
  return "general";
}

/**
 * Build the system prompt string.
 * @param {Object} ctx - context object (see shape above)
 * @param {string} userMessage - the current user message (for mode detection)
 * @returns {string}
 */
function buildSystemPrompt(ctx, userMessage = "") {
  const mode = ctx.mode || detectMode(userMessage);
  const topics = (ctx.topics || []).join(", ");
  const quizLine =
    ctx.quizScore != null
      ? `Quiz: ${ctx.quizScore}/10${ctx.quizPassed ? " (passed)" : " (not passed yet, needs 8)"}.`
      : "Quiz: not attempted yet.";

  // ── Base identity ────────────────────────────────────────────────────────
  const base = `You are PathwiseAI Assistant — a focused learning tutor.
Course: ${ctx.subject || "Software Development"}.
Week ${ctx.weekNumber || "?"}: ${ctx.weekTitle || "Current topic"}.
Topics this week: ${topics || "general programming"}.
${quizLine}`;

  // ── Mode-specific behaviour ───────────────────────────────────────────────
  const rules = {
    hint: `
Rules:
- Student is asking about a quiz question or is stuck.
- Give a HINT only — never give the direct answer.
- Ask a guiding question or point to the relevant concept.
- Keep it under 3 sentences.`,

    explain: `
Rules:
- Explain clearly using a simple real-world analogy or short code example.
- Use the current week's topics as your frame of reference.
- Keep it under 5 sentences. If showing code, max 8 lines.`,

    general: `
Rules:
- Answer concisely and practically.
- Relate to the current course context when relevant.
- Keep it under 4 sentences.`,
  };

  return (
    base +
    (rules[mode] || rules.general) +
    `
Always respond in plain text. No markdown headers. No bullet walls. Be encouraging.`
  );
}

module.exports = { buildSystemPrompt, detectMode };
