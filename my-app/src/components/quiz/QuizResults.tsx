// frontend/src/components/quiz/QuizResults.tsx  (v2)
// ─────────────────────────────────────────────────────────────────────────────
// Shows:
//   - Score ring
//   - Per-topic accuracy bars (NEW)
//   - Weak topics list with "Practice weak topics" button (NEW)
//   - Per-question review list
//   - Retry / Close actions
// ─────────────────────────────────────────────────────────────────────────────

import { motion } from "framer-motion";
import {
  Trophy,
  RotateCcw,
  X,
  CheckCircle2,
  XCircle,
  Target,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { Button } from "../button";
import ProgressRing from "../ProgressRing";
import type { QuizQuestion, AttemptResult, TopicStat } from "../../api/quizApi";
import type { AnswerState } from "../../hooks/useQuiz";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPassMessage(pct: number) {
  if (pct === 100)
    return { title: "Perfect score!", sub: "You've mastered this week." };
  if (pct >= 80)
    return { title: "Excellent work!", sub: "Strong grasp of the material." };
  if (pct >= 60)
    return {
      title: "Good effort!",
      sub: "A bit more practice and you'll nail it.",
    };
  return {
    title: "Keep going!",
    sub: "Review the weak topics below and retry.",
  };
}

// ─── TopicBar ─────────────────────────────────────────────────────────────────

const TopicBar = ({ stat, index }: { stat: TopicStat; index: number }) => {
  const pct = Math.round(stat.accuracy * 100);
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.06 }}
      className="space-y-1"
    >
      <div className="flex items-center justify-between text-xs">
        <span
          className={`font-medium truncate max-w-[160px] ${stat.isWeak ? "text-amber-400" : "text-gray-300"}`}
        >
          {stat.isWeak && (
            <AlertTriangle className="inline h-3 w-3 mr-1 text-amber-400" />
          )}
          {stat.topic}
        </span>
        <span
          className={`font-bold shrink-0 ml-2 ${stat.isWeak ? "text-amber-400" : "text-green-400"}`}
        >
          {stat.correct}/{stat.total} ({pct}%)
        </span>
      </div>
      <div className="h-1.5 w-full bg-white/8 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{
            duration: 0.7,
            ease: "easeOut",
            delay: 0.15 + index * 0.06,
          }}
          className={`h-full rounded-full ${stat.isWeak ? "bg-amber-500" : "bg-green-500"}`}
        />
      </div>
    </motion.div>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  questions: QuizQuestion[];
  answers: AnswerState[];
  weekTitle: string;
  attemptResult: AttemptResult | null;
  isFocused?: boolean; // true when showing focused mini-quiz results
  onRetry: () => void;
  onFocused: (weakTopics: string[]) => void;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function QuizResults({
  questions,
  answers,
  weekTitle,
  attemptResult,
  isFocused = false,
  onRetry,
  onFocused,
  onClose,
}: Props) {
  const total = questions.length;
  const correct = answers.filter((a) => a.correct).length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const msg = getPassMessage(pct);
  const topicStats = attemptResult?.topicStats ?? [];
  const weakTopics = attemptResult?.weakTopics ?? [];
  const hasWeak = weakTopics.length > 0 && !isFocused;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-5"
    >
      {/* ── Score hero ── */}
      <div className="flex flex-col sm:flex-row items-center gap-5 p-5 rounded-2xl border border-white/10 bg-white/3">
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
              {isFocused ? "Focused Practice" : weekTitle}
            </p>
          </div>
          <h3 className="text-xl font-bold text-white">{msg.title}</h3>
          <p className="text-sm text-gray-400 mt-1">{msg.sub}</p>
          <p className="text-sm text-gray-300 mt-2">
            <span className="text-green-400 font-bold">{correct}</span>
            <span className="text-gray-500"> / {total} correct</span>
            {attemptResult?.passed && (
              <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/25 text-green-400 font-bold">
                PASSED
              </span>
            )}
          </p>
          {attemptResult && !isFocused && (
            <p className="text-[11px] text-gray-600 mt-1">
              Best score: {attemptResult.bestScore}/{total}
            </p>
          )}
        </div>
      </div>

      {/* ── Topic breakdown ── */}
      {topicStats.length > 0 && (
        <div className="rounded-xl border border-white/10 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-green-400" />
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Topic breakdown
            </p>
          </div>
          {topicStats.map((stat, i) => (
            <TopicBar key={stat.topic} stat={stat} index={i} />
          ))}
        </div>
      )}

      {/* ── Weak topics banner + focused quiz button ── */}
      {hasWeak && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-amber-500/25 bg-amber-500/8 p-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-300">
                Weak topics found
              </p>
              <p className="text-xs text-amber-400/70 mt-0.5">
                You scored below 60% on: {weakTopics.join(", ")}
              </p>
            </div>
          </div>
          <Button
            onClick={() => onFocused(weakTopics)}
            className="mt-3 w-full rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Target className="h-4 w-4" />
            Practice weak topics only
          </Button>
        </motion.div>
      )}

      {/* ── Question review list ── */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-white/10 bg-white/3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Question review
          </p>
        </div>
        <div className="divide-y divide-white/5 max-h-56 overflow-y-auto">
          {questions.map((q, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-start gap-3 px-4 py-3"
            >
              {answers[i]?.correct ? (
                <CheckCircle2 className="shrink-0 h-4 w-4 text-green-400 mt-0.5" />
              ) : (
                <XCircle className="shrink-0 h-4 w-4 text-red-400 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-300 truncate leading-snug">
                  {q.question}
                </p>
                <p className="text-[11px] mt-0.5">
                  {answers[i]?.correct ? (
                    <span className="text-green-400">Correct</span>
                  ) : (
                    <>
                      <span className="text-red-400">
                        Your answer: {answers[i]?.selected ?? "—"}
                      </span>
                      <span className="text-gray-600"> · </span>
                      <span className="text-green-400">
                        Correct: {q.answer}
                      </span>
                    </>
                  )}
                </p>
              </div>
              <span className="shrink-0 text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded-full truncate max-w-[80px]">
                {q.topic}
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
          className="flex items-center gap-2 rounded-xl bg-green-600 hover:bg-green-500 shadow-[0_0_10px_#16a34a] font-semibold"
        >
          <RotateCcw className="h-4 w-4" />
          {isFocused ? "Retry focused" : "Retry quiz"}
        </Button>
      </div>
    </motion.div>
  );
}
