// frontend/src/components/quiz/QuizModal.tsx  (v3)
// ─────────────────────────────────────────────────────────────────────────────
// Modal for a single topic quiz.
// Opened by TopicQuizBar when user clicks "Take Quiz" / "Retry" for a topic.
//
// Usage:
//   <QuizModal
//     open={open}
//     topic={activeTopic}
//     courseId={courseId}
//     weekNumber={week.week}
//     weekTitle={week.title}
//     subject={subject}
//     totalTopicsInWeek={week.topics.length}
//     onClose={() => setOpen(false)}
//     onScoreSaved={...}
//     onSendToChat={...}
//   />
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Brain, Loader2, AlertCircle, Sparkles, Target } from "lucide-react";
import { Button } from "../button";
import QuizCard from "./QuizCard";
import QuizResults from "./QuizResults";
import { useTopicQuiz } from "../../hooks/useTopicQuiz";

interface Props {
  open: boolean;
  topic: string;
  courseId: string;
  weekNumber: number;
  weekTitle: string;
  subject: string;
  
  totalTopicsInWeek: number;
  onClose: () => void;
  onScoreSaved?: (topic: string, score: number) => Promise<void>;
  onSendToChat?: (prompt: string) => void;
}

export default function QuizModal({
  open,
  topic,
  courseId,
  weekNumber,
  weekTitle,
  subject,
  totalTopicsInWeek,
  onClose,
  onScoreSaved,
  onSendToChat,
}: Props) {
  const quiz = useTopicQuiz(
    courseId,
    weekNumber,
    weekTitle,
    subject,
    totalTopicsInWeek,
    onScoreSaved,
  );

  // Start quiz when modal opens with a topic
  useEffect(() => {
    if (open && topic) quiz.start(topic);
  }, [open, topic]);

  const handleClose = () => {
    onClose();
    setTimeout(quiz.reset, 350);
  };

  const handleNext = async () => {
    if (quiz.current + 1 >= quiz.questions.length) {
      if (quiz.stage === "requiz") {
        quiz.finishReQuiz();
      } else {
        await quiz.finishQuiz();
      }
    } else {
      quiz.nextQuestion();
    }
  };

  const progressPct =
    quiz.isActive && quiz.questions.length > 0
      ? Math.round((quiz.current / quiz.questions.length) * 100)
      : 0;

  const isLoading = ["loading", "submitting", "requiz-loading"].includes(
    quiz.stage,
  );
  const isFocused = quiz.stage === "requiz" || quiz.stage === "requiz-results";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed inset-x-4 top-[5vh] bottom-[5vh] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-2xl z-50 flex flex-col rounded-2xl border border-white/12 bg-gradient-to-b from-gray-950 via-black to-gray-950 shadow-[0_24px_80px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                {isFocused ? (
                  <Target className="h-4 w-4 text-amber-400" />
                ) : (
                  <Sparkles className="h-4 w-4 text-green-400" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white leading-tight">
                      {isFocused ? "Focused Re-quiz" : quiz.topic || topic}
                    </p>
                    {quiz.isCached && !isFocused && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/20 text-blue-400 font-semibold">
                        Cached
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {isFocused ? "Weak subtopics only" : weekTitle}
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
              {quiz.isActive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-0.5 w-full bg-white/8 shrink-0"
                >
                  <motion.div
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className={`h-full ${isFocused ? "bg-amber-400" : "bg-gradient-to-r from-green-500 to-emerald-400"}`}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <AnimatePresence mode="wait">
                {/* Loading states */}
                {isLoading && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-full gap-5 py-16"
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
                          : quiz.stage === "requiz-loading"
                            ? "Building focused re-quiz…"
                            : quiz.isCached
                              ? "Loading quiz…"
                              : "Generating quiz with AI…"}
                      </p>
                      {quiz.stage === "loading" && !quiz.isCached && (
                        <p className="text-xs text-gray-500 mt-1">
                          First time for this topic — one moment
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
                    className="flex flex-col items-center justify-center h-full gap-4 py-16 text-center"
                  >
                    <AlertCircle className="h-10 w-10 text-red-400" />
                    <div>
                      <p className="text-white font-semibold">
                        Failed to load quiz
                      </p>
                      <p className="text-sm text-gray-400 mt-1">{quiz.error}</p>
                    </div>
                    <Button
                      onClick={() => quiz.start(topic)}
                      className="rounded-xl bg-green-600 hover:bg-green-500 font-semibold"
                    >
                      Try Again
                    </Button>
                  </motion.div>
                )}

                {/* Active question */}
                {quiz.isActive && quiz.questions.length > 0 && (
                  <QuizCard
                    key={`${quiz.stage}-${quiz.current}`}
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
                {quiz.isResults && (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <QuizResults
                      topic={quiz.topic}
                      questions={quiz.questions}
                      answers={quiz.answers}
                      attemptResult={quiz.attemptResult}
                      remediation={quiz.remediation}
                      isReQuiz={isFocused}
                      loadingRemediation={
                        quiz.stage === "remediation" && !quiz.remediation
                      }
                      onLoadRemediation={quiz.loadRemediation}
                      onStartReQuiz={quiz.startReQuiz}
                      onSendToChat={(prompt) => {
                        handleClose();
                        if (onSendToChat) onSendToChat(prompt);
                      }}
                      onRetry={() => quiz.start(quiz.topic)}
                      onClose={handleClose}
                    />
                  </motion.div>
                )}

                {/* Remediation stage — loading overlay */}
                {quiz.stage === "remediation" && !quiz.remediation && (
                  <motion.div
                    key="rem-loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center py-8"
                  >
                    <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
