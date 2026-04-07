// frontend/src/components/progress/TopicQuizBar.tsx  (new)
// ─────────────────────────────────────────────────────────────────────────────
// Replaces the single "Take Quiz" button in WeekCard.
// Shows one row per topic with:
//   - Topic name
//   - Pass/fail badge (or "Not attempted")
//   - Best score
//   - "Take Quiz" / "Retry" / "Practice weak topics" button
//
// Props:
//   topics       — topic names from curriculum
//   topicSummary — from useWeekQuizSummary hook
//   onStartQuiz  — (topic: string) => void
// ─────────────────────────────────────────────────────────────────────────────

import { motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Brain,
  RotateCcw,
  Target,
} from "lucide-react";
import type { TopicSummaryItem } from "../../api/quizApi";

interface Props {
  topics: string[];
  topicSummary: TopicSummaryItem[];
  onStartQuiz: (topic: string) => void;
  loading?: boolean;
}

export default function TopicQuizBar({
  topics,
  topicSummary,
  onStartQuiz,
  loading = false,
}: Props) {
  const passedCount = topicSummary.filter((t) => t.passed).length;
  const total = topics.length;

  return (
    <div className="mt-4 space-y-2">
      {/* Summary header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-3.5 w-3.5 text-green-400" />
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
            Topic Quizzes
          </p>
        </div>
        <span className="text-[11px] text-gray-500">
          {passedCount}/{total} passed
        </span>
      </div>

      {/* Per-topic rows */}
      {topics.map((topic, index) => {
        const summary = topicSummary.find((s) => s.topic === topic);
        const attempted = summary?.attempted ?? false;
        const passed = summary?.passed ?? false;
        const score = summary?.bestScore ?? 0;
        const hasWeak = (summary?.subtopicStats ?? []).some((s) => s.isWeak);

        return (
          <motion.div
            key={topic}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl border border-white/8 bg-white/3 hover:bg-white/5 transition-colors duration-200"
          >
            {/* Status icon + topic name */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {!attempted ? (
                <Clock className="h-3.5 w-3.5 text-gray-600 shrink-0" />
              ) : passed ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
              )}
              <span className="text-sm text-gray-300 truncate">{topic}</span>

              {/* Score badge */}
              {attempted && (
                <span
                  className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-semibold border ${
                    passed
                      ? "bg-green-500/10 border-green-500/20 text-green-400"
                      : "bg-red-500/10 border-red-500/20 text-red-400"
                  }`}
                >
                  {score}/5
                </span>
              )}
            </div>

            {/* Action button */}
            <div className="shrink-0">
              {!attempted ? (
                <button
                  onClick={() => onStartQuiz(topic)}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-600/20 hover:bg-green-600/35 border border-green-500/25 text-green-400 text-xs font-semibold disabled:opacity-40 transition-all duration-200"
                >
                  Take Quiz
                </button>
              ) : hasWeak && !passed ? (
                <button
                  onClick={() => onStartQuiz(topic)}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/25 text-amber-400 text-xs font-semibold disabled:opacity-40 transition-all duration-200"
                >
                  <Target className="h-3 w-3" />
                  Practice
                </button>
              ) : (
                <button
                  onClick={() => onStartQuiz(topic)}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white text-xs font-semibold disabled:opacity-40 transition-all duration-200"
                >
                  <RotateCcw className="h-3 w-3" />
                  Retry
                </button>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
