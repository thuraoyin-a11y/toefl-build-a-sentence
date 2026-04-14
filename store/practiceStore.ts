import { create } from "zustand";
import { PracticeSession, Answer, SystemFeedback, PracticeSetRecord, Question, AttemptType } from "@/lib/types";

/**
 * Practice store state interface
 */
interface PracticeState {
  session: PracticeSession;
  currentSetQuestions: Question[];
  currentFeedback: SystemFeedback | null;
  lastSavedAttemptId: string | null; // Database ID of the last saved attempt
}

/**
 * Practice store actions interface
 */
interface PracticeActions {
  // Session management
  startSet: (setId: string, questions: Question[]) => void;
  startRetryMode: (setId: string, wrongQuestionIds: string[], allQuestions: Question[], sourceAttemptDbId?: string) => boolean;
  resetSession: () => void;

  // Navigation within set
  goToNextQuestion: () => void;
  goToPreviousQuestion: () => boolean;
  canGoNext: () => boolean;
  canGoPrevious: () => boolean;
  isLastQuestion: () => boolean;

  // Word manipulation for current question
  addWord: (word: string) => void;
  removeWord: (index: number) => void;
  clearWords: () => void;
  getCurrentQuestionAnswer: () => Answer | null;

  // Submission
  submitCurrentQuestion: () => SystemFeedback;
  submitCompleteSet: (studentId: string) => Promise<PracticeSetRecord>;
  submitRetrySet: (studentId: string) => Promise<PracticeSetRecord>;
  
  // Getters
  getCurrentFeedback: () => SystemFeedback | null;
  getSetProgress: () => { current: number; total: number; completed: number };
  isRetryMode: () => boolean;
  getTotalQuestions: () => number;
  getLastSavedAttemptId: () => string | null;
}

/**
 * Check if student's answer matches correct answer
 * Strict scoring: must have exact length and exact word order
 */
function generateFeedback(
  selectedWords: string[],
  correctWords: string[]
): SystemFeedback {
  // Strict correctness check
  const isCorrect = 
    selectedWords.length === correctWords.length &&
    selectedWords.every((word, index) => 
      word.toLowerCase() === correctWords[index].toLowerCase()
    );

  // Calculate match count for partial scoring
  let matchCount = 0;
  for (let i = 0; i < Math.min(selectedWords.length, correctWords.length); i++) {
    if (selectedWords[i].toLowerCase() === correctWords[i].toLowerCase()) {
      matchCount++;
    }
  }

  // Score based on correct positions
  const score = Math.min(100, Math.round((matchCount / correctWords.length) * 100));

  // Generate appropriate message
  let message: string;
  let grammarTip: string | undefined;
  let improvement: string | undefined;

  if (isCorrect) {
    message = "Correct! Well done.";
    grammarTip = "Great job with this sentence structure.";
    improvement = "Continue to the next question.";
  } else if (score >= 70) {
    message = "Almost! Check the word order.";
    grammarTip = "Most words are correct but the sequence needs adjustment.";
    improvement = "Review the correct answer and compare with your version.";
  } else if (score >= 40) {
    message = "Getting there! Some words are in the right place.";
    grammarTip = "Pay attention to the grammatical pattern.";
    improvement = "Try to identify the main verb and subject first.";
  } else if (selectedWords.length === 0) {
    message = "No answer submitted for this question.";
    grammarTip = "Select words from the word bank to build your answer.";
    improvement = "Read the context carefully before selecting words.";
  } else {
    message = "Keep practicing! This one was tricky.";
    grammarTip = "Review the grammar explanation after completing the set.";
    improvement = "Study the correct answer and understand why it's structured that way.";
  }

  return {
    isCorrect,
    score,
    correctWords,
    message,
    grammarTip,
    improvement,
  };
}

/**
 * Practice store - manages practice set sessions
 * Handles 10-question set progress, answer tracking, and submission
 * 
 * V2 Architecture: All persistence is via API calls to the database.
 * No localStorage or mock data usage.
 */
export const usePracticeStore = create<PracticeState & PracticeActions>((set, get) => ({
  // Initial state
  session: {
    setId: null,
    currentQuestionIndex: 0,
    answers: [],
    startTime: null,
    mode: "normal",
    sourceAttemptId: undefined,
    wrongQuestionIds: undefined,
  },
  currentSetQuestions: [],
  currentFeedback: null,
  lastSavedAttemptId: null,

  // Actions
  startSet: (setId: string, questions: Question[]) => {
    if (!questions || questions.length === 0) {
      console.error("startSet requires questions array");
      return;
    }
    
    set({
      session: {
        setId,
        currentQuestionIndex: 0,
        answers: [],
        startTime: new Date(),
        mode: "normal",
        sourceAttemptId: undefined,
        wrongQuestionIds: undefined,
      },
      currentSetQuestions: questions,
      currentFeedback: null,
      lastSavedAttemptId: null,
    });
  },

  startRetryMode: (setId: string, wrongQuestionIds: string[], allQuestions: Question[], sourceAttemptDbId?: string) => {
    if (!wrongQuestionIds || wrongQuestionIds.length === 0) {
      console.log("No wrong answers to retry");
      return false;
    }

    if (!allQuestions || allQuestions.length === 0) {
      console.error("startRetryMode requires allQuestions array");
      return false;
    }

    // Filter to only wrong questions
    const retryQuestions = allQuestions.filter(q => wrongQuestionIds.includes(q.id));
    
    if (retryQuestions.length === 0) {
      console.error("No matching questions found for retry");
      return false;
    }

    set({
      session: {
        setId,
        currentQuestionIndex: 0,
        answers: [],
        startTime: new Date(),
        mode: "retry_mistakes",
        sourceAttemptId: sourceAttemptDbId, // Use database ID
        wrongQuestionIds,
      },
      currentSetQuestions: retryQuestions,
      currentFeedback: null,
      lastSavedAttemptId: null,
    });

    return true;
  },

  resetSession: () =>
    set({
      session: {
        setId: null,
        currentQuestionIndex: 0,
        answers: [],
        startTime: null,
        mode: "normal",
        sourceAttemptId: undefined,
        wrongQuestionIds: undefined,
      },
      currentSetQuestions: [],
      currentFeedback: null,
      lastSavedAttemptId: null,
    }),

  goToNextQuestion: () => {
    const state = get();
    const { session, currentSetQuestions } = state;
    const totalQuestions = currentSetQuestions.length;
    
    if (session.currentQuestionIndex < totalQuestions - 1) {
      set({
        session: {
          ...session,
          currentQuestionIndex: session.currentQuestionIndex + 1,
        },
        currentFeedback: null,
      });
    }
  },

  goToPreviousQuestion: () => {
    const state = get();
    const { session } = state;
    if (session.currentQuestionIndex > 0) {
      set({
        session: {
          ...session,
          currentQuestionIndex: session.currentQuestionIndex - 1,
        },
        currentFeedback: null,
      });
      return true;
    }
    return false;
  },

  canGoNext: () => {
    const state = get();
    const { session, currentSetQuestions } = state;
    return session.currentQuestionIndex < currentSetQuestions.length - 1;
  },

  canGoPrevious: () => {
    const state = get();
    const { session } = state;
    return session.currentQuestionIndex > 0;
  },

  isLastQuestion: () => {
    const state = get();
    const { session, currentSetQuestions } = state;
    return session.currentQuestionIndex === currentSetQuestions.length - 1;
  },

  addWord: (word: string) => {
    const state = get();
    const { session, currentSetQuestions } = state;
    const currentQuestion = currentSetQuestions[session.currentQuestionIndex];
    
    if (!currentQuestion) return;

    // Update or create answer for current question
    const updatedAnswers = [...session.answers];
    const existingAnswerIndex = updatedAnswers.findIndex(
      (a) => a.questionId === currentQuestion.id
    );

    if (existingAnswerIndex >= 0) {
      updatedAnswers[existingAnswerIndex] = {
        ...updatedAnswers[existingAnswerIndex],
        selectedWords: [...updatedAnswers[existingAnswerIndex].selectedWords, word],
      };
    } else {
      updatedAnswers.push({
        questionId: currentQuestion.id,
        selectedWords: [word],
        isCorrect: false,
        score: 0,
      });
    }

    set({
      session: {
        ...session,
        answers: updatedAnswers,
      },
    });
  },

  removeWord: (index: number) => {
    const state = get();
    const { session, currentSetQuestions } = state;
    const currentQuestion = currentSetQuestions[session.currentQuestionIndex];
    
    if (!currentQuestion) return;

    const updatedAnswers = [...session.answers];
    const existingAnswerIndex = updatedAnswers.findIndex(
      (a) => a.questionId === currentQuestion.id
    );

    if (existingAnswerIndex >= 0) {
      updatedAnswers[existingAnswerIndex] = {
        ...updatedAnswers[existingAnswerIndex],
        selectedWords: updatedAnswers[existingAnswerIndex].selectedWords.filter((_, i) => i !== index),
      };
      
      set({
        session: {
          ...session,
          answers: updatedAnswers,
        },
      });
    }
  },

  clearWords: () => {
    const state = get();
    const { session, currentSetQuestions } = state;
    const currentQuestion = currentSetQuestions[session.currentQuestionIndex];
    
    if (!currentQuestion) return;

    const updatedAnswers = [...session.answers];
    const existingAnswerIndex = updatedAnswers.findIndex(
      (a) => a.questionId === currentQuestion.id
    );

    if (existingAnswerIndex >= 0) {
      updatedAnswers[existingAnswerIndex] = {
        ...updatedAnswers[existingAnswerIndex],
        selectedWords: [],
      };
      
      set({
        session: {
          ...session,
          answers: updatedAnswers,
        },
      });
    }
  },

  getCurrentQuestionAnswer: () => {
    const state = get();
    const { session, currentSetQuestions } = state;
    const currentQuestion = currentSetQuestions[session.currentQuestionIndex];
    
    if (!currentQuestion) return null;
    
    return session.answers.find((a) => a.questionId === currentQuestion.id) || null;
  },

  submitCurrentQuestion: () => {
    const state = get();
    const { session, currentSetQuestions } = state;
    const currentQuestion = currentSetQuestions[session.currentQuestionIndex];
    
    if (!currentQuestion) {
      throw new Error("No current question");
    }

    const currentAnswer = session.answers.find(
      (a) => a.questionId === currentQuestion.id
    );

    const selectedWords = currentAnswer?.selectedWords || [];
    const feedback = generateFeedback(selectedWords, currentQuestion.correctAnswer);

    // Update answer with score
    const updatedAnswers = [...session.answers];
    const answerIndex = updatedAnswers.findIndex(
      (a) => a.questionId === currentQuestion.id
    );

    if (answerIndex >= 0) {
      updatedAnswers[answerIndex] = {
        ...updatedAnswers[answerIndex],
        isCorrect: feedback.isCorrect,
        score: feedback.score,
      };
    } else {
      updatedAnswers.push({
        questionId: currentQuestion.id,
        selectedWords,
        isCorrect: feedback.isCorrect,
        score: feedback.score,
      });
    }

    set({
      session: {
        ...session,
        answers: updatedAnswers,
      },
      currentFeedback: feedback,
    });

    return feedback;
  },

  submitCompleteSet: async (studentId: string) => {
    const state = get();
    const { session, currentSetQuestions } = state;

    if (!session.setId) {
      throw new Error("No active set");
    }

    // Calculate total score
    const correctCount = session.answers.filter((a) => a.isCorrect).length;
    const totalQuestions = currentSetQuestions.length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    // Ensure all questions have answers (fill empty ones)
    const completeAnswers: Answer[] = currentSetQuestions.map((q) => {
      const existing = session.answers.find((a) => a.questionId === q.id);
      if (existing) return existing;
      
      // Return empty answer for unanswered questions
      return {
        questionId: q.id,
        selectedWords: [],
        isCorrect: false,
        score: 0,
      };
    });

    const wrongAnswers = completeAnswers.filter(a => !a.isCorrect);
    const apiPayload = {
      practiceSetId: session.setId,
      attemptType: "full_attempt" as AttemptType,
      correctCount,
      totalQuestions,
      answers: Object.fromEntries(
        completeAnswers.map(a => [a.questionId, {
          selectedWords: a.selectedWords,
          isCorrect: a.isCorrect,
          timeSpent: 0,
        }])
      ),
      wrongItemIds: wrongAnswers.map(a => a.questionId),
      assignmentId: null,
      sourceAttemptId: null,
    };

    // Save to database via API and wait for response
    try {
      const res = await fetch("/api/student/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiPayload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to save attempt");
      }

      const data = await res.json();
      const dbAttemptId = data.attempt?.id;
      
      // Store the database attempt ID
      if (dbAttemptId) {
        set({ lastSavedAttemptId: dbAttemptId });
      }

      const record: PracticeSetRecord = {
        id: dbAttemptId || `temp-${Date.now()}`,
        setId: session.setId,
        studentId,
        answers: completeAnswers,
        completedAt: new Date(),
        totalScore: correctCount,
        percentage,
        attemptType: "full_attempt" as AttemptType,
      };

      return record;
    } catch (err) {
      console.error("Failed to save attempt to database:", err);
      throw err;
    }
  },

  submitRetrySet: async (studentId: string) => {
    const state = get();
    const { session, currentSetQuestions } = state;

    if (!session.setId || !session.sourceAttemptId) {
      throw new Error("No active retry session");
    }

    const totalQuestions = currentSetQuestions.length;
    
    // Calculate score for retry questions
    const correctCount = session.answers.filter((a) => a.isCorrect).length;
    const percentage = totalQuestions > 0 
      ? Math.round((correctCount / totalQuestions) * 100) 
      : 0;

    // Ensure all retry questions have answers
    const completeAnswers: Answer[] = currentSetQuestions.map((q) => {
      const existing = session.answers.find((a) => a.questionId === q.id);
      if (existing) return existing;
      
      return {
        questionId: q.id,
        selectedWords: [],
        isCorrect: false,
        score: 0,
      };
    });

    const wrongAnswers = completeAnswers.filter(a => !a.isCorrect);
    const apiPayload = {
      practiceSetId: session.setId,
      attemptType: "retry_attempt" as AttemptType,
      correctCount,
      totalQuestions,
      answers: Object.fromEntries(
        completeAnswers.map(a => [a.questionId, {
          selectedWords: a.selectedWords,
          isCorrect: a.isCorrect,
          timeSpent: 0,
        }])
      ),
      wrongItemIds: wrongAnswers.map(a => a.questionId),
      assignmentId: null,
      sourceAttemptId: session.sourceAttemptId, // Database ID
    };

    // Save to database via API and wait for response
    try {
      const res = await fetch("/api/student/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiPayload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to save retry attempt");
      }

      const data = await res.json();
      const dbAttemptId = data.attempt?.id;
      
      // Store the database attempt ID
      if (dbAttemptId) {
        set({ lastSavedAttemptId: dbAttemptId });
      }

      const record: PracticeSetRecord = {
        id: dbAttemptId || `retry-temp-${Date.now()}`,
        setId: session.setId,
        studentId,
        answers: completeAnswers,
        completedAt: new Date(),
        totalScore: correctCount,
        percentage,
        attemptType: "retry_attempt" as AttemptType,
        sourceAttemptId: session.sourceAttemptId,
      };

      return record;
    } catch (err) {
      console.error("Failed to save retry attempt to database:", err);
      throw err;
    }
  },

  getCurrentFeedback: () => get().currentFeedback,

  getSetProgress: () => {
    const state = get();
    const { session, currentSetQuestions } = state;
    const total = currentSetQuestions.length || 10;
    return {
      current: session.currentQuestionIndex + 1,
      total,
      completed: session.answers.length,
    };
  },

  isRetryMode: () => {
    return get().session.mode === "retry_mistakes";
  },

  getTotalQuestions: () => {
    return get().currentSetQuestions.length;
  },

  getLastSavedAttemptId: () => {
    return get().lastSavedAttemptId;
  },
}));
