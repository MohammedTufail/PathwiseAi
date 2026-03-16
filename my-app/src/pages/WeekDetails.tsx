import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../components/button";
import {
  ArrowLeft,
  Github,
  Youtube,
  BookOpen,
  Star,
  ExternalLink,
  Folder,
  Code2,
  ChevronRight,
} from "lucide-react";
import { GlowingEffect } from "../components/ui/glowing-effect";
import QuizModal from "../components/quiz/QuizModal";

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
};

// ─── ResourceLink ─────────────────────────────────────────────────────────────

const ResourceLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="group flex items-center gap-2 text-sm text-gray-400 hover:text-green-400 transition-colors duration-200"
  >
    <span className="flex-1 truncate leading-snug">{children}</span>
    <ExternalLink className="shrink-0 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
  </a>
);

// ─── TopicCard ────────────────────────────────────────────────────────────────

const TopicCard = ({
  topic,
  index,
  resources,
}: {
  topic: string;
  index: number;
  resources?: TopicResources;
}) => {
  const videos = resources?.videos ?? [];
  const repos = resources?.repos ?? [];
  const hasAny = videos.length > 0 || repos.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.15 + index * 0.08,
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
          <span className="text-[10px] text-gray-600 font-medium">
            {videos.length + repos.length} resources
          </span>
        </div>

        {!hasAny ? (
          <div className="px-5 py-4 text-xs text-gray-600 italic">
            No resources attached for this topic.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/6">
            {/* Videos column */}
            <div className="px-5 py-4 space-y-1">
              <div className="flex items-center gap-1.5 mb-3">
                <Youtube className="h-3.5 w-3.5 text-red-500" />
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                  Videos
                </p>
              </div>
              {videos.length === 0 ? (
                <p className="text-xs text-gray-600 italic">No videos found.</p>
              ) : (
                <div className="space-y-2.5">
                  {videos.map((vid, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.08 + i * 0.04 }}
                    >
                      <ResourceLink href={vid.url}>{vid.title}</ResourceLink>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Repos column */}
            <div className="px-5 py-4 space-y-1">
              <div className="flex items-center gap-1.5 mb-3">
                <Github className="h-3.5 w-3.5 text-gray-300" />
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                  GitHub
                </p>
              </div>
              {repos.length === 0 ? (
                <p className="text-xs text-gray-600 italic">
                  No repositories found.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {repos.map((repo, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.08 + i * 0.04 }}
                    >
                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between gap-2 text-sm text-gray-400 hover:text-green-400 transition-colors duration-200"
                      >
                        <span className="flex items-center gap-1.5 min-w-0">
                          <Code2 className="shrink-0 h-3 w-3 text-gray-600 group-hover:text-green-500 transition-colors" />
                          <span className="truncate leading-snug">
                            {repo.name}
                          </span>
                        </span>
                        <span className="shrink-0 flex items-center gap-0.5 text-[11px] text-yellow-500/70">
                          <Star className="h-2.5 w-2.5 fill-yellow-500/70" />
                          {repo.stars.toLocaleString()}
                        </span>
                      </a>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─── WeekDetails page ────────────────────────────────────────────────────────

const WeekDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const week: WeekData | undefined = location.state?.week;

  // Read subject from localStorage so QuizModal gets it
  const subject = localStorage.getItem("subject") ?? "General";

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-green-950">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 space-y-8">
        {/* ── Header ── */}
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

        {/* ── Week hero ── */}
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
            {/* Background accent */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-950/30 via-transparent to-transparent pointer-events-none" />

            <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
              <div>
                {/* Week badge */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-green-500/25 bg-green-500/10 text-green-400 text-[10px] font-bold tracking-widest uppercase mb-3">
                  Week {week.week}
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
              </div>

              {/* Quiz trigger */}
              <div className="shrink-0">
                <QuizModal
                  subject={subject}
                  topics={week.topics}
                  weekTitle={week.title}
                  difficulty="mixed"
                  total={10}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Project card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="relative rounded-2xl p-[1px] bg-gradient-to-r from-white/8 via-white/15 to-white/8"
        >
          <GlowingEffect
            spread={50}
            glow
            disabled={false}
            proximity={70}
            inactiveZone={0.05}
          />
          <div className="rounded-2xl bg-black/60 backdrop-blur border border-white/8 p-5 flex items-start gap-4">
            <div className="h-9 w-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
              <Folder className="h-4 w-4 text-green-400" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-1">
                Weekly Project
              </p>
              <p className="text-white font-semibold text-base leading-snug">
                {week.project}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Build this to apply everything you learn this week.
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Topics + resources ── */}
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

          <div className="space-y-4">
            {week.topics.map((topic, index) => (
              <TopicCard
                key={index}
                topic={topic}
                index={index}
                resources={week.resources?.[topic]}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeekDetails;
