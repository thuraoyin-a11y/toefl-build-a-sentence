"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Question } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { X, Loader2 } from "lucide-react";

interface SetResultDetailProps {
  isOpen: boolean;
  onClose: () => void;
  setTitle: string;
  setId: string;
}

interface Attempt {
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
  sourceAttemptId: string | null;
}

interface AttemptAnswer {
  questionId: string;
  selectedWords: string[];
  isCorrect: boolean;
}

/**
 * SetResultDetail
 * V2 Architecture: Fetches attempts and questions from API
 */
export function SetResultDetail({
  isOpen,
  onClose,
  setTitle,
  setId,
}: SetResultDetailProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !setId) return;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch attempts for this set
        const attemptsRes = await fetch(`/api/teacher/attempts?practiceSetId=${setId}`);
        if (attemptsRes.ok) {
          const data = await attemptsRes.json();
          setAttempts(data.attempts || []);
        }

        // Fetch questions for this set
        const setRes = await fetch(`/api/practice-sets/${setId}`);
        if (setRes.ok) {
          const data = await setRes.json();
          setQuestions(data.questions || []);
        }
      } catch (err) {
        console.error("Failed to load result details:", err);
        setError("Failed to load details");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isOpen, setId]);

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-apple-blue/30 backdrop-blur-sm">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-apple-blue mb-4" />
          <p className="text-apple-text-secondary">Loading result details...</p>
        </div>
      </div>
    );
  }

  if (error || attempts.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-apple-blue/30 backdrop-blur-sm">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Result Details</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <p className="text-gray-500 text-center py-8">
            {error || "No attempts found for this set"}
          </p>
        </div>
      </div>
    );
  }

  // Find initial attempt (full_attempt or the earliest attempt without source)
  const initialAttempt = attempts.find(a => a.attemptType === "full_attempt") || 
                         attempts.find(a => !a.sourceAttemptId) ||
                         attempts[0];

  // Find latest retry (retry_attempt with this set as source, or the most recent retry)
  const latestRetry = attempts
    .filter(a => a.attemptType === "retry_attempt" && a.sourceAttemptId === initialAttempt?.id)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0];

  // Convert attempt answers to array format
  const getAnswersArray = (attempt: Attempt): AttemptAnswer[] => {
    return Object.entries(attempt.answers).map(([questionId, answer]) => ({
      questionId,
      selectedWords: answer.selectedWords,
      isCorrect: answer.isCorrect,
    }));
  };

  const initialAnswers = getAnswersArray(initialAttempt);
  const retryAnswers = latestRetry ? getAnswersArray(latestRetry) : [];

  // Get last activity time
  const lastActivity = latestRetry 
    ? new Date(Math.max(
        new Date(initialAttempt.completedAt).getTime(),
        new Date(latestRetry.completedAt).getTime()
      ))
    : new Date(initialAttempt.completedAt);

  // Calculate current status (use retry score if available)
  const currentScore = latestRetry ? latestRetry.correctCount : initialAttempt.correctCount;
  const currentPercentage = latestRetry ? latestRetry.score : initialAttempt.score;
  const stillWrongCount = 10 - currentScore;

  // Calculate initial attempt stats
  const initialWrongCount = initialAnswers.filter(a => !a.isCorrect).length;

  // Calculate retry stats
  const retryStats = latestRetry ? {
    totalQuestions: retryAnswers.length,
    correctOnRetry: retryAnswers.filter(a => a.isCorrect).length,
    fixedCount: (() => {
      const initialWrongMap = new Map(
        initialAnswers
          .filter(a => !a.isCorrect)
          .map(a => [a.questionId, a])
      );
      return retryAnswers.filter(
        retryAnswer => retryAnswer.isCorrect && initialWrongMap.has(retryAnswer.questionId)
      ).length;
    })(),
  } : null;

  // Get up to 3 representative questions (prioritize wrong answers from initial)
  const representativeQuestions = initialAnswers
    .filter(a => !a.isCorrect)
    .slice(0, 3)
    .map(answer => {
      const question = questions.find(q => q.id === answer.questionId);
      const retryAnswer = retryAnswers.find(a => a.questionId === answer.questionId);
      
      let status: "corrected" | "still incorrect" | "no retry" | "correct";
      if (answer.isCorrect) {
        status = "correct";
      } else if (!retryAnswer) {
        status = "no retry";
      } else if (retryAnswer.isCorrect) {
        status = "corrected";
      } else {
        status = "still incorrect";
      }

      return {
        question,
        initialAnswer: answer,
        retryAnswer,
        status,
      };
    })
    .filter(item => item.question);

  // Get status label color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "corrected":
        return "text-green-600 bg-green-50";
      case "still incorrect":
        return "text-red-600 bg-red-50";
      case "no retry":
        return "text-gray-500 bg-gray-100";
      case "correct":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-500 bg-gray-100";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-apple-blue/30 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Result Details</h2>
            <p className="text-sm text-gray-500">{setTitle}</p>
            <p className="text-xs text-gray-400 mt-1">
              Last activity: {formatDate(lastActivity.toISOString())}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Section 1: Initial Attempt */}
          <section>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              Initial Attempt
            </h3>
            <Card className="p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    Completed {formatDate(initialAttempt.completedAt)}
                  </p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {initialAttempt.correctCount}/{initialAttempt.totalQuestions} correct ({initialAttempt.score}%)
                  </p>
                </div>
                <Badge variant="neutral" className="text-sm">
                  {initialWrongCount} incorrect
                </Badge>
              </div>
            </Card>
          </section>

          {/* Section 2: Latest Retry */}
          <section>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              Latest Retry
            </h3>
            {latestRetry && retryStats ? (
              <Card className="p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">
                    Completed {formatDate(latestRetry.completedAt)}
                  </p>
                  <Badge variant="primary" className="text-sm">
                    {retryStats.fixedCount} fixed
                  </Badge>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {retryStats.correctOnRetry}/{retryStats.totalQuestions} correct on retry ({latestRetry.score}%)
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Retried {retryStats.totalQuestions} questions from initial attempt
                </p>
              </Card>
            ) : (
              <Card className="p-4 border border-gray-200 bg-gray-50/50">
                <p className="text-gray-500 text-center py-2">No retry yet</p>
                <p className="text-sm text-gray-400 text-center">
                  Student has not practiced their mistakes
                </p>
              </Card>
            )}
          </section>

          {/* Section 3: Current Status */}
          <section>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              Current Status
            </h3>
            <Card className="p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {currentScore}/10 correct ({currentPercentage}%)
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {stillWrongCount > 0 
                      ? `${stillWrongCount} question${stillWrongCount > 1 ? 's' : ''} still need${stillWrongCount === 1 ? 's' : ''} practice`
                      : "All questions mastered"
                    }
                  </p>
                </div>
                {latestRetry && latestRetry.correctCount > initialAttempt.correctCount && (
                  <Badge variant="success" className="text-sm">
                    +{latestRetry.correctCount - initialAttempt.correctCount} improved
                  </Badge>
                )}
              </div>
            </Card>
          </section>

          {/* Section 4: Representative Items */}
          {representativeQuestions.length > 0 && (
            <section>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                Representative Items
              </h3>
              <div className="space-y-4">
                {representativeQuestions.map(({ question, initialAnswer, retryAnswer, status }, index) => (
                  <Card key={question!.id} className="p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-sm font-medium text-gray-500">
                        Item {index + 1}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(status)}`}>
                        {status}
                      </span>
                    </div>

                    {/* Context */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-1">Context:</p>
                      <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                        {question!.context}
                      </p>
                    </div>

                    {/* Correct Answer */}
                    <div className="mb-3">
                      <p className="text-sm text-gray-500 mb-1">Correct answer:</p>
                      <p className="text-sm font-medium text-green-700">
                        {question!.correctAnswer.join(" ")}
                      </p>
                    </div>

                    {/* Initial Answer */}
                    <div className="mb-3">
                      <p className="text-sm text-gray-500 mb-1">Initial attempt:</p>
                      <p className={`text-sm ${initialAnswer.isCorrect ? 'text-green-700' : 'text-red-600'}`}>
                        {initialAnswer.selectedWords.length > 0 
                          ? initialAnswer.selectedWords.join(" ")
                          : "(no answer)"
                        }
                      </p>
                    </div>

                    {/* Retry Answer */}
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Latest retry:</p>
                      {retryAnswer ? (
                        <p className={`text-sm ${retryAnswer.isCorrect ? 'text-green-700' : 'text-red-600'}`}>
                          {retryAnswer.selectedWords.join(" ")}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400">—</p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
