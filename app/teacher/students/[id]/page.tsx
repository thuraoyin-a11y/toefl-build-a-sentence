"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, User, BookOpen, Target, Clock, CheckCircle2, History, Home } from "lucide-react";
import type { StudentDetail } from "@/lib/teacher/types";
import { formatDate, formatDateShort } from "@/lib/utils";
import {
  getAssignmentStatusBadge,
  getAttemptTypeBadge,
  formatScoreDisplay,
} from "@/lib/teacher/formatters";

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/teacher/students/${studentId}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) throw new Error("Student not found");
          throw new Error("Failed to fetch student");
        }
        return res.json();
      })
      .then((data) => {
        setStudent(data.student);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unknown error");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [studentId]);



  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#F5F5F7] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="py-12 text-center text-apple-text-secondary">Loading...</div>
        </div>
      </main>
    );
  }

  if (error || !student) {
    return (
      <main className="min-h-screen bg-[#F5F5F7] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="py-12 text-center">
            <p className="text-red-600 mb-4">{error || "Student not found"}</p>
            <Button onClick={() => router.push("/teacher/students")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Students
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F5F7] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header with back buttons */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push("/teacher/students")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Students
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/teacher")}
            >
              <Home className="h-4 w-4 mr-2" />
              Teacher Home
            </Button>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push(`/teacher/students/${studentId}/timeline`)}
          >
            <History className="h-4 w-4 mr-2" />
            View Timeline
          </Button>
        </div>

        {/* Student Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-apple-gray flex items-center justify-center border border-apple-border">
                  <User className="h-8 w-8 text-apple-text-secondary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{student.name}</CardTitle>
                  <CardDescription>{student.email}</CardDescription>
                  <div className="flex items-center gap-2 mt-2">
                    {student.isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="neutral">Inactive</Badge>
                    )}
                    <span className="text-sm text-apple-text-secondary">
                      Daily Goal: {student.dailyGoal} sets
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right text-sm text-apple-text-secondary">
                <p>Member since {formatDateShort(student.createdAt)}</p>
                {student.aggregates.lastActiveAt && (
                  <p>Last active {formatDateShort(student.aggregates.lastActiveAt)}</p>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Aggregates Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-apple-text">
                    {student.aggregates.totalAssignments}
                  </p>
                  <p className="text-sm text-apple-text-secondary">Total Assignments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-apple-text">
                    {student.aggregates.completedAssignments}
                  </p>
                  <p className="text-sm text-apple-text-secondary">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-apple-text">
                    {student.aggregates.pendingAssignments}
                  </p>
                  <p className="text-sm text-apple-text-secondary">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Target className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-apple-text">
                    {student.aggregates.totalAttempts}
                  </p>
                  <p className="text-sm text-apple-text-secondary">Total Attempts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Assignments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Assignments</CardTitle>
                <CardDescription>Last {student.recentAssignments.length} assignments</CardDescription>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push(`/teacher/students/${studentId}/assignments`)}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {student.recentAssignments.length === 0 ? (
              <div className="py-8 text-center text-apple-text-secondary">
                No assignments yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-apple-border">
                      <th className="py-3 pr-4 text-sm font-medium text-apple-text-secondary">Practice Set</th>
                      <th className="py-3 pr-4 text-sm font-medium text-apple-text-secondary">Topic</th>
                      <th className="py-3 pr-4 text-sm font-medium text-apple-text-secondary">Assigned</th>
                      <th className="py-3 pr-4 text-sm font-medium text-apple-text-secondary">Due Date</th>
                      <th className="py-3 pr-4 text-sm font-medium text-apple-text-secondary">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.recentAssignments.map((assignment) => (
                      <tr
                        key={assignment.id}
                        className="border-b border-apple-border/50 last:border-b-0"
                      >
                        <td className="py-4 pr-4 text-sm text-apple-text">
                          {assignment.practiceSetTitle}
                        </td>
                        <td className="py-4 pr-4 text-sm text-apple-text-secondary">
                          {assignment.topicName ?? "—"}
                        </td>
                        <td className="py-4 pr-4 text-sm text-apple-text-secondary">
                          {formatDateShort(assignment.assignedAt)}
                        </td>
                        <td className="py-4 pr-4 text-sm text-apple-text-secondary">
                          {assignment.dueDate ? formatDateShort(assignment.dueDate) : "—"}
                        </td>
                        <td className="py-4 pr-4">
                          <Badge variant={getAssignmentStatusBadge(assignment.completed).variant}>
                            {getAssignmentStatusBadge(assignment.completed).label}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Attempts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Attempts</CardTitle>
                <CardDescription>Last {student.recentAttempts.length} completed attempts</CardDescription>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push(`/teacher/students/${studentId}/attempts`)}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {student.recentAttempts.length === 0 ? (
              <div className="py-8 text-center text-apple-text-secondary">
                No attempts yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-apple-border">
                      <th className="py-3 pr-4 text-sm font-medium text-apple-text-secondary">Practice Set</th>
                      <th className="py-3 pr-4 text-sm font-medium text-apple-text-secondary">Type</th>
                      <th className="py-3 pr-4 text-sm font-medium text-apple-text-secondary">Score</th>
                      <th className="py-3 pr-4 text-sm font-medium text-apple-text-secondary">Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.recentAttempts.map((attempt) => (
                      <tr
                        key={attempt.id}
                        className="border-b border-apple-border/50 last:border-b-0"
                      >
                        <td className="py-4 pr-4 text-sm text-apple-text">
                          {attempt.practiceSetTitle}
                        </td>
                        <td className="py-4 pr-4">
                          <Badge variant={getAttemptTypeBadge(attempt.attemptType).variant}>
                            {getAttemptTypeBadge(attempt.attemptType).label}
                          </Badge>
                        </td>
                        <td className="py-4 pr-4 text-sm text-apple-text">
                          {formatScoreDisplay(attempt.correctCount, attempt.totalQuestions)}
                        </td>
                        <td className="py-4 pr-4 text-sm text-apple-text-secondary">
                          {formatDate(attempt.completedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
