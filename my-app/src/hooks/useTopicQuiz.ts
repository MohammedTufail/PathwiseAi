// frontend/src/hooks/useTopicQuiz.ts  (v3)
// ─────────────────────────────────────────────────────────────────────────────
// State machine for a single topic quiz session:
//
//   idle
//     → loading        (fetching/generating questions)
//     → active         (student answering)
//     → submitting     (saving to backend)
//     → results        (showing score + subtopic breakdown)
//       → remediation  (showing weak subtopics + help options)
//       → requiz-loading
//       → requiz        (answering re-quiz on weak subtopics)
//       → requiz-results
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from "react";
import {
  fetchTopicQuestions,
  submitTopicAttempt,
  fetchRemediation,
} from "../api/quizApi";

import type {
  QuizQuestion,
  QuestionResult,
  TopicAttemptResult,
  RemediationData,
} from "../api/quizApi";

export type TopicQuizStage =
  | "idle"
  | "loading"
  | "active"
  | "submitting"
  | "results"
  | "remediation"
  | "requiz-loading"
  | "requiz"
  | "requiz-results";

export interface AnswerState {
  selected: string | null;
  submitted: boolean;
  correct: boolean;
}

export function useTopicQuiz(
  courseId: string,
  weekNumber: number,
  weekTitle: string,
  subject: string,
  totalTopicsInWeek: number,
  onScoreSaved?: (topic: string, score: number) => Promise<void>,
) {
  const [stage, setStage] = useState<TopicQuizStage>("idle");
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<AnswerState[]>([]);
  const [current, setCurrent] = useState(0);
  const [attemptResult, setAttemptResult] = useState<TopicAttemptResult | null>(
    null,
  );
  const [remediation, setRemediation] = useState<RemediationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  const resetAnswers = (qs: QuizQuestion[]) =>
    qs.map(() => ({ selected: null, submitted: false, correct: false }));

  // ── Start a topic quiz ────────────────────────────────────────────────────
  const start = useCallback(
    async (topicName: string) => {
      setStage("loading");
      setTopic(topicName);
      setError(null);
      setCurrent(0);
      setAttemptResult(null);
      setRemediation(null);

      try {
        const result = await fetchTopicQuestions(
          courseId,
          weekNumber,
          topicName,
          { subject, weekTitle },
        );

        setQuestions(result.questions);
        setAnswers(resetAnswers(result.questions));
        setIsCached(result.cached);
        setStage("active");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load quiz");
        setStage("idle");
      }
    },
    [courseId, weekNumber, subject, weekTitle],
  );

  // ── Answer actions ────────────────────────────────────────────────────────
  const selectAnswer = useCallback(
    (label: string) => {
      setAnswers((prev) =>
        prev.map((a, i) => (i === current ? { ...a, selected: label } : a)),
      );
    },
    [current],
  );

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

  const nextQuestion = useCallback(() => {
    if (current + 1 < questions.length) setCurrent((c) => c + 1);
  }, [current, questions.length]);

  // ── Finish — submit to backend ────────────────────────────────────────────
  const finishQuiz = useCallback(async () => {
    setStage("submitting");

    const results: QuestionResult[] = answers.map((a, i) => ({
      questionIndex: i,
      topic: questions[i]?.topic ?? "",
      subtopic: questions[i]?.subtopic ?? "",
      correct: a.correct,
      selected: a.selected ?? "",
    }));

    const score = answers.filter((a) => a.correct).length;
    const total = questions.length;

    try {
      const result = await submitTopicAttempt(
        courseId,
        weekNumber,
        topic,
        score,
        total,
        results,
        totalTopicsInWeek,
      );
      setAttemptResult(result);

      if (onScoreSaved) await onScoreSaved(topic, score).catch(() => {});

      setStage("results");
    } catch {
      setAttemptResult({
        topic,
        score,
        total,
        passed: score >= 3,
        bestScore: score,
        subtopicStats: [],
        weakSubtopics: [],
      });
      setStage("results");
    }
  }, [
    answers,
    questions,
    courseId,
    weekNumber,
    topic,
    totalTopicsInWeek,
    onScoreSaved,
  ]);

  // ── Load remediation data ─────────────────────────────────────────────────
  const loadRemediation = useCallback(async () => {
    
    try {
      const data = await fetchRemediation(courseId, weekNumber, topic);
      setRemediation(data);
      console.log("working...Remediation data:", data);
    } catch {
      setRemediation(null);
    }
  }, [courseId, weekNumber, topic]);

  // ── Start re-quiz on weak subtopics ───────────────────────────────────────
  const startReQuiz = useCallback(async () => {
    if (!remediation?.reQuizQuestions?.length) return;

    setStage("requiz-loading");
    await new Promise((r) => setTimeout(r, 400)); // brief pause for UX

    setQuestions(remediation.reQuizQuestions);
    setAnswers(resetAnswers(remediation.reQuizQuestions));
    setCurrent(0);
    setAttemptResult(null);
    setStage("requiz");
  }, [remediation]);

  // ── Finish re-quiz (local score only — no backend save for re-quizzes) ────
  const finishReQuiz = useCallback(() => {
    const score = answers.filter((a) => a.correct).length;
    const total = questions.length;
    setAttemptResult((prev) =>
      prev
        ? { ...prev, score, total, passed: score >= Math.ceil(total * 0.6) }
        : {
            topic,
            score,
            total,
            passed: false,
            bestScore: score,
            subtopicStats: [],
            weakSubtopics: [],
          },
    );
    setStage("requiz-results");
  }, [answers, questions, topic]);

  // ── Reset ─────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setStage("idle");
    setTopic("");
    setQuestions([]);
    setAnswers([]);
    setCurrent(0);
    setAttemptResult(null);
    setRemediation(null);
    setError(null);
    setIsCached(false);
  }, []);

  const isActive = stage === "active" || stage === "requiz";
  const isResults = stage === "results" || stage === "requiz-results";

  return {
    stage,
    topic,
    questions,
    answers,
    current,
    attemptResult,
    remediation,
    error,
    isCached,
    isActive,
    isResults,
    start,
    selectAnswer,
    submitAnswer,
    nextQuestion,
    finishQuiz,
    finishReQuiz,
    loadRemediation,
    startReQuiz,
    reset,
  };
}
