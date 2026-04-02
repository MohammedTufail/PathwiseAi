// frontend/src/components/quiz/QuizModal.tsx  (v2)
// ─────────────────────────────────────────────────────────────────────────────
// Pure UI orchestrator. All logic lives in useQuiz hook.
//
// Stage flow:
//   idle → loading → active → submitting → results
//                                        → focused-loading → focused → focused-results
//
// Changes from v1:
//   - No Groq calls — questions fetched from /api/quiz backend
//   - No mock question bank in this file (mock bank kept in useQuiz for offline)
//   - finishQuiz() called when last question is answered (not on Next click)
//   - Results screen shows topic breakdown + weak topics button
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Brain,
  Loader2,
  AlertCircle,
  Sparkles,
  Target,
} from "lucide-react";
import { Button } from "../button";
import QuizCard from "./QuizCard";
import QuizResults from "./QuizResults";
import { useQuiz } from "../../hooks/useQuiz";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  courseId: string;
  subject: string;
  topics: string[];
  weekTitle: string;
  weekNumber: number;
  difficulty?: "easy" | "medium" | "hard" | "mixed";
  total?: number;
  onComplete?: (score: number) => Promise<void>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function QuizModal({
  courseId,
  subject,
  topics,
  weekTitle,
  weekNumber,
  onComplete,
}: Props) {
  const [open, setOpen] = useState(false);

  const quiz = useQuiz(
    courseId,
    weekNumber,
    weekTitle,
    subject,
    topics,
    onComplete,
  );

  const handleOpen = () => {
    setOpen(true);
    quiz.start();
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(quiz.reset, 350);
  };

  // When last question is answered and user clicks "See Results"
  const handleNext = async () => {
    if (quiz.current + 1 >= quiz.questions.length) {
      await quiz.finishQuiz();
    } else {
      quiz.nextQuestion();
    }
  };

  const progressPct =
    quiz.stage === "active" || quiz.stage === "focused"
      ? Math.round((quiz.current / Math.max(quiz.questions.length, 1)) * 100)
      : 0;

  const isActiveStage = quiz.stage === "active" || quiz.stage === "focused";
  const isResultsStage =
    quiz.stage === "results" || quiz.stage === "focused-results";
  const isFocused =
    quiz.stage === "focused" || quiz.stage === "focused-results";

  return (
    <>
      {/* Trigger */}
      <Button
        onClick={handleOpen}
        className="flex items-center gap-2 rounded-xl bg-white/8 hover:bg-white/12 border border-white/10 hover:border-green-400/40 text-white font-semibold transition-all duration-300"
      >
        <Brain className="h-4 w-4 text-green-400" />
        Take Quiz
      </Button>

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
              className="fixed inset-x-4 top-[5vh] bottom-[5vh] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-2xl z-50 flex flex-col rounded-2xl border border-white/12 bg-gradient-to-b from-gray-950 via-black to-gray-950 shadow-[0_24px_80px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  {isFocused ? (
                    <Target className="h-4 w-4 text-amber-400" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-green-400" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white leading-tight">
                        {isFocused ? "Focused Practice" : `${weekTitle} Quiz`}
                      </p>
                      {quiz.isCached && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-400 font-semibold">
                          Cached
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 leading-none mt-0.5">
                      {isFocused
                        ? "Questions on your weak topics only"
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
                {isActiveStage && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-0.5 w-full bg-white/8 shrink-0"
                  >
                    <motion.div
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className={`h-full ${isFocused ? "bg-amber-400" : "bg-gradient-to-r from-green-500 to-emerald-400"}`}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <AnimatePresence mode="wait">
                  {/* Loading */}
                  {(quiz.stage === "loading" ||
                    quiz.stage === "focused-loading" ||
                    quiz.stage === "submitting") && (
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
                          {quiz.stage === "submitting"
                            ? "Saving your results…"
                            : quiz.stage === "focused-loading"
                              ? "Building focused practice…"
                              : "Loading your quiz…"}
                        </p>
                        {quiz.stage === "loading" && (
                          <p className="text-sm text-gray-500 mt-1">
                            {quiz.isCached
                              ? "Fetching cached questions…"
                              : "Generating questions with AI — one moment…"}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Error */}
                  {quiz.stage === "idle" && quiz.error && (
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
                          Failed to load quiz
                        </p>
                        <p className="text-sm text-gray-400 mt-1 max-w-sm">
                          {quiz.error}
                        </p>
                      </div>
                      <Button
                        onClick={quiz.start}
                        className="rounded-xl bg-green-600 hover:bg-green-500 shadow-[0_0_10px_#16a34a] font-semibold"
                      >
                        Try Again
                      </Button>
                    </motion.div>
                  )}

                  {/* Active question */}
                  {isActiveStage && quiz.questions.length > 0 && (
                    <QuizCard
                      key={`${isFocused ? "focused" : "main"}-${quiz.current}`}
                      question={quiz.questions[quiz.current]}
                      index={quiz.current}
                      total={quiz.questions.length}
                      state={quiz.answers[quiz.current]}
                      onSelect={quiz.selectAnswer}
                      onSubmit={quiz.submitAnswer}
                      onNext={handleNext}
                      isLast={quiz.current === quiz.questions.length - 1}
                    />
                  )}

                  {/* Results */}
                  {isResultsStage && (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <QuizResults
                        questions={quiz.questions}
                        answers={quiz.answers}
                        weekTitle={weekTitle}
                        attemptResult={quiz.attemptResult}
                        isFocused={isFocused}
                        onRetry={() =>
                          isFocused
                            ? quiz.startFocused(
                                quiz.attemptResult?.weakTopics ?? [],
                              )
                            : quiz.start()
                        }
                        onFocused={quiz.startFocused}
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
