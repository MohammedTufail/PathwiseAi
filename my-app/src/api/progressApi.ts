// api/progressApi.ts
// ─────────────────────────────────────────────────────────────────────────────
// All HTTP calls to the progress backend live here.
// Components never call fetch() directly — they use this module.
// Token is read from localStorage; replace with your auth context if needed.
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

// ── Types (mirrors backend schema) ───────────────────────────────────────────

export interface ResourceProgress {
  resourceId: string;
  url: string;
  completed: boolean;
  completedAt: string | null;
}

export interface QuizProgress {
  bestScore: number;
  passed: boolean;
  attempts: number;
  lastAttemptAt: string | null;
}

export interface ProjectProgress {
  completed: boolean;
  githubLink: string;
  completedAt: string | null;
}

export interface WeekProgress {
  weekNumber: number;
  resources: ResourceProgress[];
  quiz: QuizProgress;
  project: ProjectProgress;
  isCompleted: boolean;
  completedAt: string | null;
}

export interface UserProgressData {
  _id: string;
  userId: string;
  courseId: string;
  weeks: WeekProgress[];
}

// ── Helper ────────────────────────────────────────────────────────────────────

function getToken(): string {
  // Replace this with your auth context / cookie approach
  return localStorage.getItem("token") ?? "";
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers ?? {}),
    },
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message ?? "API error");
  }
  return data.data as T;
}

// ── API calls ─────────────────────────────────────────────────────────────────

/** Load full progress for a course (creates empty doc on first call) */
export const fetchProgress = (courseId: string) =>
  apiFetch<UserProgressData>(`/api/progress/${courseId}`);

/** Mark a resource link as visited / completed */
export const markResourceComplete = (
  courseId: string,
  weekNumber: number,
  resourceId: string,
  url: string,
) =>
  apiFetch<UserProgressData>(`/api/progress/${courseId}/resource`, {
    method: "POST",
    body: JSON.stringify({ weekNumber, resourceId, url }),
  });

/** Submit a quiz score — backend keeps the best score */
export const submitQuizScore = (
  courseId: string,
  weekNumber: number,
  score: number,
) =>
  apiFetch<UserProgressData>(`/api/progress/${courseId}/quiz`, {
    method: "POST",
    body: JSON.stringify({ weekNumber, score }),
  });

/** Mark the weekly project as done, optionally with a GitHub link */
export const markProjectDone = (
  courseId: string,
  weekNumber: number,
  githubLink = "",
) =>
  apiFetch<UserProgressData>(`/api/progress/${courseId}/project`, {
    method: "POST",
    body: JSON.stringify({ weekNumber, githubLink }),
  });
