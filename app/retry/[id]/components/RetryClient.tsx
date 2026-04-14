"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SentenceBuilder } from "@/components/practice/SentenceBuilder";
import { WordBank } from "@/components/practice/WordBank";
import { PracticeSet, Question, Answer } from "@/lib/types";
import { ArrowLeft, ArrowRight, RotateCcw, Send, CheckCircle2, RefreshCw, Trophy, Home } from "lucide-react";
import Link from "next/link";

interface RetryClientProps {
  practiceSet: PracticeSet;
  questions: Question[];
  sourceRecordId?: string;
}

interface ApiAttempt {
  id: string;
  practiceSetId: string;
  attemptType: string;
  answers: Record<string, {
    selectedWords: string[];
    isCorrect: boolean;
    timeSpent: number;
  }>;
  correctCount: number;
  totalQuestions: number;
  score: number;
  completedAt: string;
}

// Generate feedback for an answer
function generateFeedback(selectedWords: string[], correctWords: string[]) {
  const isCorrect = 
    selectedWords.length === correctWords.length &&
    selectedWords.every((word, index) => 
      word.toLowerCase() === correctWords[index].toLowerCase()
    );

  let matchCount = 0;
  for (let i = 0; i < Math.min(selectedWords.length, correctWords.length); i++) {
    if (selectedWords[i].toLowerCase() === correctWords[i].toLowerCase()) {
      matchCount++;
    }
  }

  const score = Math.min(100, Math.round((matchCount / correctWords.length) * 100));

  return {
    isCorrect,
    score,
    message: isCorrect ? "Correct! Well done." : "Not quite correct. Check the word order.",
    correctWords,
  };
}

/**
 * RetryClient
 * V2 Architecture: Fetches source attempt from API (no localStorage dependencies)
 */
export function RetryClient({ practiceSet, questions, sourceRecordId }: RetryClientProps) {
  const router = useRouter();
  
  // State
  const [retryQuestions, setRetryQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<ReturnType<typeof generateFeedback> | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceAttempt, setSourceAttempt] = useState<ApiAttempt | null>(null);
  const [retryResult, setRetryResult] = useState<{
    correctCount: number;
    totalQuestions: number;
    percentage: number;
  } | null>(null);

  // Initialize - load wrong questions from source attempt via API
  useEffect(() => {
    if (!sourceRecordId) {
      // No source record, redirect to normal practice
      router.replace(`/practice/${practiceSet.id}`);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Fetch source attempt from API
    fetch(`/api/student/attempts?id=${sourceRecordId}`)
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Source attempt not found");
          }
          throw new Error(`Failed to fetch source attempt: ${res.status}`);
        }
        return res.json();
      })
      .then((data: { attempt: ApiAttempt }) => {
        if (!data.attempt) {
          throw new Error("Source attempt not found");
        }

        setSourceAttempt(data.attempt);

        // Get wrong question IDs from the attempt
        const wrongQuestionIds = Object.entries(data.attempt.answers)
          .filter(([_, answer]) => !answer.isCorrect)
          .map(([questionId, _]) => questionId);

        if (wrongQuestionIds.length === 0) {
          // No wrong answers, redirect to result
          router.replace(`/result/${practiceSet.id}`);
          return;
        }

        // Load questions from the provided questions prop
        const wrongQuestions = questions.filter(q => wrongQuestionIds.includes(q.id));
        
        setRetryQuestions(wrongQuestions);
        setIsLoading(false);
      })
      .catch((err: Error) => {
        console.error("Error loading source attempt:", err);
        setError(err.message);
        setIsLoading(false);
      });
  }, [practiceSet.id, sourceRecordId, router, questions]);

  const currentQuestion = retryQuestions[currentIndex];
  const totalQuestions = retryQuestions.length;
  const progress = {
    current: currentIndex + 1,
    total: totalQuestions,
    completed: answers.length,
  };

  // Handle word selection
  const handleAddWord = (word: string) => {
    if (feedback) return; // Prevent changes after submission
    setSelectedWords(prev => [...prev, word]);
  };

  const handleRemoveWord = (index: number) => {
    if (feedback) return;
    setSelectedWords(prev => prev.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    if (feedback) return;
    setSelectedWords([]);
  };

  // Handle submit answer
  const handleSubmit = () => {
    if (!currentQuestion || selectedWords.length === 0) return;

    const fb = generateFeedback(selectedWords, currentQuestion.correctAnswer);
    setFeedback(fb);

    // Save answer
    const answer: Answer = {
      questionId: currentQuestion.id,
      selectedWords: [...selectedWords],
      isCorrect: fb.isCorrect,
      score: fb.score,
    };
    setAnswers(prev => [...prev, answer]);
  };

  // Handle next question or complete
  const handleNext = () => {
    if (currentIndex >= totalQuestions - 1) {
      // Complete retry
      setIsCompleted(true);
      
      const correctCount = answers.filter(a => a.isCorrect).length;
      const percentage = Math.round((correctCount / totalQuestions) * 100);
      
      setRetryResult({
        correctCount,
        totalQuestions,
        percentage,
      });
      
      // Save to database via API
      const wrongAnswers = answers.filter(a => !a.isCorrect);
      
      if (sourceAttempt) {
        const apiPayload = {
          practiceSetId: sourceAttempt.practiceSetId,
          attemptType: "retry_attempt",
          correctCount,
          totalQuestions: answers.length,
          answers: Object.fromEntries(
            answers.map(a => [a.questionId, {
              selectedWords: a.selectedWords,
              isCorrect: a.isCorrect,
              timeSpent: 0,
            }])
          ),
          wrongItemIds: wrongAnswers.map(a => a.questionId),
          assignmentId: null,
          sourceAttemptId: sourceAttempt.id,
        };
        
        // Save to database and handle response
        fetch("/api/student/attempts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiPayload),
        })
          .then(async (res) => {
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
              console.error("Failed to save retry attempt to database:", errorData);
            } else {
              const data = await res.json();
              console.log("Retry attempt saved successfully:", data.attempt?.id);
            }
          })
          .catch((err: Error) => {
            console.error("Failed to save retry attempt to database:", err);
          });
      } else {
        console.error("Source attempt not available for retry save");
      }
    } else {
      // Next question
      setCurrentIndex(prev => prev + 1);
      setSelectedWords([]);
      setFeedback(null);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Container size="md">
        <div className="text-center py-16">
          <p className="text-apple-text-secondary">Loading retry questions...</p>
        </div>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container size="md">
        <div className="text-center py-16">
          <p className="text-red-500 mb-4">{error}</p>
          <Link href="/">
            <Button variant="secondary">
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </Container>
    );
  }

  // If no questions loaded yet
  if (retryQuestions.length === 0) {
    return (
      <Container size="md">
        <div className="text-center py-16">
          <p className="text-apple-text-secondary">Loading retry questions...</p>
        </div>
      </Container>
    );
  }

  // If completed, show results
  if (isCompleted && retryResult) {
    const { correctCount, totalQuestions, percentage } = retryResult;
    const allCorrect = correctCount === totalQuestions;

    return (
      <Container size="md">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-apple-text">
              <span className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-blue-500" />
                Retry Complete
              </span>
            </h1>
            <p className="text-sm text-apple-text-secondary">{practiceSet.title}</p>
          </div>
        </div>

        {/* Score Card */}
        <Card className={`mb-6 ${allCorrect ? "bg-gradient-to-br from-green-50 to-white" : "bg-gradient-to-br from-blue-50 to-white"}`}>
          <CardContent className="p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className={`h-24 w-24 rounded-full flex items-center justify-center shadow-apple ${allCorrect ? "bg-green-500 text-white" : "bg-blue-500 text-white"}`}>
                <div className="text-center">
                  <span className="text-3xl font-bold">{correctCount}</span>
                  <span className="text-lg opacity-80">/{totalQuestions}</span>
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className={`text-2xl font-semibold ${allCorrect ? "text-green-600" : "text-blue-600"}`}>
                  {percentage}%
                </h2>
                <p className="text-apple-text font-medium">
                  {allCorrect 
                    ? "Perfect! All mistakes corrected!" 
                    : `Good progress! ${correctCount} out of ${totalQuestions} corrected.`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Link href={`/result/${practiceSet.id}`} className="flex-1">
            <Button variant="secondary" className="w-full">
              <Trophy className="h-4 w-4 mr-2" />
              View Full Results
            </Button>
          </Link>
          <Link href="/" className="flex-1">
            <Button className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </Container>
    );
  }

  const hasAnswer = selectedWords.length > 0;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  return (
    <Container size="md">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/result/${practiceSet.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-apple-text">
            <span className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-orange-500" />
              Retry Mistakes
            </span>
          </h1>
          <p className="text-sm text-apple-text-secondary">
            Question {progress.current} of {progress.total}
          </p>
        </div>
        <div className="text-sm font-medium text-orange-500">
          {progress.completed} / {progress.total} answered
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="h-2 bg-apple-gray rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500 rounded-full transition-all duration-300"
            style={{ width: `${(progress.current / progress.total) * 100}%` }}
          />
        </div>
      </div>

      {/* Retry info card */}
      <Card variant="outlined" className="mb-6 bg-orange-50/30 border-orange-200">
        <CardContent className="p-4">
          <p className="text-sm text-orange-700">
            <span className="font-medium">Retry Mode:</span> You are practicing {totalQuestions} question{totalQuestions > 1 ? 's' : ''} you got wrong. 
            Correct answers will update your overall result.
          </p>
        </CardContent>
      </Card>

      {/* Question card */}
      <Card variant="outlined" className="mb-6 bg-blue-50/30 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm font-medium text-blue-800 mb-2">Context:</p>
          <p className="text-apple-text whitespace-pre-line leading-relaxed">
            {currentQuestion.context}
          </p>
        </CardContent>
      </Card>

      {/* Answer card */}
      <Card variant="elevated" className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Build your response:</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <SentenceBuilder
            context="Your reply: _______."
            selectedWords={selectedWords}
            onRemoveWord={handleRemoveWord}
          />

          <div className="h-px bg-apple-border/50" />

          <WordBank
            words={currentQuestion.wordBank}
            usedWords={selectedWords}
            onSelectWord={handleAddWord}
          />
        </CardContent>
      </Card>

      {/* Feedback */}
      {feedback && (
        <Card 
          variant="outlined" 
          className={`mb-6 ${feedback.isCorrect ? "border-l-4 border-l-green-500 bg-green-50/30" : "border-l-4 border-l-amber-400 bg-amber-50/30"}`}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {feedback.isCorrect ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              ) : (
                <div className="h-5 w-5 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
              )}
              <div>
                <p className={`font-medium ${feedback.isCorrect ? "text-green-700" : "text-amber-700"}`}>
                  {feedback.isCorrect ? "Correct!" : "Not quite correct"}
                </p>
                <p className="text-sm text-apple-text-secondary mt-1">
                  {feedback.message}
                </p>
                {!feedback.isCorrect && (
                  <div className="mt-3 p-3 bg-white/50 rounded-apple">
                    <p className="text-sm text-apple-text-secondary">
                      <span className="font-medium">Correct answer: </span>
                      {feedback.correctWords.join(" ")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          disabled={!hasAnswer || !!feedback}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>

        <div className="flex items-center gap-3">
          {!feedback ? (
            <Button
              onClick={handleSubmit}
              disabled={!hasAnswer}
            >
              Check Answer
            </Button>
          ) : (
            <Button onClick={handleNext} className="bg-orange-500 hover:bg-orange-600">
              {isLastQuestion ? (
                <>
                  Complete Retry
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
