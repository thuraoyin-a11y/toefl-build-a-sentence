/**
 * Shared formatter utilities for teacher-side display logic
 * Narrow helpers for badge labels/variants and score display
 */

import type { BadgeVariant } from "@/components/ui/Badge";

/**
 * Get badge label and variant for assignment completion status
 */
export function getAssignmentStatusBadge(
  completed: boolean
): { label: string; variant: BadgeVariant } {
  return completed
    ? { label: "Completed", variant: "success" }
    : { label: "Pending", variant: "neutral" };
}

/**
 * Get badge label and variant for attempt type
 */
export function getAttemptTypeBadge(
  attemptType: "full_attempt" | "retry_attempt"
): { label: string; variant: BadgeVariant } {
  return attemptType === "full_attempt"
    ? { label: "Full", variant: "primary" }
    : { label: "Retry", variant: "warning" };
}

/**
 * Format score display with percentage
 * Returns "X/Y (Z%)" format where X is correctCount
 */
export function formatScoreDisplay(correctCount: number, total: number): string {
  // Ensure values are numbers
  const count = Number(correctCount) || 0;
  const tot = Number(total) || 0;
  const percentage = tot > 0 ? Math.round((count / tot) * 100) : 0;
  return `${count}/${tot} (${percentage}%)`;
}
