// components/progress/WeekProgressBar.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Compact 3-pill progress bar for a single week.
// Shows: resources X/Y | quiz score | project status
// Used inside WeekCard headers.
// ─────────────────────────────────────────────────────────────────────────────

import { CheckCircle2, BookOpen, Brain, Folder } from "lucide-react";
import type { WeekProgress } from "../../api/progressApi";

interface Props {
  weekProgress?: WeekProgress;
  totalResources: number; // total from curriculum (not just from DB)
}

const Pill = ({
  icon,
  label,
  done,
}: {
  icon: React.ReactNode;
  label: string;
  done: boolean;
}) => (
  <div
    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors duration-200 ${
      done
        ? "bg-green-500/12 border-green-500/25 text-green-400"
        : "bg-white/4 border-white/10 text-gray-500"
    }`}
  >
    {icon}
    {label}
  </div>
);

export default function WeekProgressBar({
  weekProgress,
  totalResources,
}: Props) {
  const completedResources =
    weekProgress?.resources.filter((r) => r.completed).length ?? 0;
  const resourcesDone =
    totalResources > 0 ? completedResources / totalResources >= 0.7 : false;

  const quizPassed = weekProgress?.quiz.passed ?? false;
  const bestScore = weekProgress?.quiz.bestScore ?? 0;
  const projectDone = weekProgress?.project.completed ?? false;

  return (
    <div className="flex items-center flex-wrap gap-2 mt-3">
      {/* Resources */}
      <Pill
        icon={<BookOpen className="h-3 w-3" />}
        label={`${completedResources}/${totalResources} articles`}
        done={resourcesDone}
      />

      {/* Quiz */}
      <Pill
        icon={<Brain className="h-3 w-3" />}
        label={
          quizPassed
            ? `${bestScore}/10 Passed`
            : bestScore > 0
              ? `${bestScore}/10`
              : "Quiz pending"
        }
        done={quizPassed}
      />

      {/* Project */}
      <Pill
        icon={<Folder className="h-3 w-3" />}
        label={projectDone ? "Project done" : "Project pending"}
        done={projectDone}
      />

      {/* Week completed badge */}
      {weekProgress?.isCompleted && (
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-500/15 border border-green-500/30 text-green-400 ml-auto">
          <CheckCircle2 className="h-3 w-3" />
          Week complete
        </div>
      )}
    </div>
  );
}
