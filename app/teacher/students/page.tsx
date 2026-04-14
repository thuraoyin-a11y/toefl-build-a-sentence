"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Clock, ArrowLeft, Settings } from "lucide-react";
import type { StudentSummary } from "@/lib/teacher/types";
import { formatDate } from "@/lib/utils";

export default function TeacherStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/teacher/students")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch students");
        return res.json();
      })
      .then((data) => {
        setStudents(data.students || []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unknown error");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-[#F5F5F7] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold text-gray-900">Students</h1>
          <p className="text-gray-500">Overview of your students and their progress</p>
        </div>

        <div className="flex justify-between items-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push("/teacher")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Teacher Home
          </Button>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push("/teacher")}
            >
              <Settings className="h-4 w-4 mr-2" />
              Config
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push("/teacher/activity")}
            >
              <Clock className="h-4 w-4 mr-2" />
              View Recent Activity
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Student List</CardTitle>
            <CardDescription>
              {students.length} student{students.length !== 1 ? "s" : ""} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-12 text-center text-apple-text-secondary">Loading...</div>
            ) : error ? (
              <div className="py-12 text-center text-red-600">{error}</div>
            ) : students.length === 0 ? (
              <div className="py-12 text-center text-apple-text-secondary">No students found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-apple-border">
                      <th className="py-3 pr-4 text-sm font-medium text-apple-text-secondary">Name</th>
                      <th className="py-3 pr-4 text-sm font-medium text-apple-text-secondary">Email</th>
                      <th className="py-3 pr-4 text-sm font-medium text-apple-text-secondary">Status</th>
                      <th className="py-3 pr-4 text-sm font-medium text-apple-text-secondary text-right">Pending</th>
                      <th className="py-3 pr-4 text-sm font-medium text-apple-text-secondary text-right">Completed</th>
                      <th className="py-3 pr-4 text-sm font-medium text-apple-text-secondary text-right">Attempts</th>
                      <th className="py-3 pr-4 text-sm font-medium text-apple-text-secondary">Last Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr
                        key={student.id}
                        onClick={() => router.push(`/teacher/students/${student.id}`)}
                        className="border-b border-apple-border/50 last:border-b-0 cursor-pointer hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="py-4 pr-4 text-sm font-medium text-apple-text">{student.name}</td>
                        <td className="py-4 pr-4 text-sm text-apple-text-secondary">{student.email}</td>
                        <td className="py-4 pr-4">
                          {student.isActive ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Badge variant="neutral">Inactive</Badge>
                          )}
                        </td>
                        <td className="py-4 pr-4 text-sm text-apple-text text-right">{student.pendingAssignments}</td>
                        <td className="py-4 pr-4 text-sm text-apple-text text-right">{student.completedAssignments}</td>
                        <td className="py-4 pr-4 text-sm text-apple-text text-right">{student.attemptCount}</td>
                        <td className="py-4 pr-4 text-sm text-apple-text-secondary">
                          {formatDate(student.lastActiveAt)}
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
