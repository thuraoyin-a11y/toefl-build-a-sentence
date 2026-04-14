"use client";

import { useSearchParams } from "next/navigation";
import { ResultClient } from "./components/ResultClient";
import { PracticeSet, PracticeSetRecord, Question } from "@/lib/types";
import { useEffect, useState } from "react";

interface ResultPageClientProps {
  practiceSet: PracticeSet;
  questions: Question[];
}

interface ApiAttemptResponse {
  attempt: {
    id: string;
    practiceSetId: string;
    attemptType: "full_attempt" | "retry_attempt";
    score: number;
    correctCount: number;
    totalQuestions: number;
    answers: Record<string, { selectedWords: string[]; isCorrect: boolean; timeSpent?: number }>;
    completedAt: string;
  };
}

/**
 * ResultPageClient
 * V2 Architecture: Fetches attempt data from API only (no localStorage fallback)
 */
export function ResultPageClient({ practiceSet, questions }: ResultPageClientProps) {
  const searchParams = useSearchParams();
  const [loadedRecord, setLoadedRecord] = useState<PracticeSetRecord | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Parse mode and source from search params
  const mode = (searchParams.get("mode") as string) || "normal";
  const sourceAttemptId = searchParams.get("source") || undefined;

  // Load attempt data from API
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const attemptId = sourceAttemptId || practiceSet.id;
    const queryParam = sourceAttemptId ? `id=${sourceAttemptId}` : `practiceSetId=${practiceSet.id}`;
    
    // Fetch attempt from database (source of truth)
    fetch(`/api/student/attempts?${queryParam}`)
      .then(res => {
        if (!res.ok) {
          if (res.status === 404) {
            // No attempt found - this is okay, show "no results" state
            return null;
          }
          throw new Error(`Failed to fetch attempt: ${res.status}`);
        }
        return res.json() as Promise<ApiAttemptResponse>;
      })
      .then(data => {
        if (data?.attempt) {
          // Convert API response to PracticeSetRecord format
          const apiRecord: PracticeSetRecord = {
            id: data.attempt.id,
            setId: data.attempt.practiceSetId,
            studentId: "", // Not needed for display
            answers: Object.entries(data.attempt.answers).map(([questionId, answer]) => ({
              questionId,
              selectedWords: answer.selectedWords,
              isCorrect: answer.isCorrect,
              score: answer.isCorrect ? 100 : 0, // Simplified score
            })),
            completedAt: new Date(data.attempt.completedAt),
            totalScore: data.attempt.correctCount,
            percentage: data.attempt.score,
            attemptType: data.attempt.attemptType,
          };
          setLoadedRecord(apiRecord);
        }
      })
      .catch(err => {
        console.error("Error fetching attempt from API:", err);
        setError("Failed to load results. Please try again.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [sourceAttemptId, practiceSet.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-apple-text-secondary">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-apple-blue hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <ResultClient 
      practiceSet={practiceSet} 
      questions={questions}
      record={loadedRecord}
      mode={mode as "normal" | "retry"}
    />
  );
}
