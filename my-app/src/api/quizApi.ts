// frontend/src/api/quizApi.ts
// ─────────────────────────────────────────────────────────────────────────────
// All HTTP calls for the quiz system.
// QuizModal no longer calls Groq directly — everything goes through the backend.
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  question_type: "mcq" | "true_false" | "scenario";
}

export interface QuestionResult {
  questionIndex: number;
  topic: string;
  correct: boolean;
  selected: string;
}

export interface TopicStat {
  topic: string;
  correct: number;
  total: number;
  accuracy: number; // 0–1
  isWeak: boolean;
}

export interface AttemptResult {
  score: number;
  total: number;
  passed: boolean;
  bestScore: number;
  topicStats: TopicStat[];
  weakTopics: string[];
}

export interface AnalysisResult {
  topicStats: TopicStat[];
  weakTopics: string[];
  attempted: boolean;
  bestScore: number;
  passed: boolean;
  attemptCount: number;
}

// ── Helper ────────────────────────────────────────────────────────────────────

function getToken(): string {
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
    throw new Error(data.message ?? "Quiz API error");
  }
  return data as T;
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * Fetch (or generate) questions for a week.
 * If generating for the first time, pass subject/weekTitle/topics in the body.
 * Subsequent calls just fetch from cache — no body needed.
 */
export async function fetchWeekQuestions(
  courseId: string,
  weekNumber: number,
  opts?: { subject: string; weekTitle: string; topics: string[] },
): Promise<{ questions: QuizQuestion[]; cached: boolean }> {
  const data = await apiFetch<{ questions: QuizQuestion[]; cached: boolean }>(
    `/api/quiz/${courseId}/${weekNumber}`,
    opts ? { method: "POST", body: JSON.stringify(opts) } : { method: "GET" },
  );
  return data;
}

/**
 * Submit a completed attempt.
 * Returns score breakdown + topic analysis.
 */
export async function submitQuizAttempt(
  courseId: string,
  weekNumber: number,
  score: number,
  total: number,
  results: QuestionResult[],
): Promise<AttemptResult> {
  return apiFetch<AttemptResult>(
    `/api/quiz/${courseId}/${weekNumber}/attempt`,
    { method: "POST", body: JSON.stringify({ score, total, results }) },
  );
}

/**
 * Get topic analysis for a week (after at least one attempt).
 */
export async function fetchWeekAnalysis(
  courseId: string,
  weekNumber: number,
): Promise<AnalysisResult> {
  return apiFetch<AnalysisResult>(
    `/api/quiz/${courseId}/${weekNumber}/analysis`,
  );
}
