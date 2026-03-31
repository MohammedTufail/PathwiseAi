// hooks/useProgress.ts
// ─────────────────────────────────────────────────────────────────────────────
// Central hook for all progress state.
// Components consume this — they never call progressApi directly.
//
// Usage:
//   const { progress, loading, error, actions } = useProgress(courseId);
//
// actions expose:
//   openResource(weekNumber, resourceId, url)  → marks resource complete + opens URL
//   saveQuizScore(weekNumber, score)           → submits score to backend
//   completeProject(weekNumber, githubLink?)   → marks project done
//
// Helper selectors (derived from progress) are also returned:
//   getWeekProgress(weekNumber)  → WeekProgress | undefined
//   isWeekLocked(weekNumber)     → true if previous week not completed
//   resourceStats(weekNumber)    → { completed, total }
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import {
  fetchProgress,
  markResourceComplete,
  submitQuizScore,
  markProjectDone,
} from "../api/progressApi";
import type { UserProgressData, WeekProgress } from "../api/progressApi";

export function useProgress(courseId: string) {
  const [progress, setProgress] = useState<UserProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Load on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!courseId) return;

    setLoading(true);
    fetchProgress(courseId)
      .then((data) => {
        setProgress(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [courseId]);

  // ── Generic mutation wrapper ───────────────────────────────────────────────
  // Calls the API, updates state optimistically on success.
  const mutate = useCallback(async (fn: () => Promise<UserProgressData>) => {
    try {
      const updated = await fn();
      setProgress(updated);
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      throw err;
    }
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────

  /** Open a resource link and mark it as completed in the background */
  const openResource = useCallback(
    (weekNumber: number, resourceId: string, url: string) => {
      window.open(url, "_blank", "noopener,noreferrer");
      // Fire-and-forget — don't block the UI waiting for this
      mutate(() =>
        markResourceComplete(courseId, weekNumber, resourceId, url),
      ).catch(() => {}); // already set error state inside mutate
    },
    [courseId, mutate],
  );

  /** Submit a quiz score after the user finishes a quiz attempt */
  const saveQuizScore = useCallback(
    (weekNumber: number, score: number) =>
      mutate(() => submitQuizScore(courseId, weekNumber, score)),
    [courseId, mutate],
  );

  /** Mark the project as done, optionally saving a GitHub link */
  const completeProject = useCallback(
    (weekNumber: number, githubLink = "") =>
      mutate(() => markProjectDone(courseId, weekNumber, githubLink)),
    [courseId, mutate],
  );

  // ── Selectors ─────────────────────────────────────────────────────────────

  /** Find a week's progress by weekNumber */
  const getWeekProgress = useCallback(
    (weekNumber: number): WeekProgress | undefined =>
      progress?.weeks.find((w) => w.weekNumber === weekNumber),
    [progress],
  );

  /**
   * Week 1 is always unlocked.
   * Week N is locked if week N-1 is not completed.
   */
  const isWeekLocked = useCallback(
    (weekNumber: number): boolean => {
      if (weekNumber <= 1) return false;
      const prev = progress?.weeks.find((w) => w.weekNumber === weekNumber - 1);
      // If no progress entry exists for the previous week, it's not completed
      return !(prev?.isCompleted ?? false);
    },
    [progress],
  );

  /**
   * Returns { completed, total } resource counts for a week.
   * Pass the total resource count from the curriculum (not from DB) since
   * resources are only added to DB once they're opened.
   */
  const resourceStats = useCallback(
    (weekNumber: number, totalInCurriculum: number) => {
      const week = getWeekProgress(weekNumber);
      const completed = week?.resources.filter((r) => r.completed).length ?? 0;
      return { completed, total: totalInCurriculum };
    },
    [getWeekProgress],
  );

  return {
    progress,
    loading,
    error,
    actions: { openResource, saveQuizScore, completeProject },
    selectors: { getWeekProgress, isWeekLocked, resourceStats },
  };
}
