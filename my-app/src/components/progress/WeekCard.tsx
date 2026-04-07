// frontend/src/components/progress/WeekCard.tsx  (v3 — full replacement)
// ─────────────────────────────────────────────────────────────────────────────
// Changes from v2:
//   - QuizStatus (single quiz button) replaced by TopicQuizBar (per-topic)
//   - useWeekQuizSummary hook fetches topic pass/fail from backend on expand
//   - QuizModal receives topic + open/close state
//   - onSendToChat prop threads through to open ChatWidget with pre-filled message
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Calendar,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "../button";
import { GlowingEffect } from "../ui/glowing-effect";
import WeekProgressBar from "./WeekProgressBar";
import ResourceList from "./ResourceList";
import ProjectSection from "./ProjectSection";
import TopicQuizBar from "./TopicQuizBar";
import QuizModal from "../quiz/QuizModal";
import { fetchWeekSummary } from "../../api/quizApi";
import type { TopicSummaryItem } from "../../api/quizApi";
import type { WeekProgress } from "../../api/progressApi";

import { CoolMode } from "../ui/cool-mode";
// ─── Types ────────────────────────────────────────────────────────────────────

interface ResourceItem {
  title?: string;
  url: string;
  name?: string;
  stars?: number;
}

interface WeekData {
  week: number;
  title: string;
  topics: string[];
  project: string;
  resources?: {
    [topic: string]: { videos: ResourceItem[]; repos: ResourceItem[] };
  };
}

interface ProgressActions {
  openResource: (weekNumber: number, resourceId: string, url: string) => void;
  saveQuizScore: (weekNumber: number, score: number) => Promise<unknown>;
  completeProject: (
    weekNumber: number,
    githubLink?: string,
  ) => Promise<unknown>;
 
}

interface Props {
  week: WeekData;
  index: number;
  subject: string;
  courseId: string;
  weekProgress: WeekProgress | undefined;
  isLocked: boolean;
  actions: ProgressActions;
  onSendToChat?: (prompt: string) => void; // opens ChatWidget pre-filled
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WeekCard({
  week,
  index,
  subject,
  courseId,
  weekProgress,
  isLocked,
  actions,
  onSendToChat,
}: Props) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const navigate = useNavigate();

  const [expanded, setExpanded] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [activeTopic, setActiveTopic] = useState("");
  const [topicSummary, setTopicSummary] = useState<TopicSummaryItem[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Fetch topic summary when expanded
  useEffect(() => {
    if (
      !expanded ||
      !courseId ||
      courseId === "undefined" ||
      courseId === "null" ||
      typeof courseId !== "string" ||
      !courseId.trim() ||
      isLocked
    ) {
      return;
    }

    setSummaryLoading(true);
    fetchWeekSummary(courseId, week.week, week.topics)
      .then((data) => setTopicSummary(data.topicSummary))
      .catch(() => setTopicSummary([]))
      .finally(() => setSummaryLoading(false));
  }, [expanded, courseId, week.week, week.topics, isLocked]);

  // Refresh summary after quiz closes
  const handleQuizClose = () => {
    setQuizOpen(false);
    setActiveTopic("");
    if (courseId) {
      fetchWeekSummary(courseId, week.week, week.topics)
        .then((data) => setTopicSummary(data.topicSummary))
        .catch(() => {});
    }
  };

  const handleStartTopicQuiz = (topic: string) => {
    setActiveTopic(topic);
    setQuizOpen(true);
  };

  const totalResources = week.topics.reduce((sum, t) => {
    const r = week.resources?.[t];
    return sum + (r?.videos.length ?? 0) + (r?.repos.length ?? 0);
  }, 0);

  const completedResourceIds =
    weekProgress?.resources
      .filter((r) => r.completed)
      .map((r) => r.resourceId) ?? [];

  return (
    <>
      {/* Topic Quiz Modal */}
      <QuizModal
        open={quizOpen}
        topic={activeTopic}
        courseId={courseId}
        weekNumber={week.week}
        weekTitle={week.title}
        subject={subject}
        totalTopicsInWeek={week.topics.length}
        onClose={handleQuizClose}
        onScoreSaved={async (_topic, score) => {
          await actions.saveQuizScore(week.week, score);
        }}
        onSendToChat={onSendToChat}
      />

      <motion.div
        ref={ref}
        initial={{ opacity: 0, x: -24 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{
          duration: 0.5,
          delay: index * 0.07,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        className="relative"
      >
        {/* Timeline dot */}
        <div className="absolute left-4 top-8 z-10">
          {weekProgress?.isCompleted ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-green-500 shadow-[0_0_8px_#22c55e]"
            />
          ) : isLocked ? (
            <div className="w-2.5 h-2.5 rounded-full bg-black border-2 border-white/15" />
          ) : (
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-green-400 shadow-[0_0_12px_#4ade80]"
            />
          )}
        </div>

        {/* Card */}
        <div
          className={`ml-10 relative rounded-2xl p-[1px] transition-all duration-500 ${
            isLocked
              ? "bg-gradient-to-r from-white/5 via-white/8 to-white/5"
              : "bg-gradient-to-r from-white/10 via-white/20 to-white/10 hover:from-green-500/20 hover:via-white/20 hover:to-green-500/10"
          }`}
        >
          {!isLocked && (
            <GlowingEffect
              spread={60}
              glow
              disabled={false}
              proximity={80}
              inactiveZone={0.05}
            />
          )}

          <div
            className={`relative rounded-2xl bg-gradient-to-br from-black via-gray-900/90 to-black p-5 border transition-all duration-300 ${
              isLocked
                ? "border-white/5 opacity-50 pointer-events-none select-none"
                : "border-white/8 hover:border-green-400/20"
            }`}
          >
            {/* Locked overlay */}
            {isLocked && (
              <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/20 z-10">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-white/10 text-gray-500 text-xs font-semibold">
                  <Lock className="h-3 w-3" />
                  Complete week {week.week - 1} to unlock
                </div>
              </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {weekProgress?.isCompleted && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/25 text-green-400 text-[10px] font-bold uppercase tracking-wider mb-2"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Done
                  </motion.div>
                )}
                <p className="text-xs text-gray-500 flex items-center gap-1.5 font-medium tracking-widest uppercase">
                  <Calendar className="h-3.5 w-3.5 text-green-400" />
                  Week {week.week}
                </p>
                <h3 className="text-base font-bold text-white mt-1">
                  {week.title}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Project:{" "}
                  <span className="text-green-400 font-medium">
                    {week.project}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  onClick={() =>
                    navigate(`/week/${week.week}`, { state: { week } })
                  }
                  className="rounded-xl bg-green-600 hover:bg-green-500 shadow-[0_0_8px_#16a34a] text-xs font-semibold"
                >
                  View Details
                </Button>
                {/* Chevron button with circle particles */}
                <CoolMode
                 
                >
                  <button
                    onClick={() => setExpanded((v) => !v)}
                    className="p-2 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition-all"
                  >
                    {expanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </CoolMode>
              </div>
            </div>

            {/* Progress bar pills */}
            <WeekProgressBar
              weekProgress={weekProgress}
              totalResources={totalResources}
            />

            {/* Expanded section */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="mt-5 pt-5 border-t border-white/8 space-y-5">
                    {/* Resources per topic */}
                    {week.topics.map((topic, ti) => {
                      const res = week.resources?.[topic];
                      if (!res) return null;
                      return (
                        <div key={topic}>
                          <p className="text-xs font-semibold text-white mb-1">
                            {topic}
                          </p>
                          <ResourceList
                            weekNumber={week.week}
                            topicIndex={ti}
                            topicName={topic}
                            videos={res.videos.map((v) => ({
                              title: v.title ?? "",
                              url: v.url,
                            }))}
                            repos={res.repos.map((r) => ({
                              name: r.name ?? "",
                              url: r.url,
                              stars: r.stars ?? 0,
                            }))}
                            completedResourceIds={completedResourceIds}
                            onOpen={(rid, url) =>
                              actions.openResource(week.week, rid, url)
                            }
                            onToggleDone={(rid) =>
                              actions.markResourceDone(week.week, rid)
                            }
                          />
                        </div>
                      );
                    })}

                    {/* Per-topic quiz bar */}
                    <TopicQuizBar
                      topics={week.topics}
                      topicSummary={topicSummary}
                      onStartQuiz={handleStartTopicQuiz}
                      loading={summaryLoading}
                    />

                    {/* Project */}
                    <ProjectSection
                      project={weekProgress?.project}
                      projectTitle={week.project}
                      onMarkDone={(githubLink) =>
                        actions.completeProject(
                          week.week,
                          githubLink,
                        ) as Promise<void>
                      }
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </>
  );
}
