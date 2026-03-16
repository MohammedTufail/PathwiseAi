// ─── components/quiz/QuizResults.tsx ─────────────────────────────────────────
// Shown after the last question — score ring, per-difficulty breakdown,
// pass/fail message, and action buttons.
// ─────────────────────────────────────────────────────────────────────────────

import { motion } from "framer-motion";
import {
  Trophy,
  RotateCcw,
  X,
  CheckCircle2,
  XCircle,
  Minus,
} from "lucide-react";
import { Button } from "../button";
import ProgressRing from "../ProgressRing";
import type { QuizQuestion, AnswerState, Difficulty } from "./quiz.types";

// ─── helpers ─────────────────────────────────────────────────────────────────

const DIFF_ORDER: Difficulty[] = ["easy", "medium", "hard"];

const diffLabel: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

const diffColor: Record<Difficulty, { bar: string; text: string }> = {
  easy: { bar: "bg-green-500", text: "text-green-400" },
  medium: { bar: "bg-yellow-500", text: "text-yellow-400" },
  hard: { bar: "bg-red-500", text: "text-red-400" },
};

function getPassMessage(pct: number): { title: string; sub: string } {
  if (pct === 100)
    return { title: "Perfect score! 🎯", sub: "You've mastered this topic." };
  if (pct >= 80)
    return {
      title: "Excellent work!",
      sub: "You have a strong grasp of the material.",
    };
  if (pct >= 60)
    return {
      title: "Good effort!",
      sub: "A little more practice and you'll nail it.",
    };
  if (pct >= 40)
    return {
      title: "Keep going!",
      sub: "Review the explanations and try again.",
    };
  return {
    title: "Needs more practice.",
    sub: "Don't worry — revisit the topics and retry.",
  };
}

// ─── component ───────────────────────────────────────────────────────────────

interface Props {
  questions: QuizQuestion[];
  answers: AnswerState[];
  weekTitle: string;
  onRetry: () => void;
  onClose: () => void;
}

export default function QuizResults({
  questions,
  answers,
  weekTitle,
  onRetry,
  onClose,
}: Props) {
  const total = questions.length;
  const correct = answers.filter((a) => a.correct).length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const msg = getPassMessage(pct);

  // Per-difficulty stats
  const diffStats = DIFF_ORDER.map((diff) => {
    const qs = questions
      .map((q, i) => ({ q, a: answers[i] }))
      .filter(({ q }) => q.difficulty === diff);
    const tot = qs.length;
    const cor = qs.filter(({ a }) => a.correct).length;
    return {
      diff,
      total: tot,
      correct: cor,
      pct: tot > 0 ? Math.round((cor / tot) * 100) : 0,
    };
  }).filter((s) => s.total > 0);

  // Per-question summary rows
  const rows = questions.map((q, i) => ({
    index: i,
    question: q.question,
    topic: q.topic,
    correct: answers[i]?.correct ?? false,
    selected: answers[i]?.selected ?? "-",
    answer: q.answer,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex flex-col gap-6"
    >
      {/* ── Hero: ring + message ── */}
      <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl border border-white/10 bg-white/3">
        <div className="relative shrink-0">
          <ProgressRing
            progress={pct}
            size={88}
            strokeWidth={7}
            showLabel={false}
            className="text-white"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white leading-none">
              {pct}%
            </span>
            <span className="text-[10px] text-gray-400 mt-0.5">score</span>
          </div>
        </div>

        <div className="text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
            <Trophy className="h-4 w-4 text-yellow-400" />
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
              {weekTitle}
            </p>
          </div>
          <h3 className="text-xl font-bold text-white">{msg.title}</h3>
          <p className="text-sm text-gray-400 mt-1">{msg.sub}</p>
          <p className="text-sm text-gray-300 mt-2">
            <span className="text-green-400 font-bold">{correct}</span>
            <span className="text-gray-500"> / {total} correct</span>
          </p>
        </div>
      </div>

      {/* ── Difficulty breakdown ── */}
      {diffStats.length > 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {diffStats.map(({ diff, total: tot, correct: cor, pct: dp }) => (
            <motion.div
              key={diff}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: DIFF_ORDER.indexOf(diff) * 0.08 }}
              className="p-3 rounded-xl border border-white/10 bg-white/3 space-y-2"
            >
              <div className="flex justify-between items-center">
                <span
                  className={`text-xs font-semibold uppercase tracking-wider ${diffColor[diff].text}`}
                >
                  {diffLabel[diff]}
                </span>
                <span className="text-xs text-gray-400">
                  {cor}/{tot}
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/8 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${dp}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                  className={`h-full rounded-full ${diffColor[diff].bar}`}
                />
              </div>
              <p className="text-xs text-gray-500 text-right">{dp}%</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Per-question review list ── */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-white/10 bg-white/3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Question Review
          </p>
        </div>
        <div className="divide-y divide-white/5 max-h-64 overflow-y-auto">
          {rows.map((row, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-start gap-3 px-4 py-3"
            >
              {row.correct ? (
                <CheckCircle2 className="shrink-0 h-4 w-4 text-green-400 mt-0.5" />
              ) : (
                <XCircle className="shrink-0 h-4 w-4 text-red-400 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-300 truncate leading-snug">
                  {row.question}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {row.correct ? (
                    <span className="text-green-400">Correct</span>
                  ) : (
                    <>
                      <span className="text-red-400">
                        Your answer: {row.selected}
                      </span>
                      <span className="text-gray-600"> · </span>
                      <span className="text-green-400">
                        Correct: {row.answer}
                      </span>
                    </>
                  )}
                </p>
              </div>
              <span className="shrink-0 text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded-full truncate max-w-[80px]">
                {row.topic}
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
          className="flex items-center gap-2 text-gray-400 hover:text-white border border-white/10 hover:bg-white/5 rounded-xl"
        >
          <X className="h-4 w-4" />
          Close
        </Button>
        <Button
          onClick={onRetry}
          className="flex items-center gap-2 rounded-xl bg-green-600 hover:bg-green-500 shadow-[0_0_10px_#16a34a] hover:shadow-[0_0_18px_#22c55e] transition-all duration-300 font-semibold"
        >
          <RotateCcw className="h-4 w-4" />
          Retry Quiz
        </Button>
      </div>
    </motion.div>
  );
}
