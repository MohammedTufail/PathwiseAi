// components/progress/ResourceList.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Renders the list of videos + repos for a topic.
// Clicking any link calls openResource() which:
//   1. Opens the URL in a new tab
//   2. Marks it as completed in the DB (fire-and-forget)
// Completed links show a green checkmark; unvisited show a circle.
// ─────────────────────────────────────────────────────────────────────────────

import {
  CheckCircle2,
  Circle,
  ExternalLink,
  Youtube,
  Github,
} from "lucide-react";
import type { ResourceProgress } from "../../api/progressApi";

interface VideoResource {
  title: string;
  url: string;
}
interface RepoResource {
  name: string;
  url: string;
  stars: number;
}

interface Props {
  weekNumber: number;
  topicIndex: number;
  topicName: string;
  videos: VideoResource[];
  repos: RepoResource[];
  completedResourceIds: string[]; // from DB
  onOpen: (resourceId: string, url: string) => void;
}

function resourceId(
  weekNumber: number,
  topicIndex: number,
  type: "v" | "r",
  idx: number,
) {
  return `w${weekNumber}-t${topicIndex}-${type}${idx}`;
}

export default function ResourceList({
  weekNumber,
  topicIndex,
  topicName,
  videos,
  repos,
  completedResourceIds,
  onOpen,
}: Props) {
  const isCompleted = (id: string) => completedResourceIds.includes(id);

  if (videos.length === 0 && repos.length === 0) return null;

  return (
    <div className="mt-4 space-y-4">
      {/* Videos */}
      {videos.length > 0 && (
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
            <Youtube className="h-3 w-3 text-red-500" />
            Videos
          </p>
          <ul className="space-y-1.5">
            {videos.map((vid, i) => {
              const id = resourceId(weekNumber, topicIndex, "v", i);
              const done = isCompleted(id);
              return (
                <li key={id}>
                  <button
                    onClick={() => onOpen(id, vid.url)}
                    className="group flex items-center gap-2 w-full text-left text-sm hover:text-green-400 transition-colors duration-200"
                  >
                    {done ? (
                      <CheckCircle2 className="shrink-0 h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Circle className="shrink-0 h-3.5 w-3.5 text-gray-600" />
                    )}
                    <span
                      className={`flex-1 truncate ${done ? "text-green-400" : "text-gray-400"}`}
                    >
                      {vid.title}
                    </span>
                    <ExternalLink className="shrink-0 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-600" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Repos */}
      {repos.length > 0 && (
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
            <Github className="h-3 w-3 text-gray-400" />
            GitHub
          </p>
          <ul className="space-y-1.5">
            {repos.map((repo, i) => {
              const id = resourceId(weekNumber, topicIndex, "r", i);
              const done = isCompleted(id);
              return (
                <li key={id}>
                  <button
                    onClick={() => onOpen(id, repo.url)}
                    className="group flex items-center gap-2 w-full text-left text-sm hover:text-green-400 transition-colors duration-200"
                  >
                    {done ? (
                      <CheckCircle2 className="shrink-0 h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Circle className="shrink-0 h-3.5 w-3.5 text-gray-600" />
                    )}
                    <span
                      className={`flex-1 truncate ${done ? "text-green-400" : "text-gray-400"}`}
                    >
                      {repo.name}
                    </span>
                    <span className="shrink-0 text-[10px] text-yellow-500/70">
                      ⭐ {repo.stars.toLocaleString()}
                    </span>
                    <ExternalLink className="shrink-0 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-600" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
