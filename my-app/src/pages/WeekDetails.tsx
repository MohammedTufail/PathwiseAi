// WeekDetails.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Fix log:
//   - actions.markResourceDone added to useProgress destructure + both ResourceList calls
//   - onSendToChat wired through from ChatWidget → QuizModal
//   - chatPrompt state added so QuizModal can pre-fill the ChatWidget
//   - ChatWidget initialPrompt prop used to open with pre-filled message
//   - TopicContent import path corrected to match component location
//   - All TypeScript types consistent with WeekCard.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../components/button";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Lock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Trophy,
} from "lucide-react";
import { GlowingEffect } from "../components/ui/glowing-effect";

// ── Sub-components ────────────────────────────────────────────────────────────
import ResourceList from "../components/progress/ResourceList";
import ProjectSection from "../components/progress/ProjectSection";
import TopicQuizBar from "../components/progress/TopicQuizBar";
import QuizModal from "../components/quiz/QuizModal";
import ChatWidget from "../components/chat/ChatWidget";

// AI-generated micro-lesson content
import { TopicContent } from "../components/progress/TopicContent";
import type { TopicContentItem } from "../components/progress/TopicContent";

// ── Hooks + API ───────────────────────────────────────────────────────────────
import { useProgress } from "../hooks/useProgress";
import { fetchWeekSummary } from "../api/quizApi";
import type { TopicSummaryItem } from "../api/quizApi";

// ─── Types ────────────────────────────────────────────────────────────────────

type VideoResource = { title: string; url: string };
type RepoResource = { name: string; url: string; stars: number };

type TopicResources = {
  videos: VideoResource[];
  repos: RepoResource[];
};

type WeekData = {
  week: number;
  title: string;
  topics: string[];
  project: string;
  resources?: Record<string, TopicResources>;
  // Optional — populated during curriculum generation by learning_system.py
  topicContent?: Record<string, TopicContentItem>;
};

// ─── Mini progress bar ────────────────────────────────────────────────────────

const MiniProgressBar = ({
  value,
  label,
  sublabel,
  color = "green",
}: {
  value: number;
  label: string;
  sublabel?: string;
  color?: "green" | "blue";
}) => {
  const barColor =
    color === "green"
      ? "from-green-500 to-emerald-400 shadow-[0_0_8px_#22c55e88]"
      : "from-blue-500 to-cyan-400 shadow-[0_0_8px_#3b82f688]";
  const textColor = color === "green" ? "text-green-400" : "text-blue-400";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">
          {label}
        </span>
        <span className={`text-[11px] font-bold ${textColor}`}>
          {sublabel ?? `${value}%`}
        </span>
      </div>
      <div className="h-1.5 w-full bg-white/8 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{
            duration: 1.2,
            ease: [0.34, 1.56, 0.64, 1],
            delay: 0.3,
          }}
          className={`h-full bg-gradient-to-r ${barColor} rounded-full`}
        />
      </div>
    </div>
  );
};

// ─── Step badge (Learn → Resources → Quiz → Build) ───────────────────────────

const StepBadge = ({
  step,
  label,
  done,
}: {
  step: number;
  label: string;
  done: boolean;
}) => (
  <div
    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-wider transition-colors ${
      done
        ? "border-green-500/30 bg-green-500/10 text-green-400"
        : "border-white/8 bg-white/4 text-gray-600"
    }`}
  >
    <span
      className={`h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
        done ? "bg-green-500 text-black" : "bg-white/10 text-gray-500"
      }`}
    >
      {done ? "✓" : step}
    </span>
    {label}
  </div>
);

// ─── WeekDetails page ─────────────────────────────────────────────────────────

const WeekDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const week: WeekData | undefined = location.state?.week;


  console.log("Week:", week);
  console.log("TopicContent:", week?.topicContent);
  // ── courseId — same key as learningPath.tsx ───────────────────────────────
  const subject = localStorage.getItem("subject") ?? "General";
  const courseId = subject.trim() || "";

  // ── Progress hook — same hook + same courseId = same DB record ────────────
  const {
    loading: progressLoading,
    error: progressError,
    actions,
    selectors,
  } = useProgress(courseId);

  const weekProgress = week ? selectors.getWeekProgress(week.week) : undefined;
  const isLocked = week ? selectors.isWeekLocked(week.week) : false;

  // ── Quiz modal state ──────────────────────────────────────────────────────
  const [quizOpen, setQuizOpen] = useState(false);
  const [activeTopic, setActiveTopic] = useState("");
  const [topicSummary, setTopicSummary] = useState<TopicSummaryItem[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // ── ChatWidget pre-fill state — set when QuizModal calls onSendToChat ─────
  const [chatPrompt, setChatPrompt] = useState<string | undefined>(undefined);

  const loadSummary = useCallback(() => {
    if (!courseId || !week || isLocked) return;
    setSummaryLoading(true);
    fetchWeekSummary(courseId, week.week, week.topics)
      .then((data) => setTopicSummary(data.topicSummary))
      .catch(() => setTopicSummary([]))
      .finally(() => setSummaryLoading(false));
  }, [courseId, week, isLocked]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const handleQuizClose = () => {
    setQuizOpen(false);
    setActiveTopic("");
    loadSummary();
  };

  const handleStartTopicQuiz = (topic: string) => {
    setActiveTopic(topic);
    setQuizOpen(true);
  };

  // When QuizModal wants to pre-fill the chat widget
  const handleSendToChat = (prompt: string) => {
    setChatPrompt(prompt);
  };

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalResources = week
    ? week.topics.reduce((sum, t) => {
        const r = week.resources?.[t];
        return sum + (r?.videos.length ?? 0) + (r?.repos.length ?? 0);
      }, 0)
    : 0;

  const completedResourceIds =
    weekProgress?.resources
      .filter((r) => r.completed)
      .map((r) => r.resourceId) ?? [];

  const resourcePct =
    totalResources > 0
      ? Math.round((completedResourceIds.length / totalResources) * 100)
      : 0;

  const quizPassedCount = topicSummary.filter((t) => t.passed).length;
  const allQuizPassed =
    week != null &&
    week.topics.length > 0 &&
    quizPassedCount === week.topics.length;

  const avgQuizPct =
    topicSummary.length > 0
      ? Math.round(
          (topicSummary.reduce((a, t) => a + (t.bestScore ?? 0), 0) /
            topicSummary.length) *
            10,
        )
      : 0;

  const projectDone = weekProgress?.project?.submitted ?? false;
  const weekCompleted = weekProgress?.isCompleted ?? false;

  const bestQuizScore =
    topicSummary.length > 0
      ? Math.max(...topicSummary.map((t) => t.bestScore ?? 0))
      : 0;

  // True if any topic has AI-generated content
  const hasAnyContent =
    week?.topics.some((t) => week.topicContent?.[t]) ?? false;

  // ── Guard: no week data ───────────────────────────────────────────────────
  if (!week) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-green-950">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-center"
        >
          <p className="text-gray-400 text-sm">No week data found.</p>
          <button
            onClick={() => navigate("/learning-path")}
            className="mt-4 text-green-400 text-sm underline underline-offset-4 hover:text-green-300 transition-colors"
          >
            Return to Learning Path
          </button>
        </motion.div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-green-950">
      {/* Per-topic Quiz Modal */}
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
        onSendToChat={handleSendToChat}
      />

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 space-y-8">
        {/* ── Back + breadcrumb ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="flex items-center justify-between gap-4 flex-wrap"
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/learning-path")}
            className="flex items-center gap-2 text-gray-400 hover:text-white hover:bg-white/8 border border-white/10 rounded-xl transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span
              className="hover:text-green-400 cursor-pointer transition-colors"
              onClick={() => navigate("/learning-path")}
            >
              Learning Path
            </span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white font-medium">Week {week.week}</span>
          </div>
        </motion.div>

        {/* ── Locked banner ── */}
        <AnimatePresence>
          {isLocked && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400"
            >
              <Lock className="h-4 w-4 shrink-0" />
              <span>
                This week is locked. Complete week {week.week - 1} to unlock it.
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Week hero card ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease: "easeOut" }}
          className="relative rounded-2xl p-[1px] bg-gradient-to-r from-white/10 via-white/20 to-white/10"
        >
          <GlowingEffect
            spread={70}
            glow
            disabled={false}
            proximity={90}
            inactiveZone={0.05}
          />
          <div className="relative rounded-2xl bg-gradient-to-br from-black via-gray-900/90 to-black border border-white/8 p-6 md:p-8 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-950/30 via-transparent to-transparent pointer-events-none" />

            <div className="relative">
              {/* Status badges */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-green-500/25 bg-green-500/10 text-green-400 text-[10px] font-bold tracking-widest uppercase">
                  Week {week.week}
                </div>
                {weekCompleted && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-green-500/40 bg-green-500/15 text-green-300 text-[10px] font-bold tracking-widest uppercase"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Completed
                  </motion.div>
                )}
                {isLocked && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-500/25 bg-amber-500/10 text-amber-400 text-[10px] font-bold tracking-widest uppercase">
                    <Lock className="h-3 w-3" />
                    Locked
                  </div>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                {week.title}
              </h1>

              {/* Topic pills */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {week.topics.map((topic, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className="text-[11px] text-gray-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full"
                  >
                    {topic}
                  </motion.span>
                ))}
              </div>

              {/* Learning flow steps — only shown when content exists */}
              {hasAnyContent && (
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  <StepBadge step={1} label="Learn" done={hasAnyContent} />
                  <span className="text-white/10 text-xs">→</span>
                  <StepBadge
                    step={2}
                    label="Resources"
                    done={resourcePct >= 70}
                  />
                  <span className="text-white/10 text-xs">→</span>
                  <StepBadge step={3} label="Quiz" done={allQuizPassed} />
                  <span className="text-white/10 text-xs">→</span>
                  <StepBadge step={4} label="Build" done={projectDone} />
                </div>
              )}

              {/* Progress sync indicators */}
              <AnimatePresence>
                {progressLoading && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-[11px] text-gray-600 mt-4 flex items-center gap-1.5"
                  >
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    Syncing progress…
                  </motion.p>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {progressError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 mt-3 text-[11px] text-amber-400"
                  >
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    Progress sync unavailable — connect backend to save progress
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* ── Progress summary card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="relative rounded-2xl p-[1px] bg-gradient-to-r from-white/8 via-white/15 to-white/8"
        >
          <GlowingEffect
            spread={50}
            glow
            disabled={false}
            proximity={70}
            inactiveZone={0.05}
          />
          <div className="rounded-2xl bg-black/60 backdrop-blur border border-white/8 p-5 space-y-5">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-green-400" />
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-widest">
                Week Progress
              </h2>
              <div className="flex-1 h-px bg-white/6" />
              {weekCompleted && (
                <span className="text-[10px] text-green-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> All done
                </span>
              )}
            </div>

            <div className="space-y-3">
              {totalResources > 0 && (
                <MiniProgressBar
                  label="Resources"
                  value={resourcePct}
                  sublabel={`${completedResourceIds.length} / ${totalResources} read`}
                  color="green"
                />
              )}
              <MiniProgressBar
                label="Quiz"
                value={avgQuizPct}
                sublabel={
                  topicSummary.length > 0
                    ? `${quizPassedCount} / ${week.topics.length} topics passed`
                    : "Not attempted"
                }
                color="blue"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">
                  Project
                </span>
                {projectDone ? (
                  <span className="flex items-center gap-1 text-[11px] text-green-400 font-bold">
                    <CheckCircle2 className="h-3 w-3" /> Submitted
                  </span>
                ) : (
                  <span className="text-[11px] text-gray-600">
                    Not submitted
                  </span>
                )}
              </div>
            </div>

            {/* Completion gates */}
            <div className="flex flex-wrap gap-3 text-[11px] pt-1 border-t border-white/6">
              <span
                className={`flex items-center gap-1.5 ${
                  resourcePct >= 70 ? "text-green-400" : "text-gray-600"
                }`}
              >
                {resourcePct >= 70 ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <Circle className="h-3 w-3" />
                )}
                ≥ 70% resources read
              </span>
              <span className="text-gray-700">·</span>
              <span
                className={`flex items-center gap-1.5 ${
                  allQuizPassed ? "text-green-400" : "text-gray-600"
                }`}
              >
                {allQuizPassed ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <Circle className="h-3 w-3" />
                )}
                All topic quizzes passed
              </span>
              <span className="text-gray-700">·</span>
              <span
                className={`flex items-center gap-1.5 ${
                  projectDone ? "text-green-400" : "text-gray-600"
                }`}
              >
                {projectDone ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <Circle className="h-3 w-3" />
                )}
                Project submitted
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Topics: Learn → Resources (per topic) ── */}
        <div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.12 }}
            className="flex items-center gap-2 mb-4"
          >
            <BookOpen className="h-4 w-4 text-green-400" />
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-widest">
              Topics & Resources
            </h2>
            <div className="flex-1 h-px bg-white/6" />
            <span className="text-[11px] text-gray-600">
              {week.topics.length} topics
            </span>
          </motion.div>

          <div className="space-y-6">
            {week.topics.map((topic, ti) => {
              const res = week.resources?.[topic];
              const content = week.topicContent?.[topic];

              return (
                <motion.div
                  key={topic}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.15 + ti * 0.08,
                    duration: 0.45,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  className="relative rounded-2xl p-[1px] bg-gradient-to-br from-white/10 via-white/15 to-white/5 hover:from-green-500/20 hover:via-white/15 hover:to-green-500/10 transition-all duration-500"
                >
                  <GlowingEffect
                    spread={50}
                    glow
                    disabled={false}
                    proximity={70}
                    inactiveZone={0.05}
                  />
                  <div className="rounded-2xl bg-gradient-to-br from-black via-gray-950/95 to-black border border-white/8 hover:border-green-400/20 transition-colors duration-300 overflow-hidden">
                    {/* Topic header */}
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-white/6">
                      <div className="h-7 w-7 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                        <BookOpen className="h-3.5 w-3.5 text-green-400" />
                      </div>
                      <h3 className="text-sm font-semibold text-white leading-tight flex-1">
                        {topic}
                      </h3>
                      {res && (
                        <span className="text-[10px] text-gray-600 font-medium">
                          {(res.videos?.length ?? 0) + (res.repos?.length ?? 0)}{" "}
                          resources
                        </span>
                      )}
                    </div>

                    <div className="p-5 space-y-5">
                      {/* ── STEP 1: Concept micro-lesson ──────────────────── */}
                      {content && (
                        <div className="space-y-1">
                          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <span className="h-4 w-4 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 flex items-center justify-center text-[9px] font-bold">
                              1
                            </span>
                            Understand the concept
                          </p>
                          <TopicContent
                            topic={topic}
                            content={content}
                            index={ti}
                          />
                        </div>
                      )}

                      {/* Divider between concept and resources */}
                      {content && res && (
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-px bg-white/6" />
                          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest flex items-center gap-1.5">
                            <span className="h-4 w-4 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center text-[9px] font-bold">
                              2
                            </span>
                            Explore resources
                          </p>
                          <div className="flex-1 h-px bg-white/6" />
                        </div>
                      )}

                      {/* ── STEP 2: ResourceList ─────────────────────────── */}
                      {res ? (
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
                      ) : (
                        !content && (
                          <p className="text-xs text-gray-600 italic">
                            No resources attached for this topic.
                          </p>
                        )
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── STEP 3: Per-topic Quiz Bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="relative rounded-2xl p-[1px] bg-gradient-to-r from-white/8 via-white/15 to-white/8"
        >
          <GlowingEffect
            spread={50}
            glow
            disabled={false}
            proximity={70}
            inactiveZone={0.05}
          />
          <div className="rounded-2xl bg-black/60 backdrop-blur border border-white/8 p-5">
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <span className="h-4 w-4 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center text-[9px] font-bold">
                3
              </span>
              Test your knowledge
            </p>
            <TopicQuizBar
              topics={week.topics}
              topicSummary={topicSummary}
              onStartQuiz={handleStartTopicQuiz}
              loading={summaryLoading}
            />
          </div>
        </motion.div>

        {/* ── STEP 4: Project Section ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.18 }}
          className="relative rounded-2xl p-[1px] bg-gradient-to-r from-white/8 via-white/15 to-white/8"
        >
          <GlowingEffect
            spread={50}
            glow
            disabled={false}
            proximity={70}
            inactiveZone={0.05}
          />
          <div className="rounded-2xl bg-black/60 backdrop-blur border border-white/8 p-5">
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <span className="h-4 w-4 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center text-[9px] font-bold">
                4
              </span>
              Build the project
            </p>
            <ProjectSection
              project={weekProgress?.project}
              projectTitle={week.project}
              onMarkDone={(githubLink) =>
                actions.completeProject(week.week, githubLink) as Promise<void>
              }
            />
          </div>
        </motion.div>
      </div>

      {/* ── ChatWidget — receives initialPrompt when QuizModal triggers onSendToChat ── */}
      {courseId && (
        <ChatWidget
          courseId={courseId}
          subject={subject}
          weekNumber={week.week}
          weekTitle={week.title}
          topics={week.topics}
          quizScore={bestQuizScore}
          quizPassed={allQuizPassed}
          initialPrompt={chatPrompt}
        />
      )}
    </div>
  );
};

export default WeekDetails;
