"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TeacherConfig, PracticeSet } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Check, Save, RotateCcw, Eye, ChevronRight, Clock, CheckCircle2, XCircle, Trash2, Users, Loader2 } from "lucide-react";
import { SetResultDetail } from "./SetResultDetail";

interface Student {
  id: string;
  name: string;
  email: string;
  attemptCount: number;
}

interface StudentAttempt {
  id: string;
  practiceSetId: string;
  attemptType: string;
  correctCount: number;
  totalQuestions: number;
  score: number;
  completedAt: string;
}

const CONFIG_STORAGE_KEY = "teacher-config";

interface TeacherConfigClientProps {
  initialConfig: TeacherConfig;
}

/**
 * TeacherConfigClient
 * V2 Architecture: Fetches practice sets and student attempts from API
 */
export default function TeacherConfigClient({
  initialConfig,
}: TeacherConfigClientProps) {
  const router = useRouter();
  const [config, setConfig] = useState<TeacherConfig>(initialConfig);
  const [saved, setSaved] = useState(false);
  const [practiceSets, setPracticeSets] = useState<PracticeSet[]>([]);
  const [studentAttempts, setStudentAttempts] = useState<Record<string, StudentAttempt>>({});
  const [selectedSetId, setSelectedSetId] = useState<string>("");
  const [selectedSetTitle, setSelectedSetTitle] = useState<string>("");
  
  // Student data management states
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearMessage, setClearMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount (config only)
  useEffect(() => {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setConfig(parsed);
      } catch {
        // Use initial config if parse fails
      }
    }
  }, []);

  // Fetch practice sets and student attempts on mount
  useEffect(() => {
    loadData();
  }, []);

  // Fetch students list on mount
  useEffect(() => {
    fetchStudents();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Fetch practice sets
      const setsRes = await fetch("/api/practice-sets");
      if (setsRes.ok) {
        const setsData = await setsRes.json();
        setPracticeSets(setsData.practiceSets || []);
      }

      // Fetch student attempts
      const attemptsRes = await fetch("/api/teacher/attempts");
      if (attemptsRes.ok) {
        const attemptsData = await attemptsRes.json();
        // Convert to record keyed by practiceSetId (latest attempt per set)
        const attemptsRecord: Record<string, StudentAttempt> = {};
        (attemptsData.attempts || []).forEach((attempt: StudentAttempt) => {
          // Keep the most recent attempt for each set
          const existing = attemptsRecord[attempt.practiceSetId];
          if (!existing || new Date(attempt.completedAt) > new Date(existing.completedAt)) {
            attemptsRecord[attempt.practiceSetId] = attempt;
          }
        });
        setStudentAttempts(attemptsRecord);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const res = await fetch("/api/teacher/students");
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch (err) {
      console.error("Failed to fetch students:", err);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  // Get completion status for each set
  const getSetCompletionStatus = (setId: string) => {
    return !!studentAttempts[setId];
  };

  const handleToggleSet = (setId: string) => {
    setConfig((prev) => {
      const isAssigned = prev.assignedSetIds.includes(setId);
      const newAssignedSetIds = isAssigned
        ? prev.assignedSetIds.filter((id) => id !== setId)
        : [...prev.assignedSetIds, setId];
      return {
        ...prev,
        assignedSetIds: newAssignedSetIds,
      };
    });
    setSaved(false);
  };

  const handleChangeDailyRequired = (value: number) => {
    setConfig((prev) => ({
      ...prev,
      dailyRequiredSets: Math.max(1, Math.min(value, practiceSets.length || 10)),
    }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (confirm("Reset to default configuration?")) {
      const defaultConfig: TeacherConfig = {
        dailyRequiredSets: 2,
        assignedSetIds: practiceSets.slice(0, 3).map(s => s.id),
      };
      setConfig(defaultConfig);
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(defaultConfig));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleClearProgress = () => {
    if (confirm("Clear all local practice records? This will delete all records from localStorage only.")) {
      localStorage.removeItem("practice-records");
      window.location.reload();
    }
  };

  const handleClearStudentProgress = async () => {
    if (!selectedStudentId) {
      alert("Please select a student first");
      return;
    }

    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return;

    if (!confirm(`Clear all progress for ${student.name}? This will delete all practice attempts and reset assignments. This action cannot be undone.`)) {
      return;
    }

    setIsClearing(true);
    setClearMessage(null);

    try {
      const res = await fetch(`/api/teacher/students/${selectedStudentId}/progress`, {
        method: "DELETE",
      });

      if (res.ok) {
        const data = await res.json();
        setClearMessage(`Successfully cleared ${student.name}'s progress (${data.deletedAttempts} attempts deleted, ${data.resetAssignments} assignments reset)`);
        fetchStudents();
        setSelectedStudentId("");
        // Reload attempts data
        loadData();
      } else {
        const error = await res.json();
        setClearMessage(`Error: ${error.error || "Failed to clear progress"}`);
      }
    } catch (err) {
      setClearMessage("Error: Failed to clear progress");
    } finally {
      setIsClearing(false);
    }
  };

  // Calculate stats
  const completedCount = config.assignedSetIds.filter((id) =>
    getSetCompletionStatus(id)
  ).length;

  // Handle viewing set result details
  const handleViewResult = (setId: string, setTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSetId(setId);
    setSelectedSetTitle(setTitle);
  };

  // Close detail modal
  const handleCloseDetail = () => {
    setSelectedSetId("");
    setSelectedSetTitle("");
  };

  // Get assigned sets with their attempts
  const assignedSetsWithAttempts = config.assignedSetIds
    .map((setId) => {
      const set = practiceSets.find((s) => s.id === setId);
      const attempt = studentAttempts[setId];
      return { set, attempt };
    })
    .filter((item) => item.set !== undefined)
    .map((item) => ({ set: item.set!, attempt: item.attempt }));

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-apple-blue mb-4" />
        <p className="text-apple-text-secondary">Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header - Apple style */}
      <div className="text-center space-y-2">
        <h1 className="text-display-section text-apple-text">
          Practice Configuration
        </h1>
        <p className="text-body text-apple-text-secondary">
          Assign practice sets and set daily goals for your student
        </p>
      </div>

      {/* Daily Goal Section - Apple style */}
      <Card variant="outlined" className="p-6 space-y-5 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-display-sub text-apple-text">Daily Goal</h2>
            <p className="text-caption text-apple-text-secondary mt-1">
              How many sets should the student complete today?
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={practiceSets.length || 10}
              value={config.dailyRequiredSets}
              onChange={(e) => handleChangeDailyRequired(parseInt(e.target.value) || 1)}
              className="w-20 px-3 py-2 text-center text-body-emphasis text-apple-text bg-apple-gray border-0 rounded-apple focus:outline-none focus:ring-2 focus:ring-apple-blue"
            />
            <span className="text-body text-apple-text-secondary">sets</span>
          </div>
        </div>

        {/* Progress preview - Apple style */}
        <div className="bg-apple-gray rounded-apple p-4">
          <div className="flex items-center justify-between text-caption mb-3">
            <span className="text-apple-text-secondary">Completion Preview</span>
            <span className="text-body-emphasis text-apple-text">
              {completedCount} / {config.dailyRequiredSets} completed
            </span>
          </div>
          <div className="w-full h-2 bg-white rounded-full overflow-hidden">
            <div
              className="h-full bg-apple-blue rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(
                  100,
                  (completedCount / config.dailyRequiredSets) * 100
                )}%`,
              }}
            />
          </div>
        </div>
      </Card>

      {/* Assigned Sets Section - Apple style */}
      <Card variant="outlined" className="p-6 space-y-5 bg-white">
        <div>
          <h2 className="text-display-sub text-apple-text">
            Assigned Practice Sets
          </h2>
          <p className="text-caption text-apple-text-secondary mt-1">
            Select which sets the student can access today
          </p>
        </div>

        <div className="space-y-3">
          {practiceSets.map((set) => {
            const isAssigned = config.assignedSetIds.includes(set.id);
            const isCompleted = getSetCompletionStatus(set.id);

            return (
              <div
                key={set.id}
                onClick={() => handleToggleSet(set.id)}
                className={`
                  flex items-center justify-between p-4 rounded-apple cursor-pointer transition-all duration-200
                  ${
                    isAssigned
                      ? "bg-apple-blue/5 border border-apple-blue"
                      : "bg-white border border-apple-border hover:border-apple-text-tertiary"
                  }
                `}
              >
                <div className="flex items-center gap-4">
                  {/* Checkbox - Apple style */}
                  <div
                    className={`
                      w-6 h-6 rounded-apple-sm border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0
                      ${
                        isAssigned
                          ? "border-apple-blue bg-apple-blue"
                          : "border-apple-border bg-white"
                      }
                    `}
                  >
                    {isAssigned && <Check className="w-4 h-4 text-white" />}
                  </div>

                  {/* Set info */}
                  <div>
                    <h3 className="text-body-emphasis text-apple-text">{set.title}</h3>
                    <p className="text-caption text-apple-text-secondary">{set.description}</p>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      set.difficulty === "easy"
                        ? "success"
                        : set.difficulty === "medium"
                        ? "warning"
                        : "default"
                    }
                    size="sm"
                  >
                    {set.difficulty}
                  </Badge>
                  {isCompleted && (
                    <Badge variant="success" size="sm">
                      Completed
                    </Badge>
                  )}
                  {!isAssigned && (
                    <Badge variant="neutral" size="sm">
                      Hidden
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between pt-4 border-t border-apple-border">
          <span className="text-caption text-apple-text-secondary">
            {config.assignedSetIds.length} sets assigned
          </span>
          <span className="text-caption text-apple-text-secondary">
            {completedCount} completed
          </span>
        </div>
      </Card>

      {/* Actions - Apple style */}
      <div className="flex items-center gap-3">
        <Button
          variant="primary"
          size="md"
          onClick={handleSave}
          className="flex-1"
        >
          <Save className="w-4 h-4 mr-2" />
          {saved ? "Saved!" : "Save Configuration"}
        </Button>
        <Button
          variant="secondary"
          size="md"
          onClick={handleReset}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      {/* Results Overview Section - Apple style */}
      {assignedSetsWithAttempts.length > 0 && (
        <Card variant="outlined" className="p-6 space-y-5 bg-white">
          <div>
            <h2 className="text-display-sub text-apple-text">
              Student Results
            </h2>
            <p className="text-caption text-apple-text-secondary mt-1">
              View completion status and performance for assigned sets
            </p>
          </div>

          <div className="space-y-3">
            {assignedSetsWithAttempts.map(({ set, attempt }) => {
              const isCompleted = !!attempt;

              return (
                <div
                  key={set.id}
                  className={`
                    flex items-center justify-between p-4 rounded-apple transition-all duration-200
                    ${isCompleted 
                      ? "bg-white border border-apple-border" 
                      : "bg-apple-gray border border-transparent"
                    }
                  `}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Status icon - Apple style */}
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                      ${isCompleted 
                        ? (attempt?.score || 0) >= 80 
                          ? "bg-apple-success/10 text-apple-success"
                          : (attempt?.score || 0) >= 60
                            ? "bg-apple-blue/10 text-apple-blue"
                            : "bg-apple-warning/10 text-apple-warning"
                        : "bg-apple-gray text-apple-text-tertiary"
                      }
                    `}>
                      {isCompleted ? (
                        attempt && attempt.score >= 60 ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <XCircle className="w-5 h-5" />
                        )
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>

                    {/* Set info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-body-emphasis text-apple-text">{set.title}</h3>
                        <Badge
                          variant={
                            set.difficulty === "easy"
                              ? "success"
                              : set.difficulty === "medium"
                              ? "warning"
                              : "default"
                          }
                          size="sm"
                        >
                          {set.difficulty}
                        </Badge>
                      </div>
                      
                      {isCompleted && attempt ? (
                        <div className="flex items-center gap-3 text-caption flex-wrap">
                          <span className="text-apple-text-secondary">
                            <span className="text-body-emphasis">{attempt.score}%</span> correct
                          </span>
                          <span className="text-apple-border">|</span>
                          <span className="text-apple-text-secondary">
                            {new Date(attempt.completedAt).toLocaleDateString()}
                          </span>
                          <span className="text-apple-border">|</span>
                          <span className={`
                            ${attempt.score >= 80 ? "text-apple-success" : 
                              attempt.score >= 60 ? "text-apple-blue" : "text-apple-warning"}
                          `}>
                            {attempt.correctCount}/{attempt.totalQuestions} correct
                          </span>
                        </div>
                      ) : (
                        <p className="text-caption text-apple-text-tertiary">Not completed yet</p>
                      )}
                    </div>
                  </div>

                  {/* View button - Apple style */}
                  {isCompleted && attempt && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleViewResult(set.id, set.title, e)}
                      className="flex-shrink-0"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between pt-4 border-t border-apple-border">
            <span className="text-caption text-apple-text-secondary">
              {assignedSetsWithAttempts.filter(({ attempt }) => attempt).length} completed
            </span>
            <span className="text-caption text-apple-text-secondary">
              {assignedSetsWithAttempts.length} assigned
            </span>
          </div>
        </Card>
      )}

      {/* Data Management Section - Apple style */}
      <Card variant="outlined" className="p-6 space-y-5 bg-white border-red-200">
        <div>
          <h2 className="text-display-sub text-apple-text flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            Data Management
          </h2>
          <p className="text-caption text-apple-text-secondary mt-1">
            Clear student practice records and progress
          </p>
        </div>

        {/* Clear Specific Student Progress - Apple style */}
        <div className="p-4 bg-apple-gray rounded-apple space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-apple-text-secondary" />
            <p className="text-body-emphasis text-apple-text">Clear Specific Student Progress</p>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              disabled={isLoadingStudents}
              className="flex-1 px-3 py-2 bg-white border border-apple-border rounded-apple text-caption text-apple-text focus:outline-none focus:ring-2 focus:ring-apple-blue disabled:opacity-50"
            >
              <option value="">{isLoadingStudents ? "Loading students..." : "Select a student..."}</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.email}) - {student.attemptCount} attempts
                </option>
              ))}
            </select>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleClearStudentProgress}
              disabled={!selectedStudentId || isClearing}
              className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200 disabled:opacity-50 whitespace-nowrap"
            >
              {isClearing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Clear
            </Button>
          </div>
          
          {clearMessage && (
            <p className={`text-caption ${clearMessage.startsWith("Error") ? "text-red-600" : "text-apple-success"}`}>
              {clearMessage}
            </p>
          )}
        </div>

        {/* Clear All Local Records - Apple style */}
        <div className="flex items-center justify-between p-4 bg-apple-gray rounded-apple">
          <div>
            <p className="text-body-emphasis text-apple-text">Clear Local Records</p>
            <p className="text-caption text-apple-text-secondary">
              Clear legacy localStorage records (if any)
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClearProgress}
            className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </Card>

      {/* Back to student view - Apple style link */}
      <button
        onClick={() => router.push("/")}
        className="w-full text-center text-link text-apple-link hover:underline py-2"
      >
        ← Back to Student View
      </button>

      {/* Result Detail Modal */}
      <SetResultDetail
        isOpen={!!selectedSetId}
        onClose={handleCloseDetail}
        setTitle={selectedSetTitle}
        setId={selectedSetId}
      />
    </div>
  );
}
