// components/progress/QuizStatus.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Displays current quiz status and provides the "Take Quiz" trigger.
// After a quiz attempt, calls onScoreSaved(score) which routes to useProgress.
//
// How to wire with QuizModal:
//   Pass onScoreSaved to QuizModal's onComplete prop (or call it inside
//   QuizResults when the user closes the results screen).
// ─────────────────────────────────────────────────────────────────────────────

import { Brain, CheckCircle2, XCircle, } from "lucide-react";
import QuizModal from "../quiz/QuizModal";
import type { QuizProgress } from "../../api/progressApi";

interface Props {
  courseId: string; // ✅ ADD THIS
  weekNumber: number;
  weekTitle: string;
  subject: string;
  topics: string[];
  quiz: QuizProgress | undefined;
  onScoreSaved: (score: number) => Promise<void>;
}

export default function QuizStatus({
  weekNumber,
  weekTitle,
  subject,
  topics,
  quiz,
  onScoreSaved,
}: Props) {
  const passed = quiz?.passed ?? false;
  const bestScore = quiz?.bestScore ?? 0;
  const attempts = quiz?.attempts ?? 0;

  
  return (
    <div className="flex items-center justify-between gap-3 mt-4 p-3 rounded-xl border border-white/8 bg-white/3">
      <div className="flex items-center gap-2">
        <div
          className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
            passed
              ? "bg-green-500/10 border border-green-500/20"
              : "bg-white/5 border border-white/10"
          }`}
        >
          <Brain
            className={`h-3.5 w-3.5 ${passed ? "text-green-400" : "text-gray-500"}`}
          />
        </div>

        <div>
          <p className="text-[11px] text-gray-600 uppercase tracking-widest font-semibold">
            Week Quiz
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {passed ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                <span className="text-sm font-semibold text-green-400">
                  {bestScore}/10 — Passed
                </span>
              </>
            ) : attempts > 0 ? (
              <>
                <XCircle className="h-3.5 w-3.5 text-red-400" />
                <span className="text-sm font-semibold text-red-400">
                  {bestScore}/10 — Not passed yet
                </span>
              </>
            ) : (
              <span className="text-sm text-gray-500">Not attempted</span>
            )}
          </div>
          {attempts > 0 && (
            <p className="text-[10px] text-gray-600 mt-0.5">
              {attempts} attempt{attempts !== 1 ? "s" : ""}
              {!passed && " · need 2/10 to pass"}
            </p>
          )}
        </div>
      </div>

      {/* QuizModal trigger — passes onComplete so score gets saved */}
      <QuizModal
        courseId={subject} // ⚠️ TEMP (see below)
        weekNumber={weekNumber}
        subject={subject}
        topics={topics}
        weekTitle={weekTitle}
        difficulty="mixed"
        total={10}
        onComplete={onScoreSaved}
      />
    </div>
  );
}
