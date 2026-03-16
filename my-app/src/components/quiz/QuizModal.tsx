// ─── components/quiz/QuizModal.tsx ───────────────────────────────────────────
// Full-screen modal that orchestrates the entire quiz flow:
//   idle → loading → active (per-question) → results
//
// MOCK FALLBACK:
//   If the backend is unavailable (not running, no API key yet, network error),
//   the fetch silently falls back to built-in mock questions so the UI can be
//   tested end-to-end without a live server.
//   A small "Demo mode" badge is shown in the modal header when mock data is active.
//   Remove the fallback (or set VITE_QUIZ_MOCK=false) once your backend is live.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Brain,
  Loader2,
  AlertCircle,
  Sparkles,
  FlaskConical,
} from "lucide-react";
import { Button } from "../button";
import QuizCard from "./QuizCard";
import QuizResults from "./QuizResults";
import type { QuizQuestion, QuizPayload, AnswerState } from "./quiz.types";

// ─── API config ───────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

// Set VITE_QUIZ_MOCK=true in your .env to always use mock data (skips fetch entirely).
// Leave unset or set to "false" for normal behaviour: try API first, fall back on failure.
const FORCE_MOCK = import.meta.env.VITE_QUIZ_MOCK === "true";

// ─── Mock data factory ────────────────────────────────────────────────────────
// Generates 10 realistic questions from whatever topics are passed in.
// Covers all three question types and all three difficulty levels so every
// part of the quiz UI (badges, explanation panel, results breakdown) is exercised.

function buildMockQuiz(topics: string[], subject: string): QuizQuestion[] {
  // Template bank — each entry is a complete question parameterised by {topic} / {subject}
  const templates: Omit<QuizQuestion, "topic">[] = [
    {
      question:
        "Which of the following best describes the primary purpose of {topic} in {subject}?",
      options: [
        "It provides a way to organise and structure code for better readability.",
        "It replaces the need for any external libraries or frameworks.",
        "It is only used during the testing phase of development.",
        "It automatically optimises memory usage at runtime.",
      ],
      answer: "A",
      explanation:
        "{topic} is fundamentally about organising logic so that code is maintainable and readable. The other options describe unrelated or incorrect behaviours.",
      difficulty: "easy",
      question_type: "mcq",
    },
    {
      question:
        "In {subject}, {topic} can be applied independently without any other component of the system.",
      options: ["True", "False"],
      answer: "False",
      explanation:
        "In practice, {topic} works in conjunction with other parts of the system. Treating it as fully independent leads to integration issues.",
      difficulty: "easy",
      question_type: "true_false",
    },
    {
      question:
        "A developer is refactoring a large {subject} codebase and notices that {topic} is duplicated across multiple modules. What is the most appropriate action?",
      options: [
        "Extract the shared logic into a reusable abstraction and reference it from each module.",
        "Copy the implementation into each module to avoid coupling.",
        "Delete all duplicates and leave only one random copy.",
        "Add comments explaining the duplication and move on.",
      ],
      answer: "A",
      explanation:
        "Extracting shared logic reduces duplication, improves maintainability, and is a core principle of clean {subject} design. The other options either increase coupling or leave the problem unsolved.",
      difficulty: "medium",
      question_type: "scenario",
    },
    {
      question: "Which statement about {topic} is FALSE?",
      options: [
        "It can improve code reuse when applied correctly.",
        "It has no performance implications whatsoever.",
        "It is commonly used in production {subject} systems.",
        "Understanding it is important for writing maintainable code.",
      ],
      answer: "B",
      explanation:
        "Every technical decision, including how {topic} is applied, has potential performance implications. Claiming it has none is false. The other statements are generally true.",
      difficulty: "medium",
      question_type: "mcq",
    },
    {
      question:
        "{topic} is considered a best practice in modern {subject} development.",
      options: ["True", "False"],
      answer: "True",
      explanation:
        "{topic} is widely recognised as a best practice because it improves clarity, testability, and long-term maintainability of {subject} projects.",
      difficulty: "easy",
      question_type: "true_false",
    },
    {
      question:
        "When implementing {topic} in a high-traffic {subject} system, which trade-off is most important to consider?",
      options: [
        "The balance between abstraction complexity and runtime performance overhead.",
        "Whether the feature will look good in a code review.",
        "How many lines of code it removes from the codebase.",
        "Whether the naming convention matches the existing style guide.",
      ],
      answer: "A",
      explanation:
        "In high-traffic systems, the cost of abstraction (indirection, memory, CPU) must be weighed against maintainability gains. The other options are superficial concerns that don't affect system correctness.",
      difficulty: "hard",
      question_type: "scenario",
    },
    {
      question:
        "What is the most common mistake developers make when first learning {topic} in {subject}?",
      options: [
        "Over-engineering by applying it everywhere before understanding the cost.",
        "Never using it even when it would clearly simplify the code.",
        "Using it only in test files and nowhere else.",
        "Applying it exclusively to database-related code.",
      ],
      answer: "A",
      explanation:
        "Beginners often over-apply {topic} before developing intuition for when it truly adds value. This leads to unnecessary complexity. The other options are less common failure modes.",
      difficulty: "medium",
      question_type: "mcq",
    },
    {
      question:
        "Advanced usage of {topic} in {subject} requires understanding of both its internal implementation and its interaction with the surrounding system context.",
      options: ["True", "False"],
      answer: "True",
      explanation:
        "At an advanced level, {topic} cannot be used effectively without understanding how it interacts with the broader system. Surface-level knowledge is insufficient for edge cases and performance tuning.",
      difficulty: "hard",
      question_type: "true_false",
    },
    {
      question:
        "A senior engineer on your team insists that {topic} should never be used in {subject} because it adds unnecessary indirection. How should you respond?",
      options: [
        "Agree with them and remove all existing usages from the codebase immediately.",
        "Acknowledge their concern, then propose evaluating it against specific use cases with measurable criteria.",
        "Ignore the feedback and continue using it without discussion.",
        "Escalate the disagreement to management without attempting a technical discussion.",
      ],
      answer: "B",
      explanation:
        "Engineering decisions should be grounded in measurable criteria and specific use cases, not blanket rules. Proposing an evidence-based evaluation respects the concern while maintaining technical rigour.",
      difficulty: "hard",
      question_type: "scenario",
    },
    {
      question:
        "Which of the following scenarios would most benefit from applying {topic} in a {subject} project?",
      options: [
        "A one-off script that runs once and is discarded after use.",
        "A core business module that is shared across multiple services and changes frequently.",
        "A configuration file that rarely changes.",
        "A database migration that runs once during deployment.",
      ],
      answer: "B",
      explanation:
        "{topic} pays dividends when applied to code that is shared, reused, and evolves over time. One-off scripts, static configs, and migrations don't benefit meaningfully.",
      difficulty: "medium",
      question_type: "mcq",
    },
  ];

  // Distribute templates round-robin across topics
  return templates.map((tmpl, i) => {
    const topic = topics[i % topics.length];
    const interpolate = (s: string) =>
      s
        .replace(/\{topic\}/g, topic)
        .replace(/\{subject\}/g, subject || "software development");

    return {
      ...tmpl,
      topic,
      question: interpolate(tmpl.question),
      explanation: interpolate(tmpl.explanation),
      options: tmpl.options.map(interpolate),
    };
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = "idle" | "loading" | "active" | "results";

interface Props {
  subject: string;
  topics: string[];
  weekTitle: string;
  difficulty?: "easy" | "medium" | "hard" | "mixed";
  total?: number;
  apiBase?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function QuizModal({
  subject,
  topics,
  weekTitle,
  difficulty = "mixed",
  total = 10,
  apiBase = API_BASE,
}: Props) {
  const [stage, setStage] = useState<Stage>("idle");
  const [open, setOpen] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<AnswerState[]>([]);
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false); // true when mock fallback is active

  // ── fetch (with silent mock fallback) ─────────────────────────────────────
  const fetchQuiz = useCallback(async () => {
    setStage("loading");
    setError(null);
    setAnswers([]);
    setCurrent(0);
    setIsMock(false);

    // Helper to hydrate state from any QuizQuestion[]
    const loadQuestions = (qs: QuizQuestion[]) => {
      setQuestions(qs);
      setAnswers(
        qs.map(() => ({ selected: null, submitted: false, correct: false })),
      );
      setStage("active");
    };

    // ── If FORCE_MOCK is on, skip the network entirely ──
    if (FORCE_MOCK) {
      await new Promise((r) => setTimeout(r, 900)); // simulate loading feel
      setIsMock(true);
      loadQuestions(buildMockQuiz(topics, subject));
      return;
    }

    // ── Try the real backend ──
    try {
      const res = await fetch(`${apiBase}/generate-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, topics, difficulty, total }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Server error ${res.status}`);
      }

      const payload: QuizPayload = await res.json();

      if (!payload.quiz?.length) {
        throw new Error("Empty quiz returned from server.");
      }

      // ✅ Real data — use it
      setIsMock(false);
      loadQuestions(payload.quiz);
    } catch (_err) {
      // ⚠️  Backend unavailable or errored — fall back to mock silently
      console.warn(
        "[QuizModal] Backend unreachable, using mock data for UI preview.",
        _err,
      );
      setIsMock(true);
      loadQuestions(buildMockQuiz(topics, subject));
    }
  }, [subject, topics, difficulty, total, apiBase]);

  // ── per-question handlers ─────────────────────────────────────────────────
  const handleSelect = (label: string) =>
    setAnswers((prev) =>
      prev.map((a, i) => (i === current ? { ...a, selected: label } : a)),
    );

  const handleSubmit = () => {
    const q = questions[current];
    const a = answers[current];
    if (!a.selected) return;
    const correct = a.selected === q.answer;
    setAnswers((prev) =>
      prev.map((ans, i) =>
        i === current ? { ...ans, submitted: true, correct } : ans,
      ),
    );
  };

  const handleNext = () => {
    if (current + 1 >= questions.length) setStage("results");
    else setCurrent((c) => c + 1);
  };

  const handleRetry = () => fetchQuiz();

  const handleOpen = () => {
    setOpen(true);
    fetchQuiz();
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setStage("idle");
      setQuestions([]);
      setAnswers([]);
      setCurrent(0);
      setError(null);
      setIsMock(false);
    }, 350);
  };

  const progressPct =
    stage === "active" && questions.length > 0
      ? Math.round((current / questions.length) * 100)
      : 0;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Trigger button */}
      <Button
        onClick={handleOpen}
        className="flex items-center gap-2 rounded-xl bg-white/8 hover:bg-white/12 border border-white/10 hover:border-green-400/40 text-white font-semibold transition-all duration-300"
      >
        <Brain className="h-4 w-4 text-green-400" />
        Take Quiz
      </Button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={handleClose}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: 32, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="
                fixed inset-x-4 top-[5vh] bottom-[5vh]
                sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2
                sm:w-full sm:max-w-2xl
                z-50 flex flex-col
                rounded-2xl border border-white/12
                bg-gradient-to-b from-gray-950 via-black to-gray-950
                shadow-[0_24px_80px_rgba(0,0,0,0.8)]
                overflow-hidden
              "
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-green-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white leading-tight">
                        {weekTitle} Quiz
                      </p>
                      {/* Demo badge — only shown when using mock data */}
                      {isMock && stage !== "loading" && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-semibold tracking-wider"
                        >
                          <FlaskConical className="h-2.5 w-2.5" />
                          Demo
                        </motion.span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 leading-none mt-0.5">
                      {isMock && stage !== "loading"
                        ? "Using sample questions — connect backend for real quiz"
                        : subject}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/8 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Progress bar */}
              <AnimatePresence>
                {stage === "active" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-0.5 w-full bg-white/8 shrink-0"
                  >
                    <motion.div
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <AnimatePresence mode="wait">
                  {/* Loading */}
                  {stage === "loading" && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center h-full gap-5 py-20"
                    >
                      <div className="relative">
                        <div className="h-14 w-14 rounded-full border border-white/10 flex items-center justify-center">
                          <Brain className="h-6 w-6 text-green-400" />
                        </div>
                        <Loader2 className="absolute inset-0 m-auto h-14 w-14 text-green-500/30 animate-spin" />
                      </div>
                      <div className="text-center">
                        <p className="text-white font-semibold">
                          Generating your quiz…
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Building {total} questions across {topics.length}{" "}
                          topic
                          {topics.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Error (only shown if both API and mock somehow fail) */}
                  {stage === "idle" && error && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center h-full gap-4 py-20 text-center"
                    >
                      <AlertCircle className="h-10 w-10 text-red-400" />
                      <div>
                        <p className="text-white font-semibold">
                          Failed to generate quiz
                        </p>
                        <p className="text-sm text-gray-400 mt-1 max-w-sm">
                          {error}
                        </p>
                      </div>
                      <Button
                        onClick={fetchQuiz}
                        className="rounded-xl bg-green-600 hover:bg-green-500 shadow-[0_0_10px_#16a34a] font-semibold"
                      >
                        Try Again
                      </Button>
                    </motion.div>
                  )}

                  {/* Active question */}
                  {stage === "active" && questions.length > 0 && (
                    <QuizCard
                      key={current}
                      question={questions[current]}
                      index={current}
                      total={questions.length}
                      state={answers[current]}
                      onSelect={handleSelect}
                      onSubmit={handleSubmit}
                      onNext={handleNext}
                      isLast={current === questions.length - 1}
                    />
                  )}

                  {/* Results */}
                  {stage === "results" && (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <QuizResults
                        questions={questions}
                        answers={answers}
                        weekTitle={weekTitle}
                        onRetry={handleRetry}
                        onClose={handleClose}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
