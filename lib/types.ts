/**
 * User role type - extensible for future teacher role
 */
export type UserRole = "student" | "teacher";

/**
 * User entity
 */
export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

/**
 * Question difficulty level
 */
export type Difficulty = "easy" | "medium" | "hard";

/**
 * Attempt type for practice records
 */
export type AttemptType = "full_attempt" | "retry_attempt";

/**
 * Build a Sentence question (single question)
 */
export interface Question {
  id: string;
  context: string; // Context sentence with blank
  wordBank: string[]; // Available words to choose from
  correctAnswer: string[]; // Correct word sequence
  hint?: string;
  explanation?: string; // Grammar explanation
}

/**
 * Practice Set - a complete practice session containing 10 questions
 */
export interface PracticeSet {
  id: string;
  title: string;
  description: string;
  questionIds: string[]; // Array of 10 question IDs
  difficulty: Difficulty;
}

/**
 * Student's answer to a single question
 */
export interface Answer {
  questionId: string;
  selectedWords: string[];
  isCorrect: boolean;
  score: number; // 0-100 for this question
}

/**
 * System feedback for a single answer
 */
export interface SystemFeedback {
  isCorrect: boolean;
  score: number; // 0-100
  correctWords: string[];
  message: string;
  grammarTip?: string;
  improvement?: string;
}

/**
 * Record of a completed practice set (10 questions)
 */
export interface PracticeSetRecord {
  id: string;
  setId: string;
  studentId: string;
  answers: Answer[]; // Array of 10 answers (or fewer for retry)
  completedAt: Date;
  totalScore: number; // Total correct count (0-10 for full, 0-N for retry)
  percentage: number; // Overall percentage (0-100)
  attemptType: AttemptType; // Type of attempt
  sourceAttemptId?: string; // For retry: points to the source attempt
}

/**
 * Practice session state - tracks progress through a practice set
 */
export interface PracticeSession {
  setId: string | null;
  currentQuestionIndex: number; // 0-9, which question in the set
  answers: Answer[]; // Answers given so far
  startTime: Date | null;
  mode: "normal" | "retry_mistakes"; // Current practice mode
  sourceAttemptId?: string; // For retry mode: source attempt ID
  wrongQuestionIds?: string[]; // For retry mode: list of question IDs to retry
}

/**
 * Teacher configuration for daily assignments
 */
export interface TeacherConfig {
  dailyRequiredSets: number; // How many sets per day (e.g., 2)
  assignedSetIds: string[]; // Which sets are assigned today
}
