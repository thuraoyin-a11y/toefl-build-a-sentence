/**
 * Shared mapping utilities for teacher-side student detail area
 * Transforms Prisma query results to API response shapes
 */

import type { AssignmentResponse, AttemptResponse, ActivityEvent, ActivityEventWithStudent } from "./types";

/**
 * Map a Prisma Assignment to the standard AssignmentResponse shape
 * Works with various Prisma query result shapes that include practiceSet with topic
 */
export function mapAssignmentToResponse(
  assignment: {
    id: string;
    practiceSetId: string;
    assignedAt: Date;
    dueDate: Date | null;
    completed: boolean;
    practiceSet: {
      title: string;
      topic?: { id?: string; name: string } | null;
    };
  }
): AssignmentResponse {
  return {
    id: assignment.id,
    practiceSetId: assignment.practiceSetId,
    practiceSetTitle: assignment.practiceSet.title,
    topicId: assignment.practiceSet.topic?.id ?? null,
    topicName: assignment.practiceSet.topic?.name ?? null,
    assignedAt: assignment.assignedAt.toISOString(),
    dueDate: assignment.dueDate?.toISOString() ?? null,
    completed: assignment.completed,
  };
}

/**
 * Map a Prisma PracticeAttempt to the standard AttemptResponse shape
 * Works with various Prisma query result shapes that include practiceSet with topic
 */
export function mapAttemptToResponse(
  attempt: {
    id: string;
    practiceSetId: string;
    attemptType: "full_attempt" | "retry_attempt";
    score: number;
    correctCount: number;
    totalQuestions: number;
    completedAt: Date;
    practiceSet: {
      id?: string;
      title: string;
      topic?: { name: string } | null;
    };
  }
): AttemptResponse {
  return {
    id: attempt.id,
    practiceSetId: attempt.practiceSetId,
    practiceSetTitle: attempt.practiceSet.title,
    topicName: attempt.practiceSet.topic?.name ?? null,
    attemptType: attempt.attemptType,
    score: attempt.score,
    correctCount: attempt.correctCount,
    totalQuestions: attempt.totalQuestions,
    completedAt: attempt.completedAt.toISOString(),
  };
}

/**
 * Map an Assignment to an ActivityEvent (timeline/activity views)
 */
export function mapAssignmentToActivityEvent(
  assignment: {
    id: string;
    assignedAt: Date;
    dueDate: Date | null;
    completed: boolean;
    practiceSet: {
      id?: string;
      title: string;
      topic?: { id?: string; name: string } | null;
    };
  }
): ActivityEvent {
  return {
    id: `asg_${assignment.id}`,
    type: "assignment_assigned",
    timestamp: assignment.assignedAt.toISOString(),
    practiceSet: {
      id: assignment.practiceSet.id ?? assignment.id, // Fallback to assignment id if not provided
      title: assignment.practiceSet.title,
    },
    topic: assignment.practiceSet.topic
      ? {
          id: assignment.practiceSet.topic.id ?? "", // Empty string fallback if id not provided
          name: assignment.practiceSet.topic.name,
        }
      : null,
    details: {
      dueDate: assignment.dueDate?.toISOString() ?? null,
      completed: assignment.completed,
    },
  };
}

/**
 * Map a PracticeAttempt to an ActivityEvent (timeline/activity views)
 */
export function mapAttemptToActivityEvent(
  attempt: {
    id: string;
    attemptType: "full_attempt" | "retry_attempt";
    score: number;
    correctCount: number;
    totalQuestions: number;
    completedAt: Date;
    practiceSet: {
      id: string;
      title: string;
      topic?: { id?: string; name: string } | null;
    };
  }
): ActivityEvent {
  return {
    id: `att_${attempt.id}`,
    type: "attempt_completed",
    timestamp: attempt.completedAt.toISOString(),
    practiceSet: {
      id: attempt.practiceSet.id,
      title: attempt.practiceSet.title,
    },
    topic: attempt.practiceSet.topic
      ? {
          id: attempt.practiceSet.topic.id ?? "",
          name: attempt.practiceSet.topic.name,
        }
      : null,
    details: {
      attemptType: attempt.attemptType,
      score: attempt.score,
      correctCount: attempt.correctCount,
      totalQuestions: attempt.totalQuestions,
    },
  };
}

/**
 * Map an Assignment to an ActivityEventWithStudent (multi-student activity view)
 */
export function mapAssignmentToActivityEventWithStudent(
  assignment: {
    id: string;
    assignedAt: Date;
    dueDate: Date | null;
    completed: boolean;
    student: {
      id: string;
      user: { name: string };
    };
    practiceSet: {
      id: string;
      title: string;
      topic?: { id?: string; name: string } | null;
    };
  }
): ActivityEventWithStudent {
  return {
    id: `asg_${assignment.id}`,
    type: "assignment_assigned",
    timestamp: assignment.assignedAt.toISOString(),
    student: {
      id: assignment.student.id,
      name: assignment.student.user.name,
    },
    practiceSet: {
      id: assignment.practiceSet.id,
      title: assignment.practiceSet.title,
    },
    topic: assignment.practiceSet.topic
      ? {
          id: assignment.practiceSet.topic.id ?? "",
          name: assignment.practiceSet.topic.name,
        }
      : null,
    details: {
      dueDate: assignment.dueDate?.toISOString() ?? null,
      completed: assignment.completed,
    },
  };
}

/**
 * Map a PracticeAttempt to an ActivityEventWithStudent (multi-student activity view)
 */
export function mapAttemptToActivityEventWithStudent(
  attempt: {
    id: string;
    attemptType: "full_attempt" | "retry_attempt";
    score: number;
    correctCount: number;
    totalQuestions: number;
    completedAt: Date;
    student: {
      id: string;
      user: { name: string };
    };
    practiceSet: {
      id: string;
      title: string;
      topic?: { id?: string; name: string } | null;
    };
  }
): ActivityEventWithStudent {
  return {
    id: `att_${attempt.id}`,
    type: "attempt_completed",
    timestamp: attempt.completedAt.toISOString(),
    student: {
      id: attempt.student.id,
      name: attempt.student.user.name,
    },
    practiceSet: {
      id: attempt.practiceSet.id,
      title: attempt.practiceSet.title,
    },
    topic: attempt.practiceSet.topic
      ? {
          id: attempt.practiceSet.topic.id ?? "",
          name: attempt.practiceSet.topic.name,
        }
      : null,
    details: {
      attemptType: attempt.attemptType,
      score: attempt.score,
      correctCount: attempt.correctCount,
      totalQuestions: attempt.totalQuestions,
    },
  };
}
