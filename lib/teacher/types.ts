/**
 * Shared types for teacher-side student detail area
 * Used across API routes and frontend pages
 */

/**
 * Base activity event shared between timeline and activity views
 */
export interface ActivityEvent {
  id: string;
  type: "assignment_assigned" | "attempt_completed";
  timestamp: string;
  practiceSet: {
    id: string;
    title: string;
  };
  topic: {
    id: string;
    name: string;
  } | null;
  details: {
    dueDate?: string | null;
    completed?: boolean;
    attemptType?: "full_attempt" | "retry_attempt";
    score?: number;
    correctCount?: number;
    totalQuestions?: number;
  };
}

/**
 * Activity event with student info (for multi-student activity view)
 */
export interface ActivityEventWithStudent extends ActivityEvent {
  student: {
    id: string;
    name: string;
  };
}

/**
 * Timeline response for single-student view
 */
export interface TimelineResponse {
  student: {
    id: string;
    name: string;
  };
  events: ActivityEvent[];
}

/**
 * Assignment response shape (shared across endpoints)
 */
export interface AssignmentResponse {
  id: string;
  practiceSetId: string;
  practiceSetTitle: string;
  topicId: string | null;
  topicName: string | null;
  assignedAt: string;
  dueDate: string | null;
  completed: boolean;
}

/**
 * Attempt response shape (shared across endpoints)
 */
export interface AttemptResponse {
  id: string;
  practiceSetId: string;
  practiceSetTitle: string;
  topicName: string | null;
  attemptType: "full_attempt" | "retry_attempt";
  score: number;
  correctCount: number;
  totalQuestions: number;
  completedAt: string;
}

/**
 * Student summary for list views
 */
export interface StudentSummary {
  id: string;
  userId: string;
  name: string;
  email: string;
  dailyGoal: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  assignmentCount: number;
  pendingAssignments: number;
  completedAssignments: number;
  attemptCount: number;
  lastActiveAt: string | null;
}

/**
 * Student info minimal shape (for page headers)
 */
export interface StudentInfo {
  id: string;
  name: string;
}

/**
 * Student aggregates (for detail view)
 */
export interface StudentAggregates {
  totalAssignments: number;
  completedAssignments: number;
  pendingAssignments: number;
  totalAttempts: number;
  lastActiveAt: string | null;
}

/**
 * Student detail response shape
 */
export interface StudentDetail {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  dailyGoal: number;
  createdAt: string;
  aggregates: StudentAggregates;
  recentAssignments: AssignmentResponse[];
  recentAttempts: AttemptResponse[];
}
