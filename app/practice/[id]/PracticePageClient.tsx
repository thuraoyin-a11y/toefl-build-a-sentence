"use client";

import { useSearchParams } from "next/navigation";
import { PracticeClient } from "./components/PracticeClient";
import { PracticeSet, Question } from "@/lib/types";

interface PracticePageClientProps {
  practiceSet: PracticeSet;
  questions: Question[];
}

export function PracticePageClient({ practiceSet, questions }: PracticePageClientProps) {
  const searchParams = useSearchParams();
  
  // Parse mode, source, and assignment from search params
  const mode = (searchParams.get("mode") as string) || "normal";
  const sourceAttemptId = searchParams.get("source") || undefined;
  const assignmentId = searchParams.get("assignment") || undefined;

  return (
    <PracticeClient 
      practiceSet={practiceSet} 
      questions={questions}
      mode={mode as "normal" | "retry_mistakes"}
      sourceAttemptId={sourceAttemptId}
      assignmentId={assignmentId}
    />
  );
}
