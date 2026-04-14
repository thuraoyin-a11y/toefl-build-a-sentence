import { PracticeSetRecord, Answer } from "@/lib/types";

/**
 * LocalStorage key for completed sets
 */
const COMPLETED_SETS_KEY = "completed-sets";

/**
 * In-memory store for practice set records
 */
export const mockSetRecords: PracticeSetRecord[] = [];

/**
 * Check if we're in browser environment
 */
function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * Load completed sets from localStorage
 * Should be called once when the app initializes
 */
export function loadCompletedSets(): void {
  if (!isBrowser()) return;
  
  const stored = localStorage.getItem(COMPLETED_SETS_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Convert string dates back to Date objects
      const records: PracticeSetRecord[] = parsed.map((r: PracticeSetRecord) => ({
        ...r,
        completedAt: new Date(r.completedAt),
      }));
      
      // Clear and repopulate mockSetRecords
      mockSetRecords.length = 0;
      mockSetRecords.push(...records);
    } catch {
      // Invalid stored data, ignore
    }
  }
}

/**
 * Save completed sets to localStorage
 */
function saveToStorage(): void {
  if (!isBrowser()) return;
  
  // Only store minimal data needed for completion tracking
  const minimalRecords = mockSetRecords.map((r) => ({
    id: r.id,
    setId: r.setId,
    studentId: r.studentId,
    completedAt: r.completedAt.toISOString(),
    totalScore: r.totalScore,
    percentage: r.percentage,
    attemptType: r.attemptType,
    sourceAttemptId: r.sourceAttemptId,
    // Keep answers for result display
    answers: r.answers,
  }));
  
  localStorage.setItem(COMPLETED_SETS_KEY, JSON.stringify(minimalRecords));
}

/**
 * Get record by record ID
 */
export function getRecordById(recordId: string): PracticeSetRecord | undefined {
  return mockSetRecords.find((r) => r.id === recordId);
}

/**
 * Get record by practice set ID
 * Returns the most recent record for the set
 */
export function getRecordBySetId(setId: string): PracticeSetRecord | undefined {
  const records = mockSetRecords.filter((r) => r.setId === setId);
  if (records.length === 0) return undefined;
  
  // Sort by completedAt descending and return the first
  return records.sort((a, b) => 
    new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  )[0];
}

/**
 * Get the most recent full attempt for a set
 */
export function getLastFullAttempt(setId: string): PracticeSetRecord | undefined {
  const records = mockSetRecords.filter(
    (r) => r.setId === setId && r.attemptType === "full_attempt"
  );
  if (records.length === 0) return undefined;
  
  return records.sort((a, b) => 
    new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  )[0];
}

/**
 * Get the most recent retry attempt for a set (optionally for a specific source)
 */
export function getLastRetryAttempt(
  setId: string, 
  sourceAttemptId?: string
): PracticeSetRecord | undefined {
  let records = mockSetRecords.filter(
    (r) => r.setId === setId && r.attemptType === "retry_attempt"
  );
  
  if (sourceAttemptId) {
    records = records.filter((r) => r.sourceAttemptId === sourceAttemptId);
  }
  
  if (records.length === 0) return undefined;
  
  return records.sort((a, b) => 
    new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  )[0];
}

/**
 * Get all completed set IDs (unique)
 * Only counts full_attempt (not retry_attempt)
 */
export function getCompletedSetIds(): string[] {
  const uniqueIds = new Set(
    mockSetRecords
      .filter((r) => r.attemptType === "full_attempt")
      .map((r) => r.setId)
  );
  return Array.from(uniqueIds);
}

/**
 * Get count of unique completed sets
 * Only counts full_attempt (not retry_attempt)
 */
export function getUniqueCompletedSetCount(): number {
  return new Set(
    mockSetRecords
      .filter((r) => r.attemptType === "full_attempt")
      .map((r) => r.setId)
  ).size;
}

/**
 * Check if a set has been completed by the student
 * Only counts full_attempt (not retry_attempt) for completion status
 */
export function isSetCompleted(setId: string): boolean {
  return mockSetRecords.some(
    (r) => r.setId === setId && r.attemptType === "full_attempt"
  );
}

/**
 * Check if a record has wrong answers (for retry button visibility)
 */
export function hasWrongAnswers(recordId: string): boolean {
  const record = getRecordById(recordId);
  if (!record) return false;
  return record.answers.some((a) => !a.isCorrect);
}

/**
 * Get wrong answers from a record
 */
export function getWrongAnswers(record: PracticeSetRecord): Answer[] {
  return record.answers.filter((a) => !a.isCorrect);
}

/**
 * Get wrong question IDs from a record
 */
export function getWrongQuestionIds(record: PracticeSetRecord): string[] {
  return record.answers
    .filter((a) => !a.isCorrect)
    .map((a) => a.questionId);
}

/**
 * Add a practice set record
 * Also persists to localStorage
 */
export function saveSetRecord(record: PracticeSetRecord): void {
  mockSetRecords.push(record);
  saveToStorage();
}

/**
 * Merge retry results with original record
 * Creates a merged view showing updated scores
 */
export function mergeRetryResult(
  sourceRecordId: string,
  retryAnswers: Answer[]
): { totalScore: number; percentage: number; improvedCount: number } | null {
  const sourceRecord = getRecordById(sourceRecordId);
  if (!sourceRecord) return null;

  // Create a map of retry answers by question ID
  const retryAnswerMap = new Map(retryAnswers.map(a => [a.questionId, a]));

  // Merge answers: use retry answer if available and correct, otherwise keep original
  let improvedCount = 0;
  const mergedAnswers = sourceRecord.answers.map(originalAnswer => {
    const retryAnswer = retryAnswerMap.get(originalAnswer.questionId);
    
    if (retryAnswer) {
      // This question was retried
      if (retryAnswer.isCorrect && !originalAnswer.isCorrect) {
        // Improved from wrong to correct
        improvedCount++;
        return retryAnswer;
      }
      // Otherwise keep original (even if retry was also wrong)
    }
    
    return originalAnswer;
  });

  // Calculate new score
  const correctCount = mergedAnswers.filter(a => a.isCorrect).length;
  const percentage = Math.round((correctCount / 10) * 100);

  return {
    totalScore: correctCount,
    percentage,
    improvedCount,
  };
}

/**
 * Save retry result and create/update merged record
 */
export function saveRetryResult(
  sourceRecordId: string,
  retryAnswers: Answer[]
): { totalScore: number; percentage: number; improvedCount: number } | null {
  const merged = mergeRetryResult(sourceRecordId, retryAnswers);
  if (!merged) return null;

  // Also save the retry as a separate record for history
  const sourceRecord = getRecordById(sourceRecordId);
  if (sourceRecord) {
    const retryRecord: PracticeSetRecord = {
      id: `retry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      setId: sourceRecord.setId,
      studentId: sourceRecord.studentId,
      answers: retryAnswers,
      completedAt: new Date(),
      totalScore: retryAnswers.filter(a => a.isCorrect).length,
      percentage: Math.round((retryAnswers.filter(a => a.isCorrect).length / retryAnswers.length) * 100) || 0,
      attemptType: "retry_attempt",
      sourceAttemptId: sourceRecordId,
    };
    
    mockSetRecords.push(retryRecord);
    saveToStorage();
  }

  return merged;
}

/**
 * Get the merged result for a set (combining original + retries)
 */
export function getMergedResultForSet(setId: string): { totalScore: number; percentage: number } | null {
  const fullAttempt = getLastFullAttempt(setId);
  if (!fullAttempt) return null;

  // Get all retries for this set
  const retries = mockSetRecords.filter(
    r => r.setId === setId && r.attemptType === "retry_attempt"
  );

  if (retries.length === 0) {
    // No retries, return original
    return {
      totalScore: fullAttempt.totalScore,
      percentage: fullAttempt.percentage,
    };
  }

  // Apply all retries (in chronological order)
  let mergedAnswers = [...fullAttempt.answers];
  
  retries
    .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
    .forEach(retry => {
      const retryMap = new Map(retry.answers.map(a => [a.questionId, a]));
      mergedAnswers = mergedAnswers.map(original => {
        const retryAnswer = retryMap.get(original.questionId);
        if (retryAnswer?.isCorrect) {
          return retryAnswer;
        }
        return original;
      });
    });

  const correctCount = mergedAnswers.filter(a => a.isCorrect).length;
  return {
    totalScore: correctCount,
    percentage: Math.round((correctCount / 10) * 100),
  };
}

/**
 * Get all records (for debugging)
 */
export function getAllRecords(): PracticeSetRecord[] {
  return mockSetRecords;
}

/**
 * Get all records for a set (including retries)
 */
export function getAllRecordsForSet(setId: string): PracticeSetRecord[] {
  return mockSetRecords
    .filter((r) => r.setId === setId)
    .sort((a, b) => 
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
}

/**
 * Clear all records (for testing)
 */
export function clearAllRecords(): void {
  mockSetRecords.length = 0;
  if (isBrowser()) {
    localStorage.removeItem(COMPLETED_SETS_KEY);
  }
}

/**
 * Get issue summary for a practice set record
 * Returns a human-readable summary of main problems
 */
export function getSetIssueSummary(record: PracticeSetRecord): string {
  const wrongAnswers = getWrongAnswers(record);
  
  if (wrongAnswers.length === 0) {
    return "全部正确";
  }
  
  const wrongCount = wrongAnswers.length;
  
  // Check for skipped questions (empty answers)
  const skippedCount = wrongAnswers.filter((a) => a.selectedWords.length === 0).length;
  if (skippedCount === wrongCount) {
    return `${skippedCount}道题未作答`;
  }
  if (skippedCount > 0) {
    return `${wrongCount}道错误，其中${skippedCount}道未作答`;
  }
  
  // Check score distribution
  const lowScoreCount = wrongAnswers.filter((a) => a.score < 50).length;
  if (lowScoreCount === wrongCount) {
    return `${wrongCount}道题词序需改进`;
  }
  
  const partialCount = wrongAnswers.filter((a) => a.score >= 50).length;
  if (partialCount > 0 && lowScoreCount > 0) {
    return `${partialCount}道接近正确，${lowScoreCount}道需重点复习`;
  }
  
  return `${wrongCount}道题词序有误`;
}

/**
 * Get main issue for a set (simpler version for display)
 */
export function getSetMainIssue(record: PracticeSetRecord): string {
  const wrongAnswers = getWrongAnswers(record);
  
  if (wrongAnswers.length === 0) {
    return "表现优秀";
  }
  
  const skippedCount = wrongAnswers.filter((a) => a.selectedWords.length === 0).length;
  if (skippedCount > 0) {
    return "有未作答题目";
  }
  
  if (wrongAnswers.length <= 2) {
    return "个别词序错误";
  }
  
  if (wrongAnswers.length <= 5) {
    return "部分句子需练习";
  }
  
  return "需加强句子结构练习";
}
