// frontend/src/hooks/useQuiz.ts
// ─────────────────────────────────────────────────────────────────────────────
// All quiz state lives here. QuizModal is pure UI — it calls these actions.
//
// State machine:
//   idle → loading → active → submitting → results → (optional) focused
//
// "focused" stage: user has weak topics and wants a targeted mini-quiz.
// A focused mini-quiz uses the MOCK_QUESTION_BANK for the weak topics only
// (no extra Groq call — the bank covers all standard topics already).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from "react";
import { fetchWeekQuestions, submitQuizAttempt } from "../api/quizApi";
import type {
  QuizQuestion,
  QuestionResult,
  AttemptResult,
} from "../api/quizApi";

// ── Types ─────────────────────────────────────────────────────────────────────

export type QuizStage =
  | "idle"
  | "loading" // fetching/generating questions
  | "active" // answering questions
  | "submitting" // saving attempt to backend
  | "results" // showing score + topic breakdown
  | "focused-loading" // generating focused mini-quiz
  | "focused" // answering focused mini-quiz
  | "focused-results"; // showing focused quiz results

export interface AnswerState {
  selected: string | null;
  submitted: boolean;
  correct: boolean;
}

interface UseQuizReturn {
  stage: QuizStage;
  questions: QuizQuestion[];
  answers: AnswerState[];
  current: number;
  attemptResult: AttemptResult | null;
  error: string | null;
  isCached: boolean;
  // actions
  start: () => Promise<void>;
  selectAnswer: (label: string) => void;
  submitAnswer: () => void;
  nextQuestion: () => void;
  finishQuiz: () => Promise<void>;
  startFocused: (weakTopics: string[]) => void;
  reset: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────

export function useQuiz(
  courseId: string,
  weekNumber: number,
  weekTitle: string,
  subject: string,
  topics: string[],
  onScoreSaved?: (score: number) => Promise<void>,
): UseQuizReturn {
  const [stage, setStage] = useState<QuizStage>("idle");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<AnswerState[]>([]);
  const [current, setCurrent] = useState(0);
  const [attemptResult, setAttemptResult] = useState<AttemptResult | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  // ── Reset ─────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setStage("idle");
    setQuestions([]);
    setAnswers([]);
    setCurrent(0);
    setAttemptResult(null);
    setError(null);
    setIsCached(false);
  }, []);

  // ── Start quiz ────────────────────────────────────────────────────────────
  const start = useCallback(async () => {
    setStage("loading");
    setError(null);
    setCurrent(0);
    setAttemptResult(null);

    try {
      // ✅ ADD THIS HERE (TOP)
      if (!courseId || !weekNumber) {
        console.log("❌ Skipping API call (missing params):", {
          courseId,
          weekNumber,
        });
        return;
      }

      // Optional (recommended) → normalize courseId
      const formattedCourseId = courseId
        
      let result;

      try {
        // ✅ USE formattedCourseId
        result = await fetchWeekQuestions(formattedCourseId, weekNumber);
        console.log("useQuiz params:", { formattedCourseId, weekNumber });
      } catch {
        // Not cached — generate
        result = await fetchWeekQuestions(formattedCourseId, weekNumber, {
          subject,
          weekTitle,
          topics,
        });
      }

      if (!result.questions.length) {
        throw new Error("No questions available for this week.");
      }

      setQuestions(result.questions);
      setAnswers(
        result.questions.map(() => ({
          selected: null,
          submitted: false,
          correct: false,
        })),
      );
      setIsCached(result.cached);
      setStage("active");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quiz");
      setStage("idle");
    }
  }, [courseId, weekNumber, subject, weekTitle, topics]);

  // ── Select answer ─────────────────────────────────────────────────────────
  const selectAnswer = useCallback(
    (label: string) => {
      setAnswers((prev) =>
        prev.map((a, i) => (i === current ? { ...a, selected: label } : a)),
      );
    },
    [current],
  );

  // ── Submit current answer (reveal correct/wrong) ─────────────────────────
  const submitAnswer = useCallback(() => {
    const q = questions[current];
    const a = answers[current];
    if (!a.selected) return;

    const correct = a.selected === q.answer;
    setAnswers((prev) =>
      prev.map((ans, i) =>
        i === current ? { ...ans, submitted: true, correct } : ans,
      ),
    );
  }, [questions, answers, current]);

  // ── Next question ─────────────────────────────────────────────────────────
  const nextQuestion = useCallback(() => {
    if (current + 1 < questions.length) {
      setCurrent((c) => c + 1);
    }
  }, [current, questions.length]);

  // ── Finish quiz — save attempt + get analysis ────────────────────────────
  const finishQuiz = useCallback(async () => {
    setStage("submitting");

    // Build per-question results array
    const results: QuestionResult[] = answers.map((a, i) => ({
      questionIndex: i,
      topic: questions[i]?.topic ?? "Unknown",
      correct: a.correct,
      selected: a.selected ?? "",
    }));

    const score = answers.filter((a) => a.correct).length;
    const total = questions.length;

    try {
      const result = await submitQuizAttempt(
        courseId,
        weekNumber,
        score,
        total,
        results,
      );
      setAttemptResult(result);

      // Notify progress tracking hook (updates week completion check)
      if (onScoreSaved) {
        await onScoreSaved(score).catch(() => {});
      }

      setStage("results");
    } catch (err) {
      // Even if save fails, show results with local data
      setAttemptResult({
        score,
        total,
        passed: score >= 8,
        bestScore: score,
        topicStats: [],
        weakTopics: [],
      });
      setStage("results");
    }
  }, [answers, questions, courseId, weekNumber, onScoreSaved]);

  // ── Start focused mini-quiz on weak topics ────────────────────────────────
  // Uses the mock question bank filtered to weak topics — no extra Groq call
  const startFocused = useCallback(
    async (weakTopics: string[]) => {
      if (!weakTopics.length) return;

      setStage("focused-loading");
      setError(null);

      try {
        // Filter full question bank to weak topics only
        const focusedQs = questions.filter((q) =>
          weakTopics.some((wt) => wt.toLowerCase() === q.topic.toLowerCase()),
        );

        if (!focusedQs.length) {
          // Fallback: re-use 3 random questions from weak topics if filter fails
          const fallback = questions.slice(0, Math.min(3, questions.length));
          setQuestions(fallback);
          setAnswers(
            fallback.map(() => ({
              selected: null,
              submitted: false,
              correct: false,
            })),
          );
        } else {
          setQuestions(focusedQs);
          setAnswers(
            focusedQs.map(() => ({
              selected: null,
              submitted: false,
              correct: false,
            })),
          );
        }

        setCurrent(0);
        setAttemptResult(null);
        setStage("focused");
      } catch (err) {
        setError("Failed to load focused quiz");
        setStage("results");
      }
    },
    [questions],
  );

  return {
    stage,
    questions,
    answers,
    current,
    attemptResult,
    error,
    isCached,
    start,
    selectAnswer,
    submitAnswer,
    nextQuestion,
    finishQuiz,
    startFocused,
    reset,
  };
}
