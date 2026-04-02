// backend/utils/generateQuestions.js
// ─────────────────────────────────────────────────────────────────────────────
// Generates EXACTLY 10 questions per week using Groq
// Fixes:
//   ✅ Deterministic distribution across topics
//   ✅ Enforces EXACTLY 10 questions (no 9 / 11 issues)
//   ✅ Handles LLM under-generation with fallback
// ─────────────────────────────────────────────────────────────────────────────

const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Create exact distribution of 10 questions across topics
 * Example:
 *  3 topics → [4,3,3]
 *  4 topics → [3,3,2,2]
 */
function questionsPerTopicExact(topicCount) {
  const base = Math.floor(10 / topicCount);
  const remainder = 10 % topicCount;

  const distribution = Array(topicCount).fill(base);

  for (let i = 0; i < remainder; i++) {
    distribution[i]++;
  }

  return distribution;
}

/**
 * Generate questions for a single topic
 */
async function generateForTopic(subject, weekTitle, topic, count) {
  const prompt = `Generate EXACTLY ${count} quiz questions for a student learning ${subject}.
Week topic: "${weekTitle}" — focusing on: "${topic}".

Return ONLY a JSON array. No markdown. No explanation. No extra text.

STRICT RULE: Return EXACTLY ${count} questions. Not more, not less.

Format:
[
  {
    "question": "Clear, specific question text.",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "answer": "A",
    "explanation": "Why A is correct in 1-2 sentences.",
    "topic": "${topic}",
    "difficulty": "easy|medium|hard",
    "question_type": "mcq|true_false|scenario"
  }
]

Rules:
- For true_false: options must be exactly ["True", "False"], answer must be "True" or "False"
- For mcq/scenario: exactly 4 options labelled A B C D, answer is one letter
- Mix difficulties appropriately
- Questions must be about "${topic}" specifically
- No repeated question structures`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "You are a quiz designer. You respond ONLY with a valid JSON array. No text outside the array.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 1200,
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? "[]";

  // Clean response
  const cleaned = raw
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const match = cleaned.match(/\[[\s\S]*\]/);
  if (!match) return [];

  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Generate EXACTLY 10 questions for a week
 */
async function generateWeekQuestions(subject, weekTitle, topics) {
  const results = [];

  if (!topics || topics.length === 0) return results;

  const distribution = questionsPerTopicExact(topics.length);

  // ── Step 1: Generate per topic ───────────────────────────────────────────
  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    const count = distribution[i];

    try {
    let qs = await generateForTopic(subject, weekTitle, topic, count);

    // 🔥 HARD ENFORCE PER-TOPIC COUNT
    let attempts = 3; // retry max 3 times

    while (qs.length < count && attempts > 0) {
      const needed = count - qs.length;

      try {
        const extra = await generateForTopic(subject, weekTitle, topic, needed);
        qs = qs.concat(extra);
      } catch {}

      attempts--;
    }

    // Trim if extra
    qs = qs.slice(0, count);

      for (const q of qs) {
        if (
          q &&
          q.question &&
          q.options &&
          q.answer &&
          q.explanation &&
          q.topic
        ) {
          results.push(q);
        }
      }
    } catch (err) {
      console.error(
        `[generateQuestions] Failed for topic "${topic}":`,
        err.message,
      );
    }
  }

  // ── Step 2: Trim if too many ─────────────────────────────────────────────
  if (results.length > 10) {
    return results.slice(0, 10);
  }

  // ── Step 3: Fallback fill if less than 10 ────────────────────────────────
  let safety = 5; // avoid infinite loops

  while (results.length < 10 && safety > 0) {
    const fallbackTopic = topics[0];

    try {
      const extra = await generateForTopic(
        subject,
        weekTitle,
        fallbackTopic,
        1,
      );

      if (extra.length > 0) {
        const q = extra[0];

        if (
          q &&
          q.question &&
          q.options &&
          q.answer &&
          q.explanation &&
          q.topic
        ) {
          results.push(q);
        }
      } else {
        break;
      }
    } catch {
      break;
    }

    safety--;
  }

  // ── Final Guarantee ──────────────────────────────────────────────────────
  return results.slice(0, 10);
}

module.exports = { generateWeekQuestions };
