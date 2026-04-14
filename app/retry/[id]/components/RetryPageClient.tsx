"use client";

import { useSearchParams } from "next/navigation";
import { RetryClient } from "./RetryClient";
import { PracticeSet, Question } from "@/lib/types";

interface RetryPageClientProps {
  practiceSet: PracticeSet;
  questions: Question[];
}

export function RetryPageClient({ practiceSet, questions }: RetryPageClientProps) {
  const searchParams = useSearchParams();
  
  // Parse source record ID from search params
  const sourceRecordId = searchParams.get("source") || undefined;

  return (
    <RetryClient 
      practiceSet={practiceSet} 
      questions={questions}
      sourceRecordId={sourceRecordId}
    />
  );
}
