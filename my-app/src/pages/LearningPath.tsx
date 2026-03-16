import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Brain,
  Sparkles,
  Calendar,
  CheckCircle2,
  LogOut,
  Menu,
  TrendingUp,
  Target,
  Clock,
  Map,
  Lightbulb,
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
import QuizModal from "../components/quiz/QuizModal";

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

// ─── WeekCard ─────────────────────────────────────────────────────────────────
// Defined outside LearningPath, so `navigate` is NOT in scope here.
// All navigation is done through the `onViewDetails` callback prop — never
// call navigate() directly inside this component.
const WeekCard = ({
  week,
  index,
  completedWeeks,
  subject,
  onViewDetails,
}: {
  week: WeekData;
  index: number;
  completedWeeks: number;
  subject: string;
  onViewDetails: () => void;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const isCompleted = index < completedWeeks;
  const isCurrent = index === completedWeeks;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -24 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -24 }}
      transition={{
        duration: 0.5,
        delay: index * 0.07,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="relative"
    >
      {/* Timeline dot */}
      <div className="absolute left-4 top-8 z-10">
        {isCompleted ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : { scale: 0 }}
            transition={{
              delay: index * 0.07 + 0.3,
              type: "spring",
              stiffness: 260,
            }}
            className="w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-green-500 shadow-[0_0_8px_#22c55e]"
          />
        ) : isCurrent ? (
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-green-400 shadow-[0_0_12px_#4ade80]"
          />
        ) : (
          <div className="w-2.5 h-2.5 rounded-full bg-black border-2 border-white/20" />
        )}
      </div>

      <div className="ml-10 relative rounded-2xl p-[1px] bg-gradient-to-r from-white/10 via-white/20 to-white/10 hover:from-green-500/20 hover:via-white/20 hover:to-green-500/20 transition-all duration-500">
        <GlowingEffect
          spread={60}
          glow
          disabled={false}
          proximity={80}
          inactiveZone={0.05}
        />
        <div className="relative rounded-2xl bg-gradient-to-br from-black via-gray-900/90 to-black p-6 border border-white/8 group hover:border-green-400/30 transition-all duration-400">
          {/* Completed badge */}
          <div className="flex items-center gap-2 mb-2">
            {isCompleted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-semibold tracking-wider uppercase"
              >
                <CheckCircle2 className="h-3 w-3" />
                Done
              </motion.div>
            )}
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-gray-500 flex items-center gap-1.5 font-medium tracking-widest uppercase">
                <Calendar className="h-3.5 w-3.5 text-green-400" />
                Week {week.week}
              </p>
              <h3 className="text-lg font-bold text-white mt-1.5 group-hover:text-green-100 transition-colors duration-300">
                {week.title}
              </h3>
              <p className="text-sm text-gray-500 mt-1.5">
                Project:{" "}
                <span className="text-green-400 font-semibold">
                  {week.project}
                </span>
              </p>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <QuizModal
                subject={subject}
                topics={week.topics}
                weekTitle={week.title}
                difficulty="mixed"
                total={10}
              />
              {/* onViewDetails is called here — navigate() lives in parent */}
              <Button
                onClick={onViewDetails}
                className="rounded-xl bg-green-600 hover:bg-green-500 shadow-[0_0_10px_#22c55e]"
              >
                View Details
              </Button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {week.topics.map((topic, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                transition={{ delay: index * 0.07 + 0.15 + i * 0.05 }}
                className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl bg-white/4 border border-white/8 hover:border-green-400/30 hover:bg-green-500/5 transition-all duration-250 cursor-default"
              >
                <CheckCircle2
                  className={`h-4 w-4 shrink-0 transition-colors duration-200 ${
                    isCompleted ? "text-green-500" : "text-gray-600"
                  }`}
                />
                <span className="text-gray-300 leading-tight">{topic}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [curriculum, setCurriculum] = useState<CurriculumData | null>(null);
  const [userData, setUserData] = useState<UserData>({ name: "User" });
  const [completedWeeks] = useState(1);
  const [subject, setSubject] = useState("");
const displaySubject: string =
  subject && subject.trim() !== "" ? subject : "Java";
  useEffect(() => {
    const stored = localStorage.getItem("subject");
    if (stored) setSubject(stored);
  }, []);

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
      if (raw) {
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

  if (!curriculum) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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

  const totalWeeks = curriculum.weeks.length;
  const overallProgress = Math.round((completedWeeks / totalWeeks) * 100);
  const remainingWeeks = totalWeeks - completedWeeks;
  const avatarInitial = userData.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-black via-gray-900 to-green-950">
      {/* Sidebar */}
      <div className="fixed top-0 left-0 h-screen z-40">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
          <SidebarBody className="flex flex-col h-screen bg-black/90 backdrop-blur border-r border-white/8 p-4">
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

            <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto overflow-x-hidden">
              {sidebarLinks.map((link, idx) => (
                <div key={idx} className="relative rounded-lg">
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

            <div className="mt-auto pt-4 border-t border-white/10 shrink-0">
              {sidebarOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-3"
                >
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

      {/* Main Content */}
      <motion.main
        className="flex-1 min-h-screen"
        animate={{ marginLeft: sidebarOpen ? 300 : 60 }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      >
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
              <p className="text-[17px] text-gray-500 leading-none hidden sm:block">
                Welcome back,{" "}
                <span className="text-green-400 font-medium">
                  {userData.name}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
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
                label="Streak"
                value="Active"
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

        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
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
                {displaySubject}
              </h2>
              <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">
                Your personalized curriculum is structured into{" "}
                <span className="text-white font-medium">
                  {totalWeeks} weekly milestones
                </span>
                . Follow them step by step to reach your goal faster.
              </p>
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
            </div>
          </motion.div>

          <div className="relative">
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              style={{ transformOrigin: "top" }}
              className="absolute left-5 top-6 bottom-6 w-px bg-gradient-to-b from-green-500/40 via-white/10 to-white/5"
            />
            <div className="space-y-6">
              {curriculum.weeks.map((week, index) => (
                <WeekCard
                  key={week.week}
                  week={week}
                  index={index}
                  completedWeeks={completedWeeks}
                  subject={subject}
                  onViewDetails={() =>
                    navigate(`/week/${week.week}`, { state: { week } })
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </motion.main>
    </div>
  );
};

export default LearningPath;
