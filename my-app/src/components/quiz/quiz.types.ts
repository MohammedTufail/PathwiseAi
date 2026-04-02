// Shared types for the entire quiz component family.
// Mirror the shape returned by the backend QuizResult.to_dict()


export type QuestionType = "mcq" | "true_false" | "scenario";
export type Difficulty = "easy" | "medium" | "hard";

export interface QuizQuestion {
  question: string;
  options: string[]; // 4 items for mcq/scenario, 2 for true_false
  answer: string; // "A"|"B"|"C"|"D"  or  "True"|"False"
  explanation: string;
  topic: string;
  difficulty: Difficulty;
  question_type: QuestionType;
}

export interface QuizMeta {
  subject: string;
  topics: string[];
  total_questions: number;
  difficulty_mode: string;
  difficulty_distribution: Record<Difficulty, number>;
  type_distribution: Record<QuestionType, number>;
  generated_at: number;
}

export interface QuizPayload {
  quiz: QuizQuestion[];
  meta: QuizMeta;
}

// What LearningPath passes into <QuizModal />
export interface QuizTriggerProps {
  courseId: string;
  weekNumber: number;
  subject: string;
  topics: string[];
  weekTitle: string;
}
// Per-question answered state tracked inside the modal
export interface AnswerState {
  selected: string | null; // e.g. "A" or "True"
  submitted: boolean;
  correct: boolean;
}
