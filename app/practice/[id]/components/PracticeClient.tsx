"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SentenceBuilder } from "@/components/practice/SentenceBuilder";
import { WordBank } from "@/components/practice/WordBank";
import { PracticeSet, Question } from "@/lib/types";
import { usePracticeStore } from "@/store/practiceStore";
import { useUserStore } from "@/store/userStore";
import { ArrowLeft, ArrowRight, RotateCcw, Send, CheckCircle2, RefreshCw } from "lucide-react";
import Link from "next/link";

interface PracticeClientProps {
  practiceSet: PracticeSet;
  questions: Question[];
  mode?: "normal" | "retry_mistakes";
  sourceAttemptId?: string;
  assignmentId?: string;
}

export function PracticeClient({ 
  practiceSet, 
  questions,
  mode = "normal",
  sourceAttemptId,
  assignmentId,
}: PracticeClientProps) {
  const router = useRouter();
  const { currentUser } = useUserStore();

  const {
    session,
    currentSetQuestions,
    startSet,
    startRetryMode,
    addWord,
    removeWord,
    clearWords,
    goToNextQuestion,
    canGoNext,
    isLastQuestion,
    submitCurrentQuestion,
    submitCompleteSet,
    submitRetrySet,
    getCurrentQuestionAnswer,
    getSetProgress,
    currentFeedback,
    isRetryMode,
    getTotalQuestions,
    getLastSavedAttemptId,
  } = usePracticeStore();

  // Local state for completion error and retry loading
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [isRetryLoading, setIsRetryLoading] = useState(mode === "retry_mistakes" && !!sourceAttemptId);
  const [retryError, setRetryError] = useState<string | null>(null);

  // Initialize set when component mounts
  useEffect(() => {
    // Check if we need to initialize:
    // 1. Different set ID
    // 2. Different mode
    // 3. Different source attempt ID (for retry mode)
    const needsInit = 
      session.setId !== practiceSet.id || 
      session.mode !== mode ||
      (mode === "retry_mistakes" && session.sourceAttemptId !== sourceAttemptId);
    
    if (!needsInit) {
      setIsRetryLoading(false);
      return;
    }

    if (mode === "retry_mistakes" && sourceAttemptId) {
      // Fetch source attempt from API to get wrong question IDs
      setIsRetryLoading(true);
      fetch(`/api/student/attempts?id=${sourceAttemptId}`)
        .then(res => {
          if (!res.ok) throw new Error("Failed to load source attempt");
          return res.json();
        })
        .then(data => {
          const attempt = data.attempt;
          if (!attempt) {
            throw new Error("Source attempt not found");
          }

          // Parse wrongItems or extract wrong answers from answers data
          let wrongQuestionIds: string[] = [];
          if (attempt.wrongItems && Array.isArray(attempt.wrongItems)) {
            wrongQuestionIds = attempt.wrongItems.map((item: { id: string }) => item.id);
          } else if (attempt.answers) {
            // Extract wrong answers from the answers object
            wrongQuestionIds = Object.entries(attempt.answers as Record<string, { isCorrect: boolean }>)
              .filter(([, answer]) => !answer.isCorrect)
              .map(([questionId]) => questionId);
          }

          if (wrongQuestionIds.length === 0) {
            // No wrong answers, redirect to normal practice
            router.replace(`/practice/${practiceSet.id}`);
            return;
          }

          // Start retry mode with the wrong question IDs
          const success = startRetryMode(practiceSet.id, wrongQuestionIds, questions, sourceAttemptId);
          if (!success) {
            router.replace(`/practice/${practiceSet.id}`);
          }
        })
        .catch(err => {
          console.error("Failed to load retry source:", err);
          setRetryError("Failed to load retry data. Redirecting to normal practice...");
          setTimeout(() => {
            router.replace(`/practice/${practiceSet.id}`);
          }, 2000);
        })
        .finally(() => {
          setIsRetryLoading(false);
        });
    } else {
      // Start normal mode
      startSet(practiceSet.id, questions);
      setIsRetryLoading(false);
    }
  }, [practiceSet.id, mode, sourceAttemptId, session.setId, session.mode, session.sourceAttemptId, startSet, startRetryMode, router, questions]);

  // Get current question
  const currentQuestion = currentSetQuestions[session.currentQuestionIndex];
  const currentAnswer = getCurrentQuestionAnswer();
  const progress = getSetProgress();
  const retryMode = isRetryMode();
  const totalQuestions = getTotalQuestions();

  // Handle submit current question
  const handleSubmitQuestion = () => {
    submitCurrentQuestion();
  };

  // Handle go to next or complete set
  const handleNext = async () => {
    // Use progress to determine if this is the last question
    const isLastQ = progress.current >= progress.total;
    
    if (isLastQ) {
      // Submit set
      if (currentUser) {
        if (retryMode) {
          try {
            const record = await submitRetrySet(currentUser.id);
            // Use the database attempt ID for navigation
            const dbAttemptId = getLastSavedAttemptId() || record.id;
            // Navigate to retry result page
            router.push(`/result/${practiceSet.id}?mode=retry&source=${dbAttemptId}`);
          } catch (err) {
            setCompletionError("Failed to save retry. Please try again.");
          }
        } else {
          try {
            const record = await submitCompleteSet(currentUser.id);
            // Use the database attempt ID for navigation
            const dbAttemptId = getLastSavedAttemptId() || record.id;
            
            // If assignment context exists, mark assignment as complete
            if (assignmentId) {
              try {
                const response = await fetch(`/api/student/assignments/${assignmentId}/complete`, {
                  method: "POST",
                });
                if (!response.ok) {
                  setCompletionError("Failed to mark assignment complete. Please try again.");
                  return; // Stay on page to show error
                }
              } catch (err) {
                setCompletionError("Failed to mark assignment complete. Please try again.");
                return; // Stay on page to show error
              }
            }
            
            // Navigate to normal result page with database attempt ID
            router.push(`/result/${practiceSet.id}?source=${dbAttemptId}`);
          } catch (err) {
            setCompletionError("Failed to save attempt. Please try again.");
          }
        }
      }
    } else {
      goToNextQuestion();
    }
  };

  // Handle reset current question
  const handleReset = () => {
    clearWords();
  };

  // Show loading state while retry data is loading
  if (isRetryLoading) {
    return (
      <Container size="md">
        <div className="text-center py-16">
          <p className="text-apple-text-secondary">
            {retryMode ? "Loading retry questions..." : "Loading practice set..."}
          </p>
        </div>
      </Container>
    );
  }

  // Show error state
  if (retryError) {
    return (
      <Container size="md">
        <div className="text-center py-16">
          <p className="text-apple-text-secondary">{retryError}</p>
        </div>
      </Container>
    );
  }

  if (!currentQuestion) {
    return (
      <Container size="md">
        <div className="text-center py-16">
          <p className="text-apple-text-secondary">
            {retryMode ? "Loading retry questions..." : "Loading practice set..."}
          </p>
        </div>
      </Container>
    );
  }

  const hasAnswer = currentAnswer && currentAnswer.selectedWords.length > 0;
  const isSubmitted = currentFeedback !== null;

  return (
    <Container size="md">
      {/* Header with progress */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Exit
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-apple-text">
            {retryMode ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-blue-500" />
                Retry Mistakes
              </span>
            ) : (
              practiceSet.title
            )}
          </h1>
          <p className="text-sm text-apple-text-secondary">
            {retryMode 
              ? `Retry ${progress.current} of ${progress.total}`
              : `Question ${progress.current} of ${progress.total}`
            }
          </p>
        </div>
        <div className="text-sm font-medium text-apple-text-secondary">
          {progress.completed} / {progress.total} answered
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="h-2 bg-apple-gray rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              retryMode ? "bg-blue-500" : "bg-apple-blue"
            }`}
            style={{ width: `${(progress.current / progress.total) * 100}%` }}
          />
        </div>
      </div>

      {/* Retry mode indicator */}
      {retryMode && (
        <Card variant="outlined" className="mb-6 bg-blue-50/30 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Retry Mode:</span> You are practicing only the questions you got wrong. 
              Complete all {totalQuestions} questions to finish.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Context card - showing the dialogue context */}
      <Card variant="outlined" className="mb-6 bg-blue-50/30 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm font-medium text-blue-800 mb-2">Context:</p>
          <p className="text-apple-text whitespace-pre-line leading-relaxed">
            {currentQuestion.context}
          </p>
        </CardContent>
      </Card>

      {/* Task card - student needs to build reply/question */}
      <Card variant="elevated" className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Build your response:</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <SentenceBuilder
            context="Your reply: _______."
            selectedWords={currentAnswer?.selectedWords || []}
            onRemoveWord={removeWord}
          />

          <div className="h-px bg-apple-border/50" />

          <WordBank
            words={currentQuestion.wordBank}
            usedWords={currentAnswer?.selectedWords || []}
            onSelectWord={addWord}
          />
        </CardContent>
      </Card>

      {/* Feedback card (shown after submission) */}
      {isSubmitted && currentFeedback && (
        <Card 
          variant="outlined" 
          className={`mb-6 ${currentFeedback.isCorrect ? "border-l-4 border-l-apple-success bg-green-50/30" : "border-l-4 border-l-apple-warning bg-amber-50/30"}`}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {currentFeedback.isCorrect ? (
                <CheckCircle2 className="h-5 w-5 text-apple-success mt-0.5 flex-shrink-0" />
              ) : (
                <div className="h-5 w-5 rounded-full bg-apple-warning flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
              )}
              <div>
                <p className={`font-medium ${currentFeedback.isCorrect ? "text-green-800" : "text-amber-800"}`}>
                  {currentFeedback.isCorrect ? "Correct!" : "Sorry..."}
                </p>
                <p className="text-sm text-apple-text-secondary mt-1">
                  {currentFeedback.message}
                </p>
                {!currentFeedback.isCorrect && (
                  <div className="mt-3 p-3 bg-white/50 rounded-apple">
                    <p className="text-sm text-apple-text-secondary">
                      <span className="font-medium">Correct answer: </span>
                      {currentFeedback.correctWords.join(" ")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion error message */}
      {completionError && (
        <Card variant="outlined" className="mb-6 border-l-4 border-l-red-500 bg-red-50/30">
          <CardContent className="p-4">
            <p className="text-red-700 text-sm">{completionError}</p>
          </CardContent>
        </Card>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          disabled={!hasAnswer || isSubmitted}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>

        <div className="flex items-center gap-3">
          {!isSubmitted ? (
            <Button
              onClick={handleSubmitQuestion}
              disabled={!hasAnswer}
            >
              Check Answer
            </Button>
          ) : (
            <Button onClick={handleNext}>
              {progress.current >= progress.total ? (
                <>
                  {retryMode ? "Finish Retry" : "Submit Set"}
                  <Send className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  Next Question
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Container>
  );
}
