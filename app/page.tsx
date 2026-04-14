"use client";

import { useState, useEffect } from "react";
import { Container } from "@/components/layout/Container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PracticeSet } from "@/lib/types";
import { BookOpen, CheckCircle2, ArrowRight, Target, Settings, RefreshCw } from "lucide-react";
import Link from "next/link";

interface Assignment {
  id: string;
  practiceSetId: string;
  practiceSetTitle: string;
  assignedAt: string;
  dueDate: string | null;
  completed: boolean;
  practiceSet: PracticeSet;
}

interface AttemptSummary {
  practiceSetId: string;
  hasAttempt: boolean;
  correctCount?: number;
  totalQuestions?: number;
  percentage?: number;
  hasWrongAnswers?: boolean;
  attemptId?: string;
}

/**
 * Get status badge variant
 */
function getStatusBadge(completed: boolean) {
  if (completed) {
    return { variant: "success" as const, label: "Completed", icon: CheckCircle2 };
  }
  return { variant: "neutral" as const, label: "Not Started", icon: BookOpen };
}

/**
 * Get difficulty badge
 */
function getDifficultyBadge(difficulty: string) {
  switch (difficulty) {
    case "easy":
      return { variant: "success" as const, label: "Easy" };
    case "medium":
      return { variant: "warning" as const, label: "Medium" };
    case "hard":
      return { variant: "default" as const, label: "Hard" };
    default:
      return { variant: "neutral" as const, label: difficulty };
  }
}

/**
 * Practice set card component - Apple style
 */
function PracticeSetCard({ 
  set, 
  assignmentId,
  attemptSummary,
  isLoading 
}: { 
  set: PracticeSet; 
  assignmentId?: string;
  attemptSummary?: AttemptSummary;
  isLoading: boolean;
}) {
  const completed = attemptSummary?.hasAttempt ?? false;
  const statusBadge = getStatusBadge(completed);
  const difficultyBadge = getDifficultyBadge(set.difficulty);
  const StatusIcon = statusBadge.icon;
  
  const hasWrongAnswers = attemptSummary?.hasWrongAnswers ?? false;
  const correctCount = attemptSummary?.correctCount ?? 0;
  const totalQuestions = attemptSummary?.totalQuestions ?? 10;
  const attemptId = attemptSummary?.attemptId;

  const practiceLink = assignmentId 
    ? `/practice/${set.id}?assignment=${assignmentId}`
    : `/practice/${set.id}`;

  return (
    <Card variant="outlined" className="group bg-white">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="truncate">{set.title}</CardTitle>
            <CardDescription className="line-clamp-2">
              {set.description}
            </CardDescription>
          </div>
          <Badge variant={statusBadge.variant}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusBadge.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Badge variant={difficultyBadge.variant} size="sm">
            {difficultyBadge.label}
          </Badge>
          <span className="text-caption text-apple-text-tertiary">
            10 questions
          </span>
          {completed && (
            <span className="text-caption text-apple-success font-normal ml-auto">
              {correctCount}/{totalQuestions} correct
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter>
        {completed && hasWrongAnswers && attemptId ? (
          <div className="flex gap-3 w-full">
            <Link href={practiceLink} className="flex-1">
              <Button variant="secondary" size="md" className="w-full" disabled={isLoading}>
                Practice Again
              </Button>
            </Link>
            <Link href={`/retry/${set.id}?source=${attemptId}`} className="flex-1">
              <Button 
                variant="primary" 
                size="md" 
                className="w-full bg-apple-warning hover:bg-apple-warning/90" 
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Mistakes
              </Button>
            </Link>
          </div>
        ) : (
          <Link href={practiceLink} className="w-full">
            <Button variant="primary" size="md" className="w-full" disabled={isLoading}>
              {completed ? "Practice Again" : "Start Practice"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}

/**
 * Welcome section with daily goal - Apple style
 */
function WelcomeSection({ dailyRequired, completedCount, studentName }: { dailyRequired: number; completedCount: number; studentName: string }) {
  const progress = Math.min(100, Math.round((completedCount / dailyRequired) * 100));
  const isGoalComplete = completedCount >= dailyRequired;

  return (
    <div className="mb-12">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-display-section text-apple-text mb-2">
            Welcome back, {studentName}
          </h1>
          <p className="text-body text-apple-text-secondary">
            Complete practice sets to improve your sentence building skills.
          </p>
        </div>
        <Link href="/teacher">
          <Button variant="secondary" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Config
          </Button>
        </Link>
      </div>
      
      {/* Daily Goal Card - Apple style */}
      <Card variant="outlined" className={isGoalComplete ? "bg-apple-success/5" : "bg-apple-blue/5"}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-apple-text-secondary" />
                <p className="text-micro text-apple-text-secondary uppercase tracking-wide">
                  Today&apos;s Goal
                </p>
              </div>
              <p className="text-display-tile text-apple-text">
                {completedCount} <span className="text-apple-text-secondary text-display-sub">/ {dailyRequired} sets</span>
              </p>
            </div>
            <div className={`h-16 w-16 rounded-full bg-white apple-card-shadow flex items-center justify-center ${isGoalComplete ? "text-apple-success" : "text-apple-blue"}`}>
              <span className="text-body-emphasis">{progress}%</span>
            </div>
          </div>
          <div className="h-2 bg-white rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isGoalComplete ? "bg-apple-success" : "bg-apple-blue"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          {isGoalComplete && (
            <p className="mt-4 text-caption text-apple-success font-normal">
              Great job! You&apos;ve completed today&apos;s goal!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Student Home Page - Apple style
 * V2 Architecture: All data loaded from API, no localStorage
 */
export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentMap, setAssignmentMap] = useState<Map<string, string>>(new Map());
  const [attemptSummaries, setAttemptSummaries] = useState<Map<string, AttemptSummary>>(new Map());
  const [studentName, setStudentName] = useState<string>("Student");
  const [dailyRequired, setDailyRequired] = useState<number>(2); // Default value

  useEffect(() => {
    // Fetch user info
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Failed to fetch user info");
      })
      .then((data) => {
        if (data.user?.name) {
          setStudentName(data.user.name);
        }
      })
      .catch((err) => {
        console.error("Error fetching user info:", err);
      });
    
    // Fetch assignments
    fetch("/api/student/assignments")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Failed to fetch assignments");
      })
      .then(async (data) => {
        const assignmentList: Assignment[] = data.assignments || [];
        setAssignments(assignmentList);
        
        // Build assignment map (practiceSetId -> assignmentId for uncompleted assignments)
        const map = new Map<string, string>();
        for (const assignment of assignmentList) {
          if (!assignment.completed && !map.has(assignment.practiceSetId)) {
            map.set(assignment.practiceSetId, assignment.id);
          }
        }
        setAssignmentMap(map);

        // Fetch attempt summaries for all assigned practice sets
        const summaries = new Map<string, AttemptSummary>();
        for (const assignment of assignmentList) {
          try {
            const res = await fetch(`/api/student/attempts?practiceSetId=${assignment.practiceSetId}`);
            if (res.ok) {
              const data = await res.json();
              if (data.attempt) {
                const attempt = data.attempt;
                const answers = attempt.answers || {};
                const wrongAnswers = Object.entries(answers).filter(([, ans]: [string, unknown]) => {
                  const answer = ans as { isCorrect: boolean };
                  return !answer.isCorrect;
                });
                
                summaries.set(assignment.practiceSetId, {
                  practiceSetId: assignment.practiceSetId,
                  hasAttempt: true,
                  correctCount: attempt.correctCount,
                  totalQuestions: attempt.totalQuestions,
                  percentage: attempt.score,
                  hasWrongAnswers: wrongAnswers.length > 0,
                  attemptId: attempt.id,
                });
              } else {
                summaries.set(assignment.practiceSetId, {
                  practiceSetId: assignment.practiceSetId,
                  hasAttempt: false,
                });
              }
            }
          } catch (err) {
            console.error(`Error fetching attempt for ${assignment.practiceSetId}:`, err);
            summaries.set(assignment.practiceSetId, {
              practiceSetId: assignment.practiceSetId,
              hasAttempt: false,
            });
          }
        }
        setAttemptSummaries(summaries);
      })
      .catch((err) => {
        console.error("Error fetching assignments:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });

    // Fetch teacher config for daily goal
    // For now, use default value. In Phase 5, this will come from API
    setDailyRequired(2);
  }, []);

  const assignedSetsMap = new Map<string, PracticeSet>();
  for (const assignment of assignments) {
    if (!assignedSetsMap.has(assignment.practiceSetId)) {
      assignedSetsMap.set(assignment.practiceSetId, assignment.practiceSet);
    }
  }
  const assignedSets = Array.from(assignedSetsMap.values());
  
  const displayedSets = assignedSets.length > 0 
    ? assignedSets 
    : [];
  
  // Count completed sets (based on attempt data from API)
  const completedCount = Array.from(attemptSummaries.values()).filter(s => s.hasAttempt).length;

  if (isLoading) {
    return (
      <Container size="md">
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-body text-apple-text-secondary">Loading...</div>
        </div>
      </Container>
    );
  }

  return (
    <Container size="apple">
      <WelcomeSection dailyRequired={dailyRequired} completedCount={completedCount} studentName={studentName} />
      
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-display-sub text-apple-text">
            Today&apos;s Practice Sets
          </h2>
          <div className="flex items-center gap-6 text-caption">
            <span className="text-apple-text-secondary">
              <span className="text-apple-success font-normal">{completedCount}</span> completed
            </span>
            <span className="text-apple-text-secondary">
              <span className="text-apple-blue font-normal">{displayedSets.length - completedCount}</span> remaining
            </span>
          </div>
        </div>
        
        {displayedSets.length === 0 ? (
          <Card variant="outlined" className="p-8 text-center bg-white">
            <p className="text-body text-apple-text-secondary mb-5">
              No practice sets have been assigned yet.
            </p>
            <Link href="/teacher">
              <Button variant="primary" size="md">Go to Teacher Config</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4">
            {displayedSets.map((set) => (
              <PracticeSetCard 
                key={set.id} 
                set={set} 
                assignmentId={assignmentMap.get(set.id)}
                attemptSummary={attemptSummaries.get(set.id)}
                isLoading={isLoading}
              />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
