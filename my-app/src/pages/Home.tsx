import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../assets/PathWiseAILogo.png";

import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { GlowingEffect } from "../components/ui/glowing-effect";
import { MultiStepLoader } from "../components/ui/multi-step-loader";
import { cn } from "../lib/utils";

import {
  IconBook,
  IconChartBar,
  IconTarget,
  IconTrash,
  IconSparkles,
  IconFlask,
  IconClock,
  IconArrowRight,
} from "@tabler/icons-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type SavedPath = {
  id: number;
  subject: string;
  level: string;
  goal: string;
  curriculum: unknown;
  createdAt: string;
};

type FormState = {
  subject: string;
  level: string;
  goal: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const LS_SAVED_PATHS = "savedPaths";
const LS_CURRICULUM = "curriculum";
const LS_SUBJECT = "subject";
const API_URL = "https://pathwiseai-re2v.onrender.com/api/generate";
const TIMEOUT_MS = 180_000;

// Steps shown in the full-screen loader during generation
const LOADER_STEPS = [
  { text: "Analysing your subject and skill level…" },
  { text: "Structuring weekly learning milestones…" },
  { text: "Generating topics and projects per week…" },
  { text: "Fetching YouTube resources for each topic…" },
  { text: "Searching GitHub repositories to match topics…" },
  { text: "Assembling your personalised curriculum…" },
  { text: "Almost there — polishing the final plan…" },
];

// ─── Mock curriculum — DELETE ExampleCard and this once UI testing is done ───

const MOCK_CURRICULUM = {
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadSavedPaths(): SavedPath[] {
  try {
    return JSON.parse(localStorage.getItem(LS_SAVED_PATHS) ?? "[]");
  } catch {
    return [];
  }
}

function persistSavedPaths(paths: SavedPath[]): void {
  localStorage.setItem(LS_SAVED_PATHS, JSON.stringify(paths));
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function weekCount(curriculum: unknown): number {
  try {
    return (curriculum as { weeks: unknown[] }).weeks.length;
  } catch {
    return 0;
  }
}

// ─── BottomGradient ───────────────────────────────────────────────────────────

const BottomGradient = () => (
  <>
    <span className="absolute inset-x-0 -bottom-px h-px w-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 transition group-hover/btn:opacity-100" />
    <span className="absolute inset-x-10 mx-auto -bottom-px h-px w-1/2 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-0 blur-sm transition group-hover/btn:opacity-100" />
  </>
);

// ─── ExampleCard — DELETE once UI testing is done ─────────────────────────────

const ExampleCard = ({
  index,
  onOpen,
}: {
  index: number;
  onOpen: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{
      duration: 0.4,
      delay: index * 0.06,
      ease: [0.25, 0.46, 0.45, 0.94],
    }}
    onClick={onOpen}
    className="group relative cursor-pointer flex flex-col justify-between h-44 rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-950/30 via-black to-black hover:border-amber-400/50 hover:from-amber-950/50 transition-all duration-300 p-4 overflow-hidden"
  >
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold uppercase tracking-wider">
        <IconFlask className="h-2.5 w-2.5" />
        Example
      </span>
      <span className="text-[10px] text-gray-600">
        {MOCK_CURRICULUM.weeks.length} weeks
      </span>
    </div>
    <div className="flex-1 mt-3">
      <p className="text-white font-bold text-sm leading-tight">
        Java Backend Development
      </p>
      <p className="text-amber-400/70 text-xs mt-0.5">Beginner</p>
      <p className="text-gray-500 text-xs mt-1 leading-snug line-clamp-2">
        Build a REST API from scratch
      </p>
    </div>
    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/6">
      <span className="text-[10px] text-gray-600 italic">UI preview only</span>
      <span className="flex items-center gap-1 text-amber-400 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        Open <IconArrowRight className="h-3 w-3" />
      </span>
    </div>
  </motion.div>
);

// ─── SavedPathCard ────────────────────────────────────────────────────────────

const SavedPathCard = ({
  path,
  index,
  onOpen,
  onDelete,
}: {
  path: SavedPath;
  index: number;
  onOpen: (p: SavedPath) => void;
  onDelete: (id: number, e: React.MouseEvent) => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, scale: 0.94, y: -8 }}
    transition={{
      duration: 0.4,
      delay: index * 0.06,
      ease: [0.25, 0.46, 0.45, 0.94],
    }}
    onClick={() => onOpen(path)}
    className="group relative cursor-pointer flex flex-col justify-between h-44 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900/80 via-black to-black hover:border-green-500/40 hover:from-green-950/30 transition-all duration-300 p-4 overflow-hidden"
  >
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/0 to-transparent group-hover:via-green-500/40 transition-all duration-500" />

    <div className="flex items-start justify-between gap-2">
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-semibold uppercase tracking-wider truncate max-w-[80px]">
        {path.level}
      </span>
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-[10px] text-gray-600">
          {weekCount(path.curriculum)}w
        </span>
        <button
          onClick={(e) => onDelete(path.id, e)}
          className="p-1 rounded-md text-gray-700 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
          title="Delete"
        >
          <IconTrash className="h-3 w-3" />
        </button>
      </div>
    </div>

    <div className="flex-1 mt-2.5">
      <p className="text-white font-bold text-sm leading-tight line-clamp-1">
        {path.subject}
      </p>
      <p className="text-gray-500 text-xs mt-1 leading-snug line-clamp-2">
        {path.goal}
      </p>
    </div>

    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/6">
      <span className="flex items-center gap-1 text-[10px] text-gray-600">
        <IconClock className="h-2.5 w-2.5" />
        {formatDate(path.createdAt)}
      </span>
      <span className="flex items-center gap-1 text-green-400 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        Open <IconArrowRight className="h-3 w-3" />
      </span>
    </div>
  </motion.div>
);

// ─── Home ─────────────────────────────────────────────────────────────────────

const Home = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    subject: "",
    level: "",
    goal: "",
  });
  const [loading, setLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [savedPaths, setSavedPaths] = useState<SavedPath[]>(loadSavedPaths);
  const [error, setError] = useState<string | null>(null);

  // Sync across tabs
  useEffect(() => {
    const onStorage = () => setSavedPaths(loadSavedPaths());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setField = useCallback(
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setError(null);
    },
    [],
  );

  const isFormComplete =
    form.subject.trim() !== "" &&
    form.level.trim() !== "" &&
    form.goal.trim() !== "";

  const activateCurriculum = useCallback(
    (curriculum: unknown, subject: string) => {
      localStorage.setItem(LS_CURRICULUM, JSON.stringify(curriculum));
      localStorage.setItem(LS_SUBJECT, subject);
      navigate("/learning-path");
    },
    [navigate],
  );

  const saveNewPath = useCallback(
    (curriculum: unknown) => {
      const entry: SavedPath = {
        id: Date.now(),
        subject: form.subject.trim(),
        level: form.level.trim(),
        goal: form.goal.trim(),
        curriculum,
        createdAt: new Date().toISOString(),
      };
      setSavedPaths((prev) => {
        const updated = [entry, ...prev];
        persistSavedPaths(updated);
        return updated;
      });
    },
    [form],
  );

  // ── Generate ──
  const handleGenerate = async () => {
    if (!isFormComplete || loading) return;
    setError(null);

    // Show the multi-step loader immediately
    setLoading(true);
    setShowLoader(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: form.subject.trim(),
          level: form.level.trim(),
          goal: form.goal.trim(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`Server error (${res.status})`);
      }

      const data = await res.json();

      if (
        !data.weeks ||
        !Array.isArray(data.weeks) ||
        data.weeks.length === 0
      ) {
        throw new Error("Invalid curriculum received from AI.");
      }

      saveNewPath(data);

      // Keep loader visible briefly for the last step to settle
      setTimeout(() => {
        setShowLoader(false);
        activateCurriculum(data, form.subject.trim());
      }, 800);
    } catch (err: unknown) {
      clearTimeout(timeout);
      setShowLoader(false);

      if (err instanceof Error) {
        if (err.name === "AbortError") {
          setError(
            "Request timed out. Try a simpler prompt or check your connection.",
          );
        } else {
          setError(err.message || "Failed to generate curriculum.");
        }
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMock = useCallback(() => {
    activateCurriculum(MOCK_CURRICULUM, "Java (Example)");
  }, [activateCurriculum]);

  const openSavedPath = useCallback(
    (path: SavedPath) => activateCurriculum(path.curriculum, path.subject),
    [activateCurriculum],
  );

  const deletePath = useCallback((id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedPaths((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      persistSavedPaths(updated);
      return updated;
    });
  }, []);

  const clearAll = () => {
    setSavedPaths([]);
    persistSavedPaths([]);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isFormComplete && !loading) {
      handleGenerate();
    }
  };

  const totalCards = 1 + savedPaths.length;

  return (
    <>
      {/* ── Multi-step full-screen loader ── */}
      <MultiStepLoader
        loadingStates={LOADER_STEPS}
        loading={showLoader}
        duration={2200}
        loop={false}
      />

      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 via-gray-950 to-green-950 px-6 py-12">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-10">
          {/* ── Logo ── */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img src={logo} alt="PathwiseAI" className="h-25 w-auto" />
          </motion.div>

          {/* ── Tagline ── */}
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.07 }}
            className="text-center text-2xl font-bold text-white tracking-wide drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
          >
            Build your Personalized Curriculum with AI
          </motion.p>

          {/* ── Form card — full width with GlowingEffect ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.13 }}
            className="w-full"
          >
            {/* GlowingEffect wrapper */}
            <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-white/10 via-white/5 to-white/10">
              <GlowingEffect
                spread={80}
                glow
                disabled={false}
                proximity={120}
                inactiveZone={0.03}
              />
              <div
                className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-gray-950/95 via-black to-gray-950/95 backdrop-blur p-8"
                onKeyDown={onKeyDown}
              >
                {/* Card header */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="h-6 w-6 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                    <IconSparkles className="h-3.5 w-3.5 text-green-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-300">
                    Tell us what you want to learn
                  </p>
                </div>

                {/* Three inputs in a row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                  {/* Subject */}
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor="subject"
                      className="text-gray-400 text-xs font-medium uppercase tracking-widest"
                    >
                      Subject
                    </Label>
                    <div className="relative">
                      <IconBook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
                      <Input
                        id="subject"
                        value={form.subject}
                        onChange={setField("subject")}
                        placeholder="Java, Python, React…"
                        className="pl-9 h-12 text-sm bg-white/4 border-white/10 focus:border-green-500/50 transition-colors duration-200"
                      />
                    </div>
                  </div>

                  {/* Skill level */}
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor="level"
                      className="text-gray-400 text-xs font-medium uppercase tracking-widest"
                    >
                      Skill Level
                    </Label>
                    <div className="relative">
                      <IconChartBar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
                      <Input
                        id="level"
                        value={form.level}
                        onChange={setField("level")}
                        placeholder="Beginner / Intermediate"
                        className="pl-9 h-12 text-sm bg-white/4 border-white/10 focus:border-green-500/50 transition-colors duration-200"
                      />
                    </div>
                  </div>

                  {/* Goal */}
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor="goal"
                      className="text-gray-400 text-xs font-medium uppercase tracking-widest"
                    >
                      Goal
                    </Label>
                    <div className="relative">
                      <IconTarget className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
                      <Input
                        id="goal"
                        value={form.goal}
                        onChange={setField("goal")}
                        placeholder="Build an app, Get a job…"
                        className="pl-9 h-12 text-sm bg-white/4 border-white/10 focus:border-green-500/50 transition-colors duration-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Error banner */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22 }}
                      className="flex items-start gap-2 px-3 py-2.5 mb-4 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-sm overflow-hidden"
                    >
                      <span className="shrink-0 mt-0.5">⚠</span>
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Generate button — full width */}
                <button
                  onClick={handleGenerate}
                  disabled={loading || !isFormComplete}
                  className={cn(
                    "group/btn relative block h-14 w-full rounded-xl",
                    "bg-green-600 hover:bg-green-500",
                    "disabled:opacity-40 disabled:cursor-not-allowed",
                    "text-white font-semibold text-sm",
                    "shadow-[0_0_16px_#16a34a] hover:shadow-[0_0_28px_#22c55e]",
                    "transition-all duration-300",
                  )}
                >
                  <span className="flex items-center justify-center gap-2">
                    <IconSparkles className="h-4 w-4" />
                    Generate Curriculum
                  </span>
                  <BottomGradient />
                </button>

                {/* Hint below button */}
                <p className="text-center text-[11px] text-gray-600 mt-3">
                  Generation takes 30–90 seconds — resources are fetched live
                  for each topic
                </p>
              </div>
            </div>
          </motion.div>

          {/* ── Learning paths grid ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="w-full space-y-4"
          >
            {/* Section header */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_6px_#4ade80]" />
                Your Learning Paths
                <span className="text-xs text-gray-600 font-normal">
                  ({totalCards})
                </span>
              </h3>
              {savedPaths.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-[11px] text-gray-600 hover:text-red-400 transition-colors duration-200"
                >
                  Clear saved
                </button>
              )}
            </div>

            {/* Grid: 2 cols → 3 → 4 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {/* Slot 0 — Example card. DELETE this line once UI testing is done. */}
              <ExampleCard index={0} onOpen={handleLoadMock} />

              {/* Slots 1+ — generated paths, newest first */}
              <AnimatePresence initial={false}>
                {savedPaths.map((path, i) => (
                  <SavedPathCard
                    key={path.id}
                    path={path}
                    index={i + 1}
                    onOpen={openSavedPath}
                    onDelete={deletePath}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Home;
