"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, BookOpen, User } from "lucide-react";
import type { AssignmentResponse, StudentInfo } from "@/lib/teacher/types";
import { formatDateShort } from "@/lib/utils";
import { getAssignmentStatusBadge } from "@/lib/teacher/formatters";

export default function StudentAssignmentsPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [assignments, setAssignments] = useState<AssignmentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch student info and assignments in parallel
    Promise.all([
      fetch(`/api/teacher/students/${studentId}`).then((res) => {
        if (!res.ok) throw new Error("Student not found");
        return res.json();
      }),
      fetch(`/api/teacher/students/${studentId}/assignments`).then((res) => {
        if (!res.ok) throw new Error("Failed to fetch assignments");
        return res.json();
      }),
    ])
      .then(([studentData, assignmentsData]) => {
        setStudent(studentData.student);
        setAssignments(assignmentsData.assignments || []);
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
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push(`/teacher/students/${studentId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Student
          </Button>
        </div>

        {/* Page Header */}
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-apple-gray flex items-center justify-center border border-apple-border">
            <User className="h-6 w-6 text-apple-text-secondary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-apple-text">{student.name}</h1>
            <p className="text-apple-text-secondary">Assignment History</p>
          </div>
        </div>

        {/* Assignments List */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-apple-text-secondary" />
              <CardTitle>All Assignments</CardTitle>
            </div>
            <CardDescription>
              {assignments.length} assignment{assignments.length !== 1 ? "s" : ""} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <div className="py-12 text-center text-apple-text-secondary">
                No assignments yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-apple-border">
                      <th className="py-3 pr-4 text-sm font-medium text-apple-text-secondary">
                        Practice Set
                      </th>
                      <th className="py-3 pr-4 text-sm font-medium text-apple-text-secondary">
                        Topic
                      </th>
                      <th className="py-3 pr-4 text-sm font-medium text-apple-text-secondary">
                        Assigned
                      </th>
                      <th className="py-3 pr-4 text-sm font-medium text-apple-text-secondary">
                        Due Date
                      </th>
                      <th className="py-3 pr-4 text-sm font-medium text-apple-text-secondary">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((assignment) => (
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
                          {formatDateShort(assignment.dueDate)}
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
      </div>
    </main>
  );
}
