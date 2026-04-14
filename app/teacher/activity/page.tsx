"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Clock, Users } from "lucide-react";
import type { ActivityEventWithStudent } from "@/lib/teacher/types";
import { ActivityTable } from "../components/ActivityTable";

export default function TeacherActivityPage() {
  const router = useRouter();
  const [events, setEvents] = useState<ActivityEventWithStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/teacher/activity")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch activity");
        return res.json();
      })
      .then((data) => {
        setEvents(data.events || []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unknown error");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);



  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#F5F5F7] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="py-12 text-center text-apple-text-secondary">Loading...</div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#F5F5F7] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="py-12 text-center">
            <p className="text-red-600 mb-4">{error}</p>
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
            onClick={() => router.push("/teacher/students")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Students
          </Button>
        </div>

        {/* Page Header */}
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-apple-gray flex items-center justify-center border border-apple-border">
            <Users className="h-6 w-6 text-apple-text-secondary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-apple-text">Recent Activity</h1>
            <p className="text-apple-text-secondary">Latest activity across all students</p>
          </div>
        </div>

        {/* Activity List */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-apple-text-secondary" />
              <CardTitle>All Activity</CardTitle>
            </div>
            <CardDescription>
              {events.length} recent event{events.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="py-12 text-center text-apple-text-secondary">
                No activity yet
              </div>
            ) : (
              <ActivityTable events={events} showStudent />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
