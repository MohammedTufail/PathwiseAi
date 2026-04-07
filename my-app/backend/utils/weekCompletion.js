// backend/utils/weekCompletion.js  (v3)
// ─────────────────────────────────────────────────────────────────────────────
// Pure function — no DB calls.
// Week is complete when ALL THREE conditions are met:
//   1. Resources ≥ 70% completed
//   2. At least 75% of topic quizzes passed
//   3. Project done
//
// The week.topicQuizzes array is checked against totalTopics.
// If totalTopics is not passed, falls back to topicQuizzes.length.
// ─────────────────────────────────────────────────────────────────────────────

const { isQuizRequirementMet } = require("./topicAnalysis");

const RESOURCE_THRESHOLD = 0.7;

/**
 * @param {Object} week         - WeekSchema subdocument
 * @param {number} totalTopics  - how many topics in this curriculum week
 * @returns {boolean}
 */
function isWeekComplete(week, totalTopics = 0) {
  // ── 1. Resources ──────────────────────────────────────────────────────────
  const resources = week.resources || [];
  let resourcesMet = true;
  if (resources.length > 0) {
    const done = resources.filter((r) => r.completed).length;
    resourcesMet = done / resources.length >= RESOURCE_THRESHOLD;
  }

  // ── 2. Topic quizzes ──────────────────────────────────────────────────────
  const topicCount = totalTopics || (week.topicQuizzes?.length ?? 0);
  const quizMet = isQuizRequirementMet(week.topicQuizzes, topicCount);

  // ── 3. Project ────────────────────────────────────────────────────────────
  const projectMet = !!week.project?.completed;

  return resourcesMet && quizMet && projectMet;
}

module.exports = { isWeekComplete, RESOURCE_THRESHOLD };
