"use client";

import TeacherConfigClient from "./components/TeacherConfigClient";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { Users, BookOpen } from "lucide-react";
import { TeacherConfig } from "@/lib/types";

// Default config - will be overridden by localStorage in the client
const defaultConfig: TeacherConfig = {
  dailyRequiredSets: 2,
  assignedSetIds: [],
};

/**
 * Teacher Config Page
 * V2 Architecture: Default config only, practice sets loaded from API
 */
export default function TeacherConfigPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-apple-gray py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-apple mx-auto">
        {/* Navigation Buttons - Apple style */}
        <div className="flex justify-end gap-3 mb-6">
          <Button
            variant="secondary"
            size="md"
            onClick={() => router.push("/teacher/students")}
            className="flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Student Data
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => router.push("/teacher/activity")}
            className="flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Activity
          </Button>
        </div>
        
        <TeacherConfigClient initialConfig={defaultConfig} />
      </div>
    </main>
  );
}
