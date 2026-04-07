// backend/utils/generateQuestions.js  (v3)
// ─────────────────────────────────────────────────────────────────────────────
// Generates a focused question bank for ONE topic at a time.
// Each question now includes a `subtopic` field — a specific sub-concept
// within the topic (e.g. topic="Inheritance", subtopic="method overriding").
// This enables precise weakness detection at the subtopic level.
//
// Called once per topic on first quiz access. Results cached in WeekQuiz.topicBanks.
// ─────────────────────────────────────────────────────────────────────────────

const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const QUESTIONS_PER_TOPIC = 5; // fixed — enough for meaningful pass/fail per topic

/**
 * Generate questions for a single topic with subtopic tagging.
 *
 * @param {string} subject   - e.g. "Java Backend Development"
 * @param {string} weekTitle - e.g. "Object Oriented Programming"
 * @param {string} topic     - e.g. "Inheritance"
 * @returns {Promise<Array>} validated question objects
 */
async function generateTopicQuestions(subject, weekTitle, topic) {
  const prompt = `Generate exactly ${QUESTIONS_PER_TOPIC} quiz questions for a student learning "${subject}".
Week: "${weekTitle}". Topic: "${topic}".

Each question must test a SPECIFIC subtopic within "${topic}" (e.g. if topic is "Inheritance", subtopics might be "extends keyword", "method overriding", "super keyword", "constructor chaining").

Return ONLY a valid JSON array. No markdown. No explanation outside the array.

[
  {
    "question": "Specific, clear question text.",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "B",
    "explanation": "Why B is correct. Why others are wrong. 2 sentences max.",
    "topic": "${topic}",
    "subtopic": "specific concept being tested",
    "difficulty": "easy",
    "question_type": "mcq"
  }
]

Rules:
- Exactly ${QUESTIONS_PER_TOPIC} questions
- Mix: 2 easy, 2 medium, 1 hard
- Mix question_type: at least 1 true_false, 1 scenario, rest mcq
- true_false: options must be exactly ["True","False"], answer "True" or "False"
- mcq/scenario: exactly 4 options, answer is "A","B","C", or "D"
- subtopic must be a specific 2-4 word concept, not just repeat the topic name
- Questions must be about "${topic}" specifically — not generic programming
- No duplicate question structures`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "You are a quiz designer. Respond ONLY with a valid JSON array. No text outside the array.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 1800,
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? "[]";
  const cleaned = raw
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (!match) return [];

  let parsed;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  // Validate — drop any malformed questions
  return parsed.filter(
    (q) =>
      q.question &&
      Array.isArray(q.options) &&
      q.answer &&
      q.explanation &&
      q.topic,
  );
}

module.exports = { generateTopicQuestions, QUESTIONS_PER_TOPIC };
