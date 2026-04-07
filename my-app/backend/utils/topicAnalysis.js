// backend/utils/topicAnalysis.js  (v3)
// ─────────────────────────────────────────────────────────────────────────────
// Pure functions — no DB calls, no side effects.
//
// Two levels of analysis:
//   1. Topic level  — did the student pass this topic quiz? (for week completion)
//   2. Subtopic level — which specific sub-concepts did they get wrong?
//                       (for targeted re-quiz and chatbot help)
// ─────────────────────────────────────────────────────────────────────────────

const PASS_SCORE = 3; // 3/5 correct = passed a topic quiz (60%)
const WEAK_THRESHOLD = 0.5; // < 50% on a subtopic = weak subtopic
const PASS_THRESHOLD = 0.75; // 75% of topics must be passed for week quiz completion

/**
 * Analyse a single topic quiz attempt history.
 * Returns subtopic-level stats from the latest attempt.
 *
 * @param {Array} attempts - AttemptSchema[] for one topic
 * @returns {Array} subtopicStats: [{ subtopic, correct, total, accuracy, isWeak }]
 */
function analyzeSubtopics(attempts) {
  if (!attempts || attempts.length === 0) return [];

  // Use latest attempt as the signal (student's most recent performance)
  const latest = attempts[attempts.length - 1];
  const map = {};

  for (const r of latest.results || []) {
    const key = r.subtopic || r.topic || "General";
    if (!map[key]) map[key] = { correct: 0, total: 0 };
    map[key].total++;
    if (r.correct) map[key].correct++;
  }

  return Object.entries(map).map(([subtopic, { correct, total }]) => ({
    subtopic,
    correct,
    total,
    accuracy: total > 0 ? correct / total : 0,
    isWeak: total > 0 && correct / total < WEAK_THRESHOLD,
  }));
}

/**
 * Get just the weak subtopic names from a topic's attempt history.
 */
function getWeakSubtopics(attempts) {
  return analyzeSubtopics(attempts)
    .filter((s) => s.isWeak)
    .map((s) => s.subtopic);
}

/**
 * Check whether a week's quiz requirement is met.
 * Needs at least PASS_THRESHOLD fraction of topics passed.
 *
 * @param {Array} topicQuizzes - TopicQuizSchema[] from UserProgress week
 * @param {number} totalTopics - how many topics exist in this week's curriculum
 * @returns {boolean}
 */
function isQuizRequirementMet(topicQuizzes, totalTopics) {
  if (!totalTopics || totalTopics === 0) return true;
  if (!topicQuizzes || topicQuizzes.length === 0) return false;

  const passedCount = topicQuizzes.filter((tq) => tq.passed).length;
  return passedCount / totalTopics >= PASS_THRESHOLD;
}

/**
 * Build a summary of all topics for a week.
 * Used by the frontend to show per-topic pass/fail status.
 *
 * @param {Array} topicQuizzes - from UserProgress
 * @param {string[]} allTopics - from curriculum week
 * @returns {Array} [{ topic, attempted, bestScore, passed, subtopicStats }]
 */
function buildTopicSummary(topicQuizzes, allTopics) {
  return allTopics.map((topic) => {
    const tq = topicQuizzes?.find((q) => q.topic === topic);
    if (!tq) {
      return {
        topic,
        attempted: false,
        bestScore: 0,
        passed: false,
        subtopicStats: [],
      };
    }
    return {
      topic,
      attempted: tq.attempts?.length > 0,
      bestScore: tq.bestScore,
      passed: tq.passed,
      subtopicStats: analyzeSubtopics(tq.attempts),
    };
  });
}

module.exports = {
  analyzeSubtopics,
  getWeakSubtopics,
  isQuizRequirementMet,
  buildTopicSummary,
  PASS_SCORE,
  WEAK_THRESHOLD,
  PASS_THRESHOLD,
};
