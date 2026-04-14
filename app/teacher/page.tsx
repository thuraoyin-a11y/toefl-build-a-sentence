"use client";

import TeacherConfigClient from "./components/TeacherConfigClient";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { Users, BookOpen, ClipboardList } from "lucide-react"; // 添加 ClipboardList
import { TeacherConfig } from "@/lib/types";

const defaultConfig: TeacherConfig = {
  dailyRequiredSets: 2,
  assignedSetIds: [],
};

export default function TeacherConfigPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-apple-gray py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-apple mx-auto">
        {/* 导航按钮 - Apple 风格 */}
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
          {/* 新增：分配练习集按钮 */}
          <Button
            variant="primary" // 或使用突出显示的颜色
            size="md"
            onClick={() => router.push("/teacher/assignments")}
            className="flex items-center gap-2"
          >
            <ClipboardList className="w-4 h-4" />
            Assign Practice Sets
          </Button>
        </div>
        
        <TeacherConfigClient initialConfig={defaultConfig} />
      </div>
    </main>
  );
}
