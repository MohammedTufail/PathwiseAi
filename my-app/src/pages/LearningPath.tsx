// learningPath
// What changed from the previous version:
//   1. Removed the inline WeekCard component (now in components/progress/WeekCard.tsx)
//   2. Removed `completedWeeks` useState — progress comes from the DB via useProgress
//   3. Added useProgress hook — loads/saves all week progress
//   4. overallProgress is now calculated from DB-completed weeks, not hardcoded
//   5. The new WeekCard receives weekProgress + isLocked + actions from useProgress
//   6. Sidebar profile + progress bar now reflect real DB progress
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  Menu,
  TrendingUp,
  Target,
  Clock,
  Map,
  AlertCircle,
  BrainCircuit,
} from "lucide-react";

import { Button } from "../components/button";
import ProgressRing from "../components/ProgressRing";
import { GlowingEffect } from "../components/ui/glowing-effect";
import { Sidebar, SidebarBody, SidebarLink } from "../components/ui/sidebar";
import {
  IconBrandTabler,
  IconUserBolt,
  IconSettings,
} from "@tabler/icons-react";

// New: progress-aware WeekCard
import WeekCard from "../components/progress/WeekCard";

// New: progress hook
import { useProgress } from "../hooks/useProgress";

import ChatWidget from "../components/chat/ChatWidget";


// ─── Types ────────────────────────────────────────────────────────────────────

type ResourceItem = {
  title?: string;
  url: string;
  name?: string;
  stars?: number;
};

type WeekData = {
  week: number;
  title: string;
  topics: string[];
  project: string;
  resources?: {
    [topic: string]: {
      videos: ResourceItem[];
      repos: ResourceItem[];
    };
  };
};

type CurriculumData = {
  weeks: WeekData[];
};

type UserData = {
  name: string;
  goal?: string;
  startedAt?: string;
};

// ─── Example curriculum (shown when localStorage is empty) ───────────────────

const exampleCurriculum: CurriculumData = {
  weeks: [
    {
      week: 1,
      title: "Java Fundamentals",
      topics: [
        "Java Syntax",
        "Variables and Data Types",
        "Control Flow",
        "Functions",
      ],
      project: "CLI Calculator",
    },
    {
      week: 2,
      title: "Object Oriented Programming",
      topics: [
        "Classes and Objects",
        "Encapsulation",
        "Inheritance",
        "Polymorphism",
      ],
      project: "Library Management System",
    },
    {
      week: 3,
      title: "Collections & Data Structures",
      topics: ["ArrayList", "HashMap", "Stack & Queue", "Searching & Sorting"],
      project: "Student Grade Manager",
    },
    {
      week: 4,
      title: "Backend Development Basics",
      topics: [
        "REST APIs",
        "Spring Boot Intro",
        "Database Connection",
        "CRUD APIs",
      ],
      project: "Simple Notes API",
    },
  ],
};

// ─── Sidebar links ────────────────────────────────────────────────────────────

const sidebarLinks = [
  {
    label: "Learning Path",
    href: "/learning-path",
    icon: (
      <IconBrandTabler className="h-5 w-5 text-gray-700 dark:text-gray-200" />
    ),
  },
  {
    label: "Progress",
    href: "/dashboard",
    icon: <IconSettings className="h-5 w-5 text-gray-700 dark:text-gray-200" />,
  },
  {
    label: "AI Assistant",
    href: "#",
    icon: <IconUserBolt className="h-5 w-5 text-gray-700 dark:text-gray-200" />,
  },
];

// ─── StatPill ─────────────────────────────────────────────────────────────────

const StatPill = ({
  icon,
  label,
  value,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4, ease: "easeOut" }}
    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm"
  >
    <span className="text-green-400">{icon}</span>
    <span className="text-gray-400 text-xs">{label}:</span>
    <span className="text-white font-semibold text-xs">{value}</span>
  </motion.div>
);

// ─── LearningPath page ────────────────────────────────────────────────────────

const LearningPath = () => {
  const navigate = useNavigate();

  // ── UI state ─────────────────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [curriculum, setCurriculum] = useState<CurriculumData | null>(null);
  const [userData, setUserData] = useState<UserData>({ name: "User" });


  // Read subject synchronously — gives correct courseId on first render
  const [subject, setSubject] = useState<string>(
    () => localStorage.getItem("subject") ?? "",
  );

  // ── Load curriculum from localStorage ────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem("curriculum");
    if (!stored) {
      setCurriculum(exampleCurriculum);
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      if (!parsed.weeks || !Array.isArray(parsed.weeks)) {
        setCurriculum(exampleCurriculum);
        return;
      }
      setCurriculum(parsed);
    } catch {
      setCurriculum(exampleCurriculum);
    }
  }, []);

  // ── Load real user name from localStorage ─────────────────────────────────
  useEffect(() => {
    const tryKeys = [
      "user",
      "userData",
      "userProfile",
      "profile",
      "currentUser",
    ];
    let found: UserData | null = null;

    for (const key of tryKeys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        const name =
          parsed?.name ||
          parsed?.displayName ||
          parsed?.username ||
          parsed?.fullName ||
          null;
        if (name && typeof name === "string") {
          found = { name, goal: parsed?.goal, startedAt: parsed?.startedAt };
          break;
        }
      } catch {
        if (typeof raw === "string" && raw.length > 0 && raw.length < 60) {
          found = { name: raw };
          break;
        }
      }
    }

    if (!found) {
      for (const key of ["userName", "name", "displayName"]) {
        const val = localStorage.getItem(key);
        if (
          val &&
          typeof val === "string" &&
          val.length > 0 &&
          val.length < 60 &&
          !val.startsWith("{")
        ) {
          found = { name: val };
          break;
        }
      }
    }

    if (found) setUserData(found);
  }, []);

  // ── Progress tracking ─────────────────────────────────────────────────────
  // courseId uses the subject string so different subjects have separate progress.
  // Falls back to "default-course" when subject hasn't loaded yet.
  const courseId = subject?.trim() || "";

  const {
    progress,
    loading: progressLoading,
    error: progressError,
    actions,
    selectors,
  } = useProgress(courseId);

  // ── Derived values ────────────────────────────────────────────────────────
  const totalWeeks = curriculum?.weeks.length ?? 0;

  // Count weeks the DB says are completed
  const completedWeeks =
    progress?.weeks.filter((w) => w.isCompleted).length ?? 0;

  const overallProgress =
    totalWeeks > 0 ? Math.round((completedWeeks / totalWeeks) * 100) : 0;

  const remainingWeeks = totalWeeks - completedWeeks;

  const avatarInitial = userData.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (!curriculum) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-green-950">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-gray-400 text-sm"
        >
          Loading your learning path…
        </motion.div>
      </div>
    );
  }

  // ----------------------------------------------------

  const currentWeekData =
    curriculum.weeks.find(
      (w) => !selectors.getWeekProgress(w.week)?.isCompleted,
    ) ?? curriculum.weeks[0];

  const currentWeekProgress = selectors.getWeekProgress(
    currentWeekData?.week ?? 1,
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-black via-gray-900 to-green-950">
      {/* ── Sidebar ── */}
      <div className="fixed top-1 left-1 h-screen z-40">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
          <SidebarBody className="flex flex-col h-screen bg-black/90 backdrop-blur border-r border-white/8 p-4 rounded-lg">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 mb-10 shrink-0">
              <BrainCircuit className="h-5 w-5 text-green-400" />
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-bold text-white tracking-tight"
                >
                  PathwiseAI
                </motion.span>
              )}
            </Link>

            {/* Nav links */}
            <div className="flex-1 flex flex-col gap-5 overflow-y-auto overflow-x-hidden ">
              {sidebarLinks.map((link, idx) => (
                <div key={idx} className=" rounded-lg">
                  <GlowingEffect
                    glow
                    disabled={false}
                    spread={60}
                    proximity={80}
                    inactiveZone={0.05}
                  />
                  <SidebarLink link={link} />
                </div>
              ))}
            </div>

            {/* User profile section */}
            <div className="mt-auto pt-4 border-t border-white/10 shrink-0">
              {sidebarOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-3"
                >
                  {/* Avatar + name */}
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center text-white text-sm font-bold shadow-[0_0_12px_#16a34a55]">
                        {avatarInitial}
                      </div>
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-400 border-2 border-black shadow-[0_0_6px_#4ade80]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white leading-tight truncate">
                        {userData.name}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        {userData.goal ?? "Learning Journey"}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-white/10" />

                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                        Overall Progress
                      </p>
                      <span className="text-[11px] font-bold text-green-400">
                        {overallProgress}%
                      </span>
                    </div>

                    <div className="h-1.5 w-full bg-white/8 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${overallProgress}%` }}
                        transition={{
                          duration: 1.2,
                          ease: [0.34, 1.56, 0.64, 1],
                          delay: 0.3,
                        }}
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full shadow-[0_0_8px_#22c55e88]"
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-gray-600">
                      <span>
                        {completedWeeks} week{completedWeeks !== 1 ? "s" : ""}{" "}
                        done
                      </span>
                      <span>{remainingWeeks} remaining</span>
                    </div>
                  </div>

                  {/* Mini stats */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <div className="rounded-lg bg-white/5 border border-white/8 px-2.5 py-2 text-center">
                      <p className="text-base font-bold text-white">
                        {totalWeeks}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Total Weeks
                      </p>
                    </div>
                    <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-2.5 py-2 text-center">
                      <p className="text-base font-bold text-green-400">
                        {completedWeeks}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Completed
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* Collapsed sidebar — avatar + ring only */
                <div className="flex flex-col items-center gap-2">
                  <div className="relative">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center text-white text-xs font-bold shadow-[0_0_10px_#16a34a44]">
                      {avatarInitial}
                    </div>
                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-400 border-2 border-black" />
                  </div>
                  <ProgressRing
                    progress={overallProgress}
                    size={32}
                    strokeWidth={3}
                    showLabel={false}
                    className="text-white"
                  />
                </div>
              )}
            </div>
          </SidebarBody>
        </Sidebar>
      </div>

      {/* ── Main content ── */}
      <motion.main
        className="flex-1 min-h-screen"
        animate={{ marginLeft: sidebarOpen ? 300 : 60 }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      >
        {/* ── Header ── */}
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="sticky top-0 z-30 border-b border-white/8 px-6 h-14 flex items-center justify-between backdrop-blur bg-black/50"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 transition"
            >
              <Menu className="h-5 w-5 text-white" />
            </button>
            <div>
              <p className="text-[16px] text-gray-500 leading-none hidden sm:block">
                Welcome back,{" "}
                <span className="text-green-400 font-medium">
                  {userData.name}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Stat pills */}
            <div className="hidden md:flex items-center gap-2">
              <StatPill
                icon={<Target className="h-3 w-3" />}
                label="Progress"
                value={`${overallProgress}%`}
                delay={0.3}
              />
              <StatPill
                icon={<Clock className="h-3 w-3" />}
                label="Remaining"
                value={`${remainingWeeks}w`}
                delay={0.4}
              />
              <StatPill
                icon={<TrendingUp className="h-3 w-3" />}
                label="Done"
                value={`${completedWeeks}/${totalWeeks}`}
                delay={0.5}
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                localStorage.removeItem("curriculum");
                navigate("/");
              }}
              className="bg-green-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-4 w-4 " />
            </Button>
          </div>
        </motion.header>

        {/* ── Page body ── */}
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
          {/* Hero card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur p-6 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-950/40 via-transparent to-transparent pointer-events-none" />
            <div className="relative">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Map className="h-5 w-5 text-green-400" />
                {subject}
              </h2>
              <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">
                Your personalized curriculum is structured into{" "}
                <span className="text-white font-medium">
                  {totalWeeks} weekly milestones
                </span>
                . Complete resources, pass the quiz, and submit the project to
                unlock the next week.
              </p>

              {/* Overall progress bar */}
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${overallProgress}%` }}
                    transition={{
                      duration: 1.4,
                      ease: [0.34, 1.56, 0.64, 1],
                      delay: 0.6,
                    }}
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full shadow-[0_0_10px_#22c55e66]"
                  />
                </div>
                <span className="text-xs text-green-400 font-bold shrink-0">
                  {overallProgress}%
                </span>
              </div>

              <p className="text-[11px] text-gray-600 mt-1">
                {completedWeeks} of {totalWeeks} weeks completed
              </p>

              {/* Progress loading indicator */}
              <AnimatePresence>
                {progressLoading && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-[11px] text-gray-600 mt-2 flex items-center gap-1.5"
                  >
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    Syncing progress…
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Progress error (non-blocking — UI still works) */}
              <AnimatePresence>
                {progressError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 mt-2 text-[11px] text-amber-400"
                  >
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    Progress sync unavailable — connect backend to save progress
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Completion rules reminder */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-wrap gap-3 text-[11px] text-gray-500"
          >
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />≥ 70%
              resources read
            </span>
            <span className="text-gray-700">·</span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Quiz score ≥ 8/10
            </span>
            <span className="text-gray-700">·</span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Project submitted
            </span>
            <span className="text-gray-500 ml-1">= week unlocks next week</span>
          </motion.div>

          {/* ── Timeline ── */}
          <div className="relative">
            {/* Vertical connector line */}
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              style={{ transformOrigin: "top" }}
              className="absolute left-5 top-6 bottom-6 w-px bg-gradient-to-b from-green-500/40 via-white/10 to-white/5"
            />

            <div className="space-y-6">
              {courseId &&
                curriculum.weeks.map((week, index) => (
                  <WeekCard
                    key={week.week}
                    week={week}
                    index={index}
                    subject={subject}
                    courseId={courseId}
                    weekProgress={selectors.getWeekProgress(week.week)}
                    isLocked={selectors.isWeekLocked(week.week)}
                    actions={actions}
                  />
                ))}
            </div>
          </div>
        </div>
      </motion.main>
      {courseId && (
        <ChatWidget
          courseId={courseId}
          subject={subject}
          weekNumber={currentWeekData?.week ?? 1}
          weekTitle={currentWeekData?.title ?? ""}
          topics={currentWeekData?.topics ?? []}
          quizScore={currentWeekProgress?.quiz?.bestScore ?? 0}
          quizPassed={currentWeekProgress?.quiz?.passed ?? false}
        />
      )}
    </div>
  );
};;

export default LearningPath;
