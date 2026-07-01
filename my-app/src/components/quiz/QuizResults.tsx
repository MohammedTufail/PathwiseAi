// frontend/src/components/quiz/QuizResults.tsx  (v3)
// ─────────────────────────────────────────────────────────────────────────────
// Shows after a topic quiz attempt:
//   - Score ring + pass/fail
//   - Subtopic accuracy bars
//   - Weak subtopics panel with TWO help options:
//       1. "Get explanation" → fires chatbot prompt (opens ChatWidget)
//       2. "Re-quiz weak topics" → starts focused re-quiz
//   - Question review list
// ─────────────────────────────────────────────────────────────────────────────

import { motion } from "framer-motion";
import {
  Trophy,
  RotateCcw,
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MessageCircle,
  Target,
  TrendingUp,
} from "lucide-react";
import { Button } from "../button";
import ProgressRing from "../ProgressRing";
import type {
  QuizQuestion,
  TopicAttemptResult,
  RemediationData,
} from "../../api/quizApi";
import type { AnswerState } from "../../hooks/useTopicQuiz";

// ─── helpers ─────────────────────────────────────────────────────────────────

function getMessage(pct: number) {
  if (pct === 100)
    return { title: "Perfect!", sub: "You've mastered this topic." };
  if (pct >= 80) return { title: "Excellent!", sub: "Strong understanding." };
  if (pct >= 60)
    return { title: "Good job!", sub: "Review the weak subtopics below." };
  return {
    title: "Keep going!",
    sub: "Check the help options below to improve.",
  };
}

// ─── SubtopicBar ─────────────────────────────────────────────────────────────

const SubtopicBar = ({
  stat,
  i,
}: {
  stat: {
    subtopic: string;
    correct: number;
    total: number;
    accuracy: number;
    isWeak: boolean;
  };
  i: number;
}) => {
  const pct = Math.round(stat.accuracy * 100);
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.08 + i * 0.05 }}
      className="space-y-1"
    >
      <div className="flex justify-between text-xs">
        <span
          className={`truncate max-w-[180px] font-medium ${stat.isWeak ? "text-amber-400" : "text-gray-300"}`}
        >
          {stat.isWeak && (
            <AlertTriangle className="inline h-3 w-3 mr-1 text-amber-400" />
          )}
          {stat.subtopic}
        </span>
        <span
          className={`font-bold ml-2 shrink-0 ${stat.isWeak ? "text-amber-400" : "text-green-400"}`}
        >
          {stat.correct}/{stat.total}
        </span>
      </div>
      <div className="h-1.5 w-full bg-white/8 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{
            duration: 0.6,
            ease: "easeOut",
            delay: 0.12 + i * 0.05,
          }}
          className={`h-full rounded-full ${stat.isWeak ? "bg-amber-500" : "bg-green-500"}`}
        />
      </div>
    </motion.div>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  topic: string;
  questions: QuizQuestion[];
  answers: AnswerState[];
  attemptResult: TopicAttemptResult | null;
  remediation: RemediationData | null;
  isReQuiz?: boolean;
  loadingRemediation: boolean;
  onLoadRemediation: () => void;
  onStartReQuiz: () => void;
  onSendToChat: (prompt: string) => void; // opens ChatWidget with pre-filled message
  onRetry: () => void;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function QuizResults({
  topic,
  questions,
  answers,
  attemptResult,
  remediation,
  isReQuiz = false,
  loadingRemediation,
  onLoadRemediation,
  onStartReQuiz,
  
  onRetry,
  onClose,
}: Props) {
  const total = questions.length;
  const correct = answers.filter((a) => a.correct).length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const msg = getMessage(pct);

  const subtopicStats = attemptResult?.subtopicStats ?? [];
  const weakSubtopics = attemptResult?.weakSubtopics ?? [];
  const hasWeak = weakSubtopics.length > 0 && !isReQuiz;
  const showRemediation = remediation !== null;
  
const handleAskTutor = (prompt: string) => {
  window.dispatchEvent(
    new CustomEvent("open-chat", { detail: { message: prompt } }),
  );
};
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col gap-4"
    >
      {/* ── Score hero ── */}
      <div className="flex items-center gap-5 p-4 rounded-2xl border  border-white/10 bg-white/3">
        <div className="relative shrink-0 ">
          <ProgressRing
            progress={pct}
            size={80}
            strokeWidth={6}
            showLabel={false}
            className="text-white"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center ">
            <span className="text-xl font-bold text-white leading-none">
              {pct}%
            </span>
            <span className="text-[10px] text-gray-500 mt-0.5">score</span>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Trophy className="h-3.5 w-3.5 text-yellow-400" />
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
              {isReQuiz ? "Re-quiz" : topic}
            </p>
          </div>
          <h3 className="text-lg font-bold text-white">{msg.title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{msg.sub}</p>
          <p className="text-sm text-gray-300 mt-1.5">
            <span className="text-green-400 font-bold">{correct}</span>
            <span className="text-gray-600"> / {total}</span>
            {attemptResult?.passed && (
              <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/25 text-green-400 font-bold">
                PASSED
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ── Subtopic breakdown ── */}
      {subtopicStats.length > 0 && (
        <div className="rounded-xl border border-white/10 p-4 space-y-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-green-400" />
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
              Subtopic breakdown
            </p>
          </div>
          {subtopicStats.map((s, i) => (
            <SubtopicBar key={s.subtopic} stat={s} i={i} />
          ))}
        </div>
      )}

      {/* ── Weak subtopics + help ── */}
      {hasWeak && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-amber-500/25 bg-amber-500/8 p-4 space-y-3"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-300">
                Weak subtopics detected
              </p>
              <p className="text-xs text-amber-400/70 mt-0.5">
                {weakSubtopics.join(" · ")}
              </p>
            </div>
          </div>

          {/* Help options */}
          {!showRemediation ? (
            <button
              onClick={onLoadRemediation}
              disabled={loadingRemediation}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/25 text-amber-300 text-xs font-semibold disabled:opacity-50 transition-all"
            >
              {loadingRemediation
                ? "Loading help…"
                : "Get help with weak subtopics"}
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {/* Option 1: Chatbot explanation */}
              {remediation?.chatPrompt && (
                <button
                  onClick={() =>
                    remediation?.chatPrompt &&
                    handleAskTutor(remediation.chatPrompt)
                  }
                  className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/25 text-blue-300 text-xs font-semibold transition-all"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Ask AI tutor
                </button>
              )}

              {/* Option 2: Re-quiz */}
              {remediation?.reQuizQuestions?.length > 0 && (
                <button
                  onClick={onStartReQuiz}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/25 text-amber-300 text-xs font-semibold transition-all"
                >
                  <Target className="h-3.5 w-3.5" />
                  Re-quiz ({remediation.reQuizQuestions.length}q)
                </button>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* ── Question review ── */}
      <div className="rounded-xl border border-white/10 ">
        <div className="px-4 py-2 border-b border-white/10 bg-white/3 ">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
            Question review
          </p>
        </div>
        <div className="divide-y divide-white/5 max-h-48 overflow-y-auto no-scrollbar">
          {questions.map((q, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-start gap-3 px-4 py-2.5"
            >
              {answers[i]?.correct ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-400 mt-0.5 shrink-0" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-300 truncate">{q.question}</p>
                {!answers[i]?.correct && (
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    <span className="text-red-400">
                      You: {answers[i]?.selected ?? "—"}
                    </span>
                    {" · "}
                    <span className="text-green-400">Correct: {q.answer}</span>
                  </p>
                )}
              </div>
              <span className="text-[9px] text-gray-600 shrink-0 truncate max-w-[70px]">
                {q.subtopic || q.topic}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={onClose}
          className="flex items-center gap-2 text-gray-400 hover:text-white border border-white/10 rounded-xl"
        >
          <X className="h-4 w-4" /> Close
        </Button>
        <Button
          onClick={onRetry}
          className="flex items-center gap-2 rounded-xl bg-green-600 hover:bg-green-500 shadow-[0_0_8px_#16a34a] font-semibold"
        >
          <RotateCcw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    </motion.div>
  );
}
