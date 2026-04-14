"use client";

import { Badge } from "@/components/ui/Badge";
import type { ActivityEvent, ActivityEventWithStudent } from "@/lib/teacher/types";
import { formatDate, formatDateShort } from "@/lib/utils";

interface ActivityTableProps {
  events: ActivityEvent[] | ActivityEventWithStudent[];
  showStudent?: boolean;
}

function hasStudent(event: ActivityEvent | ActivityEventWithStudent): event is ActivityEventWithStudent {
  return "student" in event;
}

export function ActivityTable({ events, showStudent = false }: ActivityTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-apple-border">
            <th className="py-3 pr-4 text-sm font-medium text-apple-text-secondary">
              Time
            </th>
            {showStudent && (
              <th className="py-3 pr-4 text-sm font-medium text-apple-text-secondary">
                Student
              </th>
            )}
            <th className="py-3 pr-4 text-sm font-medium text-apple-text-secondary">
              Event
            </th>
            <th className="py-3 pr-4 text-sm font-medium text-apple-text-secondary">
              Practice Set
            </th>
            <th className="py-3 pr-4 text-sm font-medium text-apple-text-secondary">
              Topic
            </th>
            <th className="py-3 pr-4 text-sm font-medium text-apple-text-secondary">
              Details
            </th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr
              key={event.id}
              className="border-b border-apple-border/50 last:border-b-0"
            >
              <td className="py-4 pr-4 text-sm text-apple-text-secondary whitespace-nowrap">
                {formatDate(event.timestamp)}
              </td>
              {showStudent && hasStudent(event) && (
                <td className="py-4 pr-4 text-sm text-apple-text">
                  {event.student.name}
                </td>
              )}
              <td className="py-4 pr-4">
                {event.type === "assignment_assigned" ? (
                  <Badge variant="neutral">Assigned</Badge>
                ) : event.details.attemptType === "full_attempt" ? (
                  <Badge variant="primary">Completed</Badge>
                ) : (
                  <Badge variant="warning">Retry</Badge>
                )}
              </td>
              <td className="py-4 pr-4 text-sm text-apple-text">
                {event.practiceSet.title}
              </td>
              <td className="py-4 pr-4 text-sm text-apple-text-secondary">
                {event.topic?.name ?? "—"}
              </td>
              <td className="py-4 pr-4 text-sm text-apple-text">
                {event.type === "assignment_assigned" ? (
                  event.details.completed ? (
                    <Badge variant="success">Completed</Badge>
                  ) : (
                    <span className="text-apple-text-secondary">
                      Due: {formatDateShort(event.details.dueDate)}
                    </span>
                  )
                ) : (
                  <span>
                    {event.details.correctCount}/{event.details.totalQuestions}
                    <span className="text-apple-text-secondary ml-1">
                      (
                      {Math.round(
                        ((event.details.correctCount ?? 0) /
                          (event.details.totalQuestions ?? 1)) *
                          100
                      )}
                      %)
                    </span>
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
