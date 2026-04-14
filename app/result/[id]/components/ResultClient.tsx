"use client";

import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PracticeSet, PracticeSetRecord, Question } from "@/lib/types";
import { usePracticeStore } from "@/store/practiceStore";
import { useEffect, useState } from "react";
import { ArrowLeft, RotateCcw, ChevronRight, Trophy, Target, CheckCircle2, XCircle, RefreshCw, Home } from "lucide-react";

interface ResultClientProps {
  practiceSet: PracticeSet;
  questions: Question[];
  record: PracticeSetRecord | undefined;
  mode?: "normal" | "retry";
}

/**
 * ResultClient
 * V2 Architecture: Displays result data from API (no localStorage/mock dependencies)
 */
export function ResultClient({ practiceSet, questions, record: serverRecord, mode = "normal" }: ResultClientProps) {
  const [loadedRecord, setLoadedRecord] = useState<PracticeSetRecord | undefined>(serverRecord);
  const isRetryMode = mode === "retry";
  
  // Try to get record from store if just submitted (for immediate display before API response)
  const storeRecord = usePracticeStore((state) => {
    const session = state.session;
    // Only use store record if we just submitted (session has answers but no record yet)
    if (!loadedRecord && !serverRecord && session.setId === practiceSet.id && session.answers.length > 0) {
      const isRetry = session.mode === "retry_mistakes";
      const totalQuestions = session.answers.length;
      const correctCount = session.answers.filter(a => a.isCorrect).length;
      const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
      
      return {
        id: isRetry ? `retry-temp-${Date.now()}` : `temp-${Date.now()}`,
        setId: practiceSet.id,
        studentId: "current-user",
        answers: session.answers,
        completedAt: new Date(),
        totalScore: correctCount,
        percentage: percentage,
        attemptType: isRetry ? "retry_attempt" as const : "full_attempt" as const,
        sourceAttemptId: session.sourceAttemptId,
      } as PracticeSetRecord;
    }
    return null;
  });

  // Priority: server record > loaded record > store record
  const record = serverRecord || loadedRecord || storeRecord;

  // Check if this record has wrong answers (for retry button visibility)
  const hasWrong = record && !isRetryMode ? record.answers.some(a => !a.isCorrect) : false;

  // If no record found, show message to complete the set first
  if (!record) {
    return (
      <Container size="md">
        <div className="text-center py-16">
          <div className="h-16 w-16 rounded-full bg-apple-gray mx-auto mb-4 flex items-center justify-center">
            <Target className="h-8 w-8 text-apple-text-secondary" />
          </div>
          <h1 className="text-2xl font-semibold text-apple-text mb-2">
            No results yet
          </h1>
          <p className="text-apple-text-secondary mb-6 max-w-sm mx-auto">
            {isRetryMode 
              ? "Complete the retry practice to see your results."
              : "Complete this practice set to see your results."
            }
          </p>
          <Link href={`/practice/${practiceSet.id}`}>
            <Button>
              {isRetryMode ? "Start Retry" : "Start Practice Set"}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </Container>
    );
  }

  // Calculate performance metrics
  const correctCount = record.totalScore;
  const totalQuestions = record.answers.length;
  const percentage = record.percentage;
  const isExcellent = percentage >= 80;
  const isPass = percentage >= 60;
  const allCorrect = correctCount === totalQuestions;

  // Get feedback message based on performance
  const getFeedbackMessage = () => {
    if (allCorrect) return isRetryMode ? "Perfect retry! All mistakes corrected!" : "Perfect! Outstanding work!";
    if (percentage >= 80) return isRetryMode ? "Great improvement! Most mistakes corrected!" : "Great job! You've mastered these sentences.";
    if (percentage >= 60) return isRetryMode ? "Good progress! Keep practicing the remaining mistakes." : "Good work! Keep practicing to improve further.";
    if (percentage >= 40) return isRetryMode ? "Some improvement. Review the remaining errors carefully." : "Getting there! Review the grammar points and try again.";
    return isRetryMode ? "Keep working on these questions. Review the correct answers." : "Keep practicing! Focus on understanding sentence structures.";
  };

  // Find common issues
  const getCommonIssues = () => {
    const wrongAnswers = record.answers.filter(a => !a.isCorrect);
    if (wrongAnswers.length === 0) return null;
    
    const emptyAnswers = wrongAnswers.filter(a => a.selectedWords.length === 0).length;
    if (emptyAnswers > 0) {
      return `You skipped ${emptyAnswers} question${emptyAnswers > 1 ? 's' : ''}. Make sure to answer every question.`;
    }
    
    if (wrongAnswers.length > totalQuestions / 2) {
      return "Many answers had incorrect word order. Focus on the context and think about natural sentence flow.";
    }
    
    return "Some answers had minor errors. Check the word order carefully in the review below.";
  };

  return (
    <Container size="md">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Home
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-apple-text">
            {isRetryMode ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-blue-500" />
                Retry Results
              </span>
            ) : (
              "Practice Results"
            )}
          </h1>
          <p className="text-sm text-apple-text-secondary">{practiceSet.title}</p>
        </div>
      </div>

      {/* Overall Score Card */}
      <Card 
        variant="elevated" 
        className={`mb-6 ${isExcellent ? "bg-gradient-to-br from-green-50 to-white" : isPass ? "bg-gradient-to-br from-blue-50 to-white" : "bg-gradient-to-br from-amber-50 to-white"}`}
      >
        <CardContent className="p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Score circle */}
            <div className={`h-24 w-24 rounded-full flex items-center justify-center shadow-apple ${isExcellent ? "bg-apple-success text-white" : isPass ? "bg-apple-blue text-white" : "bg-apple-warning text-white"}`}>
              <div className="text-center">
                <span className="text-3xl font-bold">{correctCount}</span>
                <span className="text-lg opacity-80">/{totalQuestions}</span>
              </div>
            </div>
            
            {/* Score details */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                {isExcellent && <Trophy className="h-5 w-5 text-apple-success" />}
                <h2 className={`text-2xl font-semibold ${isExcellent ? "text-apple-success" : isPass ? "text-apple-blue" : "text-apple-warning"}`}>
                  {percentage}%
                </h2>
              </div>
              <p className="text-apple-text font-medium mb-1">
                {getFeedbackMessage()}
              </p>
              <p className="text-sm text-apple-text-secondary">
                {isRetryMode ? "Retry completed" : "Completed"} on {new Date(record.completedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Common issues summary */}
      {(() => {
        const issues = getCommonIssues();
        return issues ? (
          <Card variant="outlined" className="mb-6 bg-amber-50/20 border-amber-200">
            <CardHeader>
              <CardTitle className="text-base">Areas to Improve</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-apple-text-secondary">{issues}</p>
            </CardContent>
          </Card>
        ) : (
          <Card variant="outlined" className="mb-6 bg-green-50/20 border-green-200">
            <CardHeader>
              <CardTitle className="text-base">
                {isRetryMode ? "Mistakes Corrected!" : "Great Performance!"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-apple-text-secondary">
                {isRetryMode 
                  ? "You corrected all the mistakes from your previous attempt. Great improvement!"
                  : "You got all questions correct. Keep up the excellent work!"
                }
              </p>
            </CardContent>
          </Card>
        );
      })()}

      {/* Retry Mistakes Button - Only show if there are wrong answers and not already in retry mode */}
      {hasWrong && !isRetryMode && (
        <Card variant="outlined" className="mb-6 bg-blue-50/30 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-apple-text mb-1">
                  Practice Your Mistakes
                </h3>
                <p className="text-sm text-apple-text-secondary">
                  You got {totalQuestions - correctCount} question{totalQuestions - correctCount > 1 ? 's' : ''} wrong. 
                  Practice just those questions to improve.
                </p>
              </div>
              <Link href={`/retry/${practiceSet.id}?source=${record.id}`}>
                <Button variant="secondary" className="flex-shrink-0 bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Mistakes
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question breakdown */}
      <Card variant="outlined" className="mb-8">
        <CardHeader>
          <CardTitle className="text-base">
            {isRetryMode ? "Retry Question Review" : "Question Review"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {record.answers.map((answer, index) => {
              const question = questions.find(q => q.id === answer.questionId);
              if (!question) return null;

              const isCorrect = answer.isCorrect;
              const hasAnswer = answer.selectedWords.length > 0;

              return (
                <div 
                  key={answer.questionId}
                  className={`p-4 rounded-apple-lg border ${isCorrect ? "bg-green-50/30 border-green-200" : "bg-red-50/30 border-red-200"}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex-shrink-0 ${isCorrect ? "text-apple-success" : "text-red-500"}`}>
                      {isCorrect ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <XCircle className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-apple-text">
                          Question {index + 1}
                        </span>
                        <Badge variant={isCorrect ? "success" : "neutral"} size="sm">
                          {answer.score}%
                        </Badge>
                      </div>
                      
                      {/* Context */}
                      <div className="text-sm text-apple-text-secondary mb-3 p-2 bg-white/50 rounded-apple">
                        <p className="whitespace-pre-line">{question.context}</p>
                      </div>
                      
                      {/* Answers comparison */}
                      <div className="space-y-2 text-sm">
                        {hasAnswer ? (
                          <p className="text-apple-text">
                            <span className="text-apple-text-secondary">Your answer: </span>
                            <span className={isCorrect ? "text-green-700" : "text-red-600"}>
                              {answer.selectedWords.join(" ") || "(empty)"}
                            </span>
                          </p>
                        ) : (
                          <p className="text-apple-text-secondary italic">No answer submitted</p>
                        )}
                        {!isCorrect && (
                          <p className="text-green-700">
                            <span className="font-medium">Correct answer: </span>
                            {question.correctAnswer.join(" ")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary stats */}
      <div className={`grid gap-4 mb-8 ${isRetryMode ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
        <Card variant="outlined" className="text-center p-4">
          <div className="text-2xl font-bold text-apple-success">{correctCount}</div>
          <div className="text-xs text-apple-text-secondary uppercase tracking-wide">Correct</div>
        </Card>
        <Card variant="outlined" className="text-center p-4">
          <div className="text-2xl font-bold text-red-500">{totalQuestions - correctCount}</div>
          <div className="text-xs text-apple-text-secondary uppercase tracking-wide">Incorrect</div>
        </Card>
        {!isRetryMode && (
          <>
            <Card variant="outlined" className="text-center p-4">
              <div className="text-2xl font-bold text-apple-blue">{percentage}%</div>
              <div className="text-xs text-apple-text-secondary uppercase tracking-wide">Accuracy</div>
            </Card>
            <Card variant="outlined" className="text-center p-4">
              <div className="text-2xl font-bold text-apple-text">{record.answers.filter(a => a.selectedWords.length > 0).length}</div>
              <div className="text-xs text-apple-text-secondary uppercase tracking-wide">Attempted</div>
            </Card>
          </>
        )}
        {isRetryMode && (
          <Card variant="outlined" className="text-center p-4 col-span-2">
            <div className="text-2xl font-bold text-apple-blue">{percentage}%</div>
            <div className="text-xs text-apple-text-secondary uppercase tracking-wide">Accuracy</div>
          </Card>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        {isRetryMode ? (
          <Link href={`/result/${practiceSet.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Full Results
            </Button>
          </Link>
        ) : (
          <Link href={`/practice/${practiceSet.id}`}>
            <Button variant="ghost" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </Link>
        )}

        <div className="flex items-center gap-3">
          {isRetryMode && allCorrect && (
            <Link href={`/practice/${practiceSet.id}`}>
              <Button variant="secondary">
                <RotateCcw className="h-4 w-4 mr-2" />
                Practice Full Set
              </Button>
            </Link>
          )}
          <Link href="/">
            <Button>
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </Container>
  );
}
