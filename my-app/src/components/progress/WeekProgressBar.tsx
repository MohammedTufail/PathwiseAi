// frontend/src/components/progress/WeekProgressBar.tsx  (v3)
// Updated: quiz pill now shows "X/Y topics passed" instead of single score.

import { CheckCircle2, BookOpen, Brain, Folder } from "lucide-react";
import type { WeekProgress } from "../../api/progressApi";

interface Props {
  weekProgress: WeekProgress | undefined;
  totalResources: number;
  topicsPassed?: number; // from TopicSummaryItem[]
  totalTopics?: number;
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
  topicsPassed = 0,
  totalTopics = 0,
}: Props) {
  const completedResources =
    weekProgress?.resources.filter((r) => r.completed).length ?? 0;
  const resourcesDone =
    totalResources > 0 && completedResources / totalResources >= 0.7;
  const quizDone = totalTopics > 0 && topicsPassed / totalTopics >= 0.75;
  const projectDone = weekProgress?.project?.completed ?? false;

  return (
    <div className="flex items-center flex-wrap gap-2 mt-3">
      <Pill
        icon={<BookOpen className="h-3 w-3" />}
        label={`${completedResources}/${totalResources} articles`}
        done={resourcesDone}
      />
      <Pill
        icon={<Brain className="h-3 w-3" />}
        label={
          totalTopics > 0
            ? `${topicsPassed}/${totalTopics} topics passed`
            : "Quizzes pending"
        }
        done={quizDone}
      />
      <Pill
        icon={<Folder className="h-3 w-3" />}
        label={projectDone ? "Project done" : "Project pending"}
        done={projectDone}
      />
      {weekProgress?.isCompleted && (
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-500/15 border border-green-500/30 text-green-400 ml-auto">
          <CheckCircle2 className="h-3 w-3" />
          Week complete
        </div>
      )}
    </div>
  );
}
