"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"; // 使用你的自定义 Card
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { 
  Calendar as CalendarIcon, 
  ArrowLeft, 
  CheckCircle2, 
  BookOpen, 
  Users,
  Loader2,
  Check,
  ChevronDown
} from "lucide-react";

// 临时简单的 Checkbox 组件（如果没有的话）
const Checkbox = ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: () => void }) => (
  <div 
    onClick={onCheckedChange}
    className={cn(
      "h-4 w-4 rounded border cursor-pointer flex items-center justify-center transition-colors",
      checked 
        ? "bg-blue-500 border-blue-500 text-white" 
        : "border-gray-300 hover:border-gray-400 bg-white"
    )}
  >
    {checked && <Check className="w-3 h-3" />}
  </div>
);

// 临时简单的 Badge 组件
const Badge = ({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "secondary" | "outline" }) => {
  const variantStyles = {
    default: "bg-blue-100 text-blue-800",
    secondary: "bg-gray-100 text-gray-800",
    outline: "border border-gray-300 text-gray-700"
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", variantStyles[variant])}>
      {children}
    </span>
  );
};

// 临时简单的 Select 组件
const SimpleSelect = ({ 
  value, 
  onChange, 
  options, 
  placeholder 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  options: { value: string; label: string }[];
  placeholder?: string;
}) => {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);
  
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className={selected ? "text-gray-900" : "text-gray-500"}>
          {selected?.label || placeholder || "Select..."}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform", open && "rotate-180")} />
      </button>
      
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-gray-50",
                  value === option.value && "bg-blue-50 text-blue-700"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// 临时简单的 Calendar/DatePicker
const DatePicker = ({ date, onChange }: { date?: Date; onChange: (date?: Date) => void }) => {
  const [open, setOpen] = useState(false);
  
  // 简单的日期输入作为替代
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm hover:border-gray-400"
      >
        <CalendarIcon className="w-4 h-4 text-gray-500" />
        <span className={date ? "text-gray-900" : "text-gray-500"}>
          {date ? format(date, "PPP") : "Set due date (optional)"}
        </span>
      </button>
      
      {open && (
        <div className="absolute z-20 mt-1 p-3 bg-white border border-gray-200 rounded-lg shadow-lg">
          <input
            type="date"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            onChange={(e) => {
              const d = e.target.value ? new Date(e.target.value) : undefined;
              onChange(d);
              setOpen(false);
            }}
          />
        </div>
      )}
      
      {date && (
        <button 
          onClick={() => onChange(undefined)}
          className="ml-2 text-sm text-gray-500 hover:text-gray-700"
        >
          Clear
        </button>
      )}
    </div>
  );
};

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
      // 使用单个分配 API
      const assignments = [];
      
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
              variant="secondary"
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
          <Card variant="elevated" padding="none">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg font-semibold">Select Students</h2>
                </div>
                <Badge variant="secondary">
                  {selectedStudents.size} selected
                </Badge>
              </div>
            </div>
            
            <div className="p-4">
              <div className="mb-4 flex items-center gap-2">
                <Checkbox
                  checked={selectedStudents.size === students.length && students.length > 0}
                  onCheckedChange={toggleAllStudents}
                />
                <label className="text-sm font-medium cursor-pointer">
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
                          : "border-gray-200 hover:border-gray-300 bg-white"
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
                      <Badge variant="outline">
                        {student.assignmentCount} assignments
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>

          {/* 右侧：练习集选择 */}
          <Card variant="elevated" padding="none">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-green-500" />
                  <h2 className="text-lg font-semibold">Select Practice Sets</h2>
                </div>
                <Badge variant="secondary">
                  {selectedPracticeSets.size} selected
                </Badge>
              </div>
            </div>
            
            <div className="p-4">
              {/* 主题过滤 */}
              {topics.length > 0 && (
                <div className="mb-4">
                  <SimpleSelect
                    value={selectedTopic}
                    onChange={setSelectedTopic}
                    placeholder="Filter by topic..."
                    options={[
                      { value: "", label: "All Topics" },
                      ...topics.map(t => ({ value: t.name, label: t.name }))
                    ]}
                  />
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
                          : "border-gray-200 hover:border-gray-300 bg-white"
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
                          <Badge variant="secondary">
                            {set.topicName}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* 底部：截止日期和提交 */}
        <Card variant="elevated" className="mt-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <DatePicker date={dueDate} onChange={setDueDate} />

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
                      {" "}({selectedStudents.size * selectedPracticeSets.size} total)
                    </span>
                  )}
                </div>
                
                <Button
                  size="md"
                  onClick={handleAssign}
                  disabled={submitting || selectedStudents.size === 0 || selectedPracticeSets.size === 0}
                  className="min-w-[120px]"
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
          </div>
        </Card>
      </div>
    </main>
  );
}
