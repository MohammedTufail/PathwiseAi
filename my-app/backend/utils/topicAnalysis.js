// backend/utils/topicAnalysis.js
// ─────────────────────────────────────────────────────────────────────────────
// Pure functions — no DB calls.
// Derive weak topics from a user's quiz attempt history.
//
// A topic is "weak" if the student got < WEAK_THRESHOLD of its questions
// correct across ALL attempts (uses the BEST attempt per topic to be fair).
// ─────────────────────────────────────────────────────────────────────────────

const WEAK_THRESHOLD = 0.6; // < 60% correct on a topic = weak

/**
 * Given all attempts for a week, compute per-topic accuracy.
 *
 * @param {Array} attempts  - AttemptSchema[] from UserProgress
 * @returns {Array} topicStats:
 *   [{ topic, correct, total, accuracy, isWeak }]
 */
function analyzeTopics(attempts) {
  if (!attempts || attempts.length === 0) return [];

  // Use only the most recent attempt for topic analysis.
  // Rationale: the student may have improved — punishing them for old mistakes
  // produces confusing "weak topic" lists. Latest attempt is most accurate signal.
  const latest = attempts[attempts.length - 1];

  // Group by topic
  const map = {};
  for (const result of latest.results || []) {
    const t = result.topic || "Unknown";
    if (!map[t]) map[t] = { correct: 0, total: 0 };
    map[t].total++;
    if (result.correct) map[t].correct++;
  }

  return Object.entries(map).map(([topic, { correct, total }]) => ({
    topic,
    correct,
    total,
    accuracy: total > 0 ? correct / total : 0,
    isWeak: total > 0 && correct / total < WEAK_THRESHOLD,
  }));
}

/**
 * Returns only the weak topic names (strings).
 * Convenience wrapper for the route handler.
 */
function getWeakTopics(attempts) {
  return analyzeTopics(attempts)
    .filter((t) => t.isWeak)
    .map((t) => t.topic);
}

module.exports = { analyzeTopics, getWeakTopics, WEAK_THRESHOLD };
