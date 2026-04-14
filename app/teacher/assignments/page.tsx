"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Badge } from "@/components/ui/Badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Calendar } from "@/components/ui/Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { format } from "date-fns";
import { 
  Calendar as CalendarIcon, 
  ArrowLeft, 
  CheckCircle2, 
  BookOpen, 
  Users,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

// 类型定义
interface Student {
  id: string;
  name: string;
  email: string;
  assignmentCount: number;
}

interface PracticeSet {
  id: string;
  title: string;
  topicName: string | null;
  questionCount?: number;
}

interface Topic {
  id: string;
  name: string;
}

export default function AssignmentsPage() {
  const router = useRouter();
  
  // 状态管理
  const [students, setStudents] = useState<Student[]>([]);
  const [practiceSets, setPracticeSets] = useState<PracticeSet[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [selectedPracticeSets, setSelectedPracticeSets] = useState<Set<string>>(new Set());
  const [dueDate, setDueDate] = useState<Date>();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  // 加载数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 并行获取学生、练习集和主题
        const [studentsRes, practiceSetsRes] = await Promise.all([
          fetch("/api/teacher/students"),
          fetch("/api/teacher/practice-sets"),
        ]);

        if (!studentsRes.ok || !practiceSetsRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const studentsData = await studentsRes.json();
        const practiceSetsData = await practiceSetsRes.json();

        setStudents(studentsData.students || []);
        setPracticeSets(practiceSetsData.practiceSets || []);
        
        // 提取唯一主题
        const uniqueTopics = new Map<string, string>();
        practiceSetsData.practiceSets?.forEach((set: PracticeSet) => {
          if (set.topicName && !uniqueTopics.has(set.topicName)) {
            uniqueTopics.set(set.topicName, set.topicName);
          }
        });
        setTopics(Array.from(uniqueTopics.entries()).map(([name, id]) => ({ id, name })));
        
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 过滤练习集
  const filteredPracticeSets = selectedTopic
    ? practiceSets.filter(set => set.topicName === selectedTopic)
    : practiceSets;

  // 处理学生选择
  const toggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  // 全选/取消全选学生
  const toggleAllStudents = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students.map(s => s.id)));
    }
  };

  // 处理练习集选择
  const togglePracticeSet = (setId: string) => {
    const newSelected = new Set(selectedPracticeSets);
    if (newSelected.has(setId)) {
      newSelected.delete(setId);
    } else {
      newSelected.add(setId);
    }
    setSelectedPracticeSets(newSelected);
  };

  // 提交分配
  const handleAssign = async () => {
    if (selectedStudents.size === 0 || selectedPracticeSets.size === 0) {
      setError("Please select at least one student and one practice set");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const assignments = [];
      
      // 为每个学生的每个练习集创建分配
      for (const studentId of selectedStudents) {
        for (const practiceSetId of selectedPracticeSets) {
          assignments.push(
            fetch("/api/teacher/assignments", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                studentId,
                practiceSetId,
                dueDate: dueDate?.toISOString(),
              }),
            })
          );
        }
      }

      const results = await Promise.all(assignments);
      const failed = results.filter(r => !r.ok);

      if (failed.length > 0) {
        throw new Error(`Failed to create ${failed.length} assignments`);
      }

      // 成功，跳转到教师页面
      router.push("/teacher");
      router.refresh();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create assignments");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-apple-gray flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-apple-gray py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* 头部导航 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/teacher")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="text-2xl font-semibold text-gray-900">
              Assign Practice Sets
            </h1>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：学生选择 */}
          <Card className="bg-white shadow-sm">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  <CardTitle className="text-lg">Select Students</CardTitle>
                </div>
                <Badge variant="secondary">
                  {selectedStudents.size} selected
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="mb-4 flex items-center gap-2">
                <Checkbox
                  id="select-all-students"
                  checked={selectedStudents.size === students.length && students.length > 0}
                  onCheckedChange={toggleAllStudents}
                />
                <label htmlFor="select-all-students" className="text-sm font-medium cursor-pointer">
                  Select All Students
                </label>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {students.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No students found</p>
                ) : (
                  students.map((student) => (
                    <div
                      key={student.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                        selectedStudents.has(student.id)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                      onClick={() => toggleStudent(student.id)}
                    >
                      <Checkbox
                        checked={selectedStudents.has(student.id)}
                        onCheckedChange={() => toggleStudent(student.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {student.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {student.email}
                        </p>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {student.assignmentCount} assignments
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* 右侧：练习集选择 */}
          <Card className="bg-white shadow-sm">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-green-500" />
                  <CardTitle className="text-lg">Select Practice Sets</CardTitle>
                </div>
                <Badge variant="secondary">
                  {selectedPracticeSets.size} selected
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {/* 主题过滤 */}
              {topics.length > 0 && (
                <div className="mb-4">
                  <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Filter by topic..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Topics</SelectItem>
                      {topics.map((topic) => (
                        <SelectItem key={topic.id} value={topic.name}>
                          {topic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {filteredPracticeSets.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No practice sets found</p>
                ) : (
                  filteredPracticeSets.map((set) => (
                    <div
                      key={set.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                        selectedPracticeSets.has(set.id)
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                      onClick={() => togglePracticeSet(set.id)}
                    >
                      <Checkbox
                        checked={selectedPracticeSets.has(set.id)}
                        onCheckedChange={() => togglePracticeSet(set.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {set.title}
                        </p>
                        {set.topicName && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {set.topicName}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 底部：截止日期和提交 */}
        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : "Set due date (optional)"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                {dueDate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDueDate(undefined)}
                  >
                    Clear
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Assigning to{" "}
                  <span className="font-semibold text-blue-600">
                    {selectedStudents.size}
                  </span>{" "}
                  students,{" "}
                  <span className="font-semibold text-green-600">
                    {selectedPracticeSets.size}
                  </span>{" "}
                  practice sets
                  {selectedStudents.size > 0 && selectedPracticeSets.size > 0 && (
                    <span className="text-gray-500">
                      {" "}
                      ({selectedStudents.size * selectedPracticeSets.size} total assignments)
                    </span>
                  )}
                </div>
                
                <Button
                  size="lg"
                  onClick={handleAssign}
                  disabled={submitting || selectedStudents.size === 0 || selectedPracticeSets.size === 0}
                  className="min-w-[140px]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Assign
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
