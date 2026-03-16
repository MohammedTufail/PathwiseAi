// ─── components/quiz/QuizCard.tsx ────────────────────────────────────────────
// Renders a single quiz question — options, submit, explanation reveal.
// Fully self-contained; parent tracks answerState.
// ─────────────────────────────────────────────────────────────────────────────

import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Lightbulb,
  Target,
  Zap,
  Brain,
} from "lucide-react";
import { Button } from "../button";
import type {
  QuizQuestion,
  AnswerState,
  Difficulty,
  QuestionType,
} from "./quiz.types";

// ─── helpers ─────────────────────────────────────────────────────────────────

const OPTION_LABELS = ["A", "B", "C", "D"];

const difficultyConfig: Record<Difficulty, { label: string; color: string }> = {
  easy: {
    label: "Easy",
    color: "text-green-400 bg-green-500/10 border-green-500/20",
  },
  medium: {
    label: "Medium",
    color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  },
  hard: {
    label: "Hard",
    color: "text-red-400 bg-red-500/10 border-red-500/20",
  },
};

const qtypeConfig: Record<
  QuestionType,
  { label: string; icon: React.ReactNode }
> = {
  mcq: { label: "Multiple Choice", icon: <Target className="h-3 w-3" /> },
  true_false: { label: "True / False", icon: <Zap className="h-3 w-3" /> },
  scenario: { label: "Scenario", icon: <Brain className="h-3 w-3" /> },
};

function getOptionState(
  label: string,
  state: AnswerState,
  correctAnswer: string,
): "default" | "selected" | "correct" | "wrong" | "reveal-correct" {
  if (!state.submitted) {
    return state.selected === label ? "selected" : "default";
  }
  if (label === correctAnswer) return "correct";
  if (label === state.selected && !state.correct) return "wrong";
  return "default";
}

const optionStyles: Record<string, string> = {
  default:
    "border-white/10 bg-white/4 text-gray-300 hover:border-green-400/30 hover:bg-green-500/5",
  selected: "border-green-400/60 bg-green-500/10 text-white",
  correct: "border-green-500 bg-green-500/15 text-green-300",
  wrong: "border-red-500/70 bg-red-500/10 text-red-300",
  "reveal-correct": "border-white/10 bg-white/4 text-gray-500",
};

// ─── component ───────────────────────────────────────────────────────────────

interface Props {
  question: QuizQuestion;
  index: number;
  total: number;
  state: AnswerState;
  onSelect: (label: string) => void;
  onSubmit: () => void;
  onNext: () => void;
  isLast: boolean;
}

export default function QuizCard({
  question,
  index,
  total,
  state,
  onSelect,
  onSubmit,
  onNext,
  isLast,
}: Props) {
  const diff = difficultyConfig[question.difficulty] ?? difficultyConfig.medium;
  const qtype = qtypeConfig[question.question_type] ?? qtypeConfig.mcq;

  const isTrueFalse = question.question_type === "true_false";
  const options = isTrueFalse
    ? ["True", "False"]
    : question.options.map((_, i) => OPTION_LABELS[i]);

  const getOptionText = (label: string) => {
    if (isTrueFalse) return label;
    const idx = OPTION_LABELS.indexOf(label);
    return question.options[idx] ?? label;
  };

  return (
    <motion.div
      key={index}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex flex-col gap-5"
    >
      {/* ── Header row ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Question counter */}
          <span className="text-xs font-semibold text-gray-500 tracking-widest uppercase">
            {index + 1} / {total}
          </span>

          {/* Difficulty badge */}
          <span
            className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider ${diff.color}`}
          >
            {diff.label}
          </span>

          {/* Question-type badge */}
          <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-gray-400 uppercase tracking-wider">
            {qtype.icon}
            {qtype.label}
          </span>
        </div>

        {/* Topic pill */}
        <span className="text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full font-medium truncate max-w-[160px]">
          {question.topic}
        </span>
      </div>

      {/* ── Question text ── */}
      <p className="text-white font-medium text-base leading-relaxed">
        {question.question}
      </p>

      {/* ── Options ── */}
      <div
        className={`grid gap-2.5 ${isTrueFalse ? "grid-cols-2" : "grid-cols-1"}`}
      >
        {options.map((label) => {
          const optState = getOptionState(label, state, question.answer);
          return (
            <motion.button
              key={label}
              whileTap={!state.submitted ? { scale: 0.98 } : {}}
              onClick={() => !state.submitted && onSelect(label)}
              disabled={state.submitted}
              className={`
                relative flex items-center gap-3 w-full text-left
                px-4 py-3 rounded-xl border transition-all duration-200
                ${optionStyles[optState]}
                ${state.submitted ? "cursor-default" : "cursor-pointer"}
              `}
            >
              {/* Label bubble */}
              {!isTrueFalse && (
                <span
                  className={`
                  shrink-0 h-6 w-6 rounded-full border flex items-center justify-center
                  text-[11px] font-bold transition-colors duration-200
                  ${
                    optState === "correct"
                      ? "border-green-500 text-green-400 bg-green-500/10"
                      : optState === "wrong"
                        ? "border-red-500 text-red-400 bg-red-500/10"
                        : optState === "selected"
                          ? "border-green-400 text-green-400"
                          : "border-white/20 text-gray-500"
                  }
                `}
                >
                  {label}
                </span>
              )}

              <span className="flex-1 text-sm leading-snug">
                {getOptionText(label)}
              </span>

              {/* Result icon */}
              {state.submitted && optState === "correct" && (
                <CheckCircle2 className="shrink-0 h-4 w-4 text-green-400" />
              )}
              {state.submitted && optState === "wrong" && (
                <XCircle className="shrink-0 h-4 w-4 text-red-400" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* ── Explanation (revealed after submit) ── */}
      <AnimatePresence>
        {state.submitted && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div
              className={`
              flex gap-3 p-4 rounded-xl border
              ${
                state.correct
                  ? "bg-green-500/8 border-green-500/20"
                  : "bg-orange-500/8 border-orange-500/20"
              }
            `}
            >
              <Lightbulb
                className={`shrink-0 h-4 w-4 mt-0.5 ${state.correct ? "text-green-400" : "text-orange-400"}`}
              />
              <p className="text-sm text-gray-300 leading-relaxed">
                {question.explanation}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Action buttons ── */}
      <div className="flex items-center justify-between gap-3 pt-1">
        {!state.submitted ? (
          <Button
            onClick={onSubmit}
            disabled={!state.selected}
            className="ml-auto rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_10px_#16a34a] hover:shadow-[0_0_18px_#22c55e] transition-all duration-300 font-semibold"
          >
            Submit Answer
          </Button>
        ) : (
          <Button
            onClick={onNext}
            className="ml-auto rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-semibold transition-all duration-200"
          >
            {isLast ? "See Results →" : "Next Question →"}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
