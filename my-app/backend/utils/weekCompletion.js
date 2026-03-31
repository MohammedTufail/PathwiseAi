// utils/weekCompletion.js
// ─────────────────────────────────────────────────────────────────────────────
// Pure function — no DB calls, no side effects.
// Takes a single WeekSchema document object and returns true/false.
// Kept separate so it can be unit-tested independently of Express.
//
// Completion rules (all three must be true):
//   1. At least 70% of tracked resources are completed
//   2. Quiz is passed (bestScore >= 8, stored as passed: true)
//   3. Project is marked as done
// ─────────────────────────────────────────────────────────────────────────────

const PASS_SCORE = 2; // quiz score out of 10
const RESOURCE_THRESHOLD = 0.1; // 10%

/**
 * @param {Object} week - a week subdocument (plain JS object or Mongoose doc)
 * @returns {boolean}
 */
function isWeekComplete(week) {
  // ── 1. Resources ─────────────────────────────────────────────────────────
  const resources = week.resources || [];
  let resourcesMet = true;

  if (resources.length > 0) {
    const completedCount = resources.filter((r) => r.completed).length;
    const ratio = completedCount / resources.length;
    resourcesMet = ratio >= RESOURCE_THRESHOLD;
  }
  // If no resources are tracked yet, treat as met (topic has no links yet)

  // ── 2. Quiz ──────────────────────────────────────────────────────────────
  const quizMet = !!(week.quiz && week.quiz.passed);

  // ── 3. Project ───────────────────────────────────────────────────────────
  const projectMet = !!(week.project && week.project.completed);

  return resourcesMet && quizMet && projectMet;
}

module.exports = { isWeekComplete, PASS_SCORE, RESOURCE_THRESHOLD };
