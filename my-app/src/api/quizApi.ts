// frontend/src/api/quizApi.ts  (v3)

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  topic: string;
  subtopic: string;
  difficulty: "easy" | "medium" | "hard";
  question_type: "mcq" | "true_false" | "scenario";
}

export interface QuestionResult {
  questionIndex: number;
  topic: string;
  subtopic: string;
  correct: boolean;
  selected: string;
}

export interface SubtopicStat {
  subtopic: string;
  correct: number;
  total: number;
  accuracy: number;
  isWeak: boolean;
}

export interface TopicAttemptResult {
  topic: string;
  score: number;
  total: number;
  passed: boolean;
  bestScore: number;
  subtopicStats: SubtopicStat[];
  weakSubtopics: string[];
}

export interface TopicSummaryItem {
  topic: string;
  attempted: boolean;
  bestScore: number;
  passed: boolean;
  subtopicStats: SubtopicStat[];
}

export interface RemediationData {
  weakSubtopics: string[];
  chatPrompt: string | null;
  reQuizQuestions: QuizQuestion[];
}

// ── Helper ────────────────────────────────────────────────────────────────────

function getToken(): string {
  return localStorage.getItem("token") ?? "";
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(init.headers ?? {}),
    },
  });
  const data = await res.json();
  if (!res.ok || !data.success)
    throw new Error(data.message ?? "Quiz API error");
  return data as T;
}

// ── API calls ─────────────────────────────────────────────────────────────────

/** Fetch (or generate on first call) questions for a single topic */
export async function fetchTopicQuestions(
  courseId: string,
  weekNumber: number,
  topic: string,
  opts?: { subject: string; weekTitle: string },
): Promise<{ questions: QuizQuestion[]; cached: boolean }> {
  const encodedTopic = encodeURIComponent(topic);
  const query = opts
    ? `?subject=${encodeURIComponent(opts.subject)}&weekTitle=${encodeURIComponent(opts.weekTitle)}`
    : "";
  return apiFetch(
    `/api/quiz/${courseId}/${weekNumber}/${encodedTopic}${query}`,
  );
}

/** Submit a completed topic quiz attempt */
export async function submitTopicAttempt(
  courseId: string,
  weekNumber: number,
  topic: string,
  score: number,
  total: number,
  results: QuestionResult[],
  totalTopicsInWeek: number,
): Promise<TopicAttemptResult> {
  return apiFetch(
    `/api/quiz/${courseId}/${weekNumber}/${encodeURIComponent(topic)}/attempt`,
    {
      method: "POST",
      body: JSON.stringify({ score, total, results, totalTopicsInWeek }),
    },
  );
}

/** Get all topics' pass/fail status for a week */
export async function fetchWeekSummary(
  courseId: string,
  weekNumber: number,
  topics: string[],
): Promise<{ topicSummary: TopicSummaryItem[]; weekCompleted: boolean }> {
  const q = `?topics=${encodeURIComponent(topics.join(","))}`;
  return apiFetch(`/api/quiz/${courseId}/${weekNumber}/summary${q}`);
}

/** Get remediation data: weak subtopics, chatbot prompt, re-quiz questions */
export async function fetchRemediation(
  courseId: string,
  weekNumber: number,
  topic: string,
): Promise<RemediationData> {
  return apiFetch(
    `/api/quiz/${courseId}/${weekNumber}/${encodeURIComponent(topic)}/remediation`,
  );
}
