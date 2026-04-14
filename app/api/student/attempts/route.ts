import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { AttemptType } from "@prisma/client";

/**
 * GET /api/student/attempts
 * Query parameters:
 *   - practiceSetId: Returns the most recent completed attempt for this practice set
 *   - id: Returns a specific attempt by ID (for retry source)
 * Returns the practice attempt for the current student
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const session = await getIronSession<SessionData>(
      cookieStore,
      sessionOptions
    );

    // Check authentication
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Check student role
    if (session.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Student access required" },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const practiceSetId = searchParams.get("practiceSetId");
    const attemptId = searchParams.get("id");

    // Must provide either practiceSetId or id
    if (!practiceSetId && !attemptId) {
      return NextResponse.json(
        { error: "Either practiceSetId or id query parameter is required" },
        { status: 400 }
      );
    }

    // Get student's student record
    const student = await prisma.student.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    let attempt;

    if (attemptId) {
      // Fetch specific attempt by ID (for retry source)
      attempt = await prisma.practiceAttempt.findFirst({
        where: {
          id: attemptId,
          studentId: student.id, // Ensure student owns this attempt
        },
        select: {
          id: true,
          practiceSetId: true,
          attemptType: true,
          score: true,
          correctCount: true,
          totalQuestions: true,
          answers: true,
          wrongItems: true,
          completedAt: true,
          sourceAttemptId: true,
        },
      });
    } else if (practiceSetId) {
      // Fetch the most recent completed attempt for this practice set
      attempt = await prisma.practiceAttempt.findFirst({
        where: {
          studentId: student.id,
          practiceSetId,
          completedAt: { not: null },
        },
        orderBy: {
          completedAt: "desc",
        },
        select: {
          id: true,
          practiceSetId: true,
          attemptType: true,
          score: true,
          correctCount: true,
          totalQuestions: true,
          answers: true,
          wrongItems: true,
          completedAt: true,
          sourceAttemptId: true,
        },
      });
    }

    if (!attempt) {
      return NextResponse.json(
        { error: "Attempt not found" },
        { status: 404 }
      );
    }

    // Parse JSON fields
    let wrongItems = [];
    try {
      if (attempt.wrongItems) {
        wrongItems = JSON.parse(attempt.wrongItems);
      }
    } catch {
      wrongItems = [];
    }

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        practiceSetId: attempt.practiceSetId,
        attemptType: attempt.attemptType,
        score: attempt.score,
        correctCount: attempt.correctCount,
        totalQuestions: attempt.totalQuestions,
        answers: JSON.parse(attempt.answers),
        wrongItems,
        completedAt: attempt.completedAt?.toISOString(),
        sourceAttemptId: attempt.sourceAttemptId,
      },
    });
  } catch (error) {
    console.error("Error fetching practice attempt:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/student/attempts
 * Saves a practice attempt to the database (student-only)
 * Called when a student completes a practice set or retry
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const session = await getIronSession<SessionData>(
      cookieStore,
      sessionOptions
    );

    // Check authentication
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Check student role
    if (session.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Student access required" },
        { status: 403 }
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Validate input
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body is required" },
        { status: 400 }
      );
    }

    const {
      practiceSetId,
      attemptType,
      correctCount,
      totalQuestions,
      answers,
      wrongItemIds,
      assignmentId,
      sourceAttemptId,
    } = body as {
      practiceSetId?: string;
      attemptType?: string;
      correctCount?: number;
      totalQuestions?: number;
      answers?: Record<string, { selectedWords: string[]; isCorrect: boolean; timeSpent?: number }>;
      wrongItemIds?: string[];
      assignmentId?: string | null;
      sourceAttemptId?: string | null;
    };

    // Validate required fields
    if (!practiceSetId || typeof practiceSetId !== "string") {
      return NextResponse.json(
        { error: "practiceSetId is required" },
        { status: 400 }
      );
    }

    if (!attemptType || !["full_attempt", "retry_attempt"].includes(attemptType)) {
      return NextResponse.json(
        { error: "attemptType must be 'full_attempt' or 'retry_attempt'" },
        { status: 400 }
      );
    }

    if (typeof correctCount !== "number" || correctCount < 0) {
      return NextResponse.json(
        { error: "correctCount must be a non-negative number" },
        { status: 400 }
      );
    }

    if (typeof totalQuestions !== "number" || totalQuestions <= 0) {
      return NextResponse.json(
        { error: "totalQuestions must be a positive number" },
        { status: 400 }
      );
    }

    // Get student's student record
    const student = await prisma.student.findUnique({
      where: { userId: session.userId },
      select: { id: true, teacherId: true },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    // Calculate percentage score
    const score = Math.round((correctCount / totalQuestions) * 100);

    // Prepare wrongItems JSON (fetch full question data if wrongItemIds provided)
    let wrongItems: unknown[] = [];
    if (wrongItemIds && Array.isArray(wrongItemIds) && wrongItemIds.length > 0) {
      // Fetch the actual question data from practice set
      const practiceSet = await prisma.practiceSet.findUnique({
        where: { id: practiceSetId },
        select: { questions: true },
      });

      if (practiceSet) {
        try {
          const questionIds = JSON.parse(practiceSet.questions) as string[];
          // Get question details from SampleItem
          const sampleItems = await prisma.sampleItem.findMany({
            where: {
              id: { in: wrongItemIds },
            },
            select: {
              id: true,
              title: true,
              context: true,
              wordBank: true,
              correctAnswer: true,
              hint: true,
              explanation: true,
            },
          });
          wrongItems = sampleItems.map(item => ({
            id: item.id,
            title: item.title,
            context: item.context,
            wordBank: JSON.parse(item.wordBank),
            correctAnswer: JSON.parse(item.correctAnswer),
            hint: item.hint,
            explanation: item.explanation,
          }));
        } catch {
          // If parsing fails, use empty array
          wrongItems = [];
        }
      }
    }

    // Create the practice attempt
    const attempt = await prisma.practiceAttempt.create({
      data: {
        studentId: student.id,
        practiceSetId,
        assignmentId: assignmentId || null,
        attemptType: attemptType as AttemptType,
        score,
        correctCount,
        totalQuestions,
        answers: answers ? JSON.stringify(answers) : "{}",
        wrongItems: JSON.stringify(wrongItems),
        startedAt: new Date(Date.now() - 5 * 60 * 1000), // Approximate start time (5 mins ago)
        completedAt: new Date(),
        sourceAttemptId: sourceAttemptId || null,
      },
    });

    // If there's an assignment for this practice set, mark it as completed
    if (assignmentId) {
      await prisma.assignment.updateMany({
        where: {
          id: assignmentId,
          studentId: student.id,
          completed: false,
        },
        data: {
          completed: true,
        },
      });
    } else {
      // Try to find and complete any pending assignment for this set
      await prisma.assignment.updateMany({
        where: {
          studentId: student.id,
          practiceSetId,
          completed: false,
        },
        data: {
          completed: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      attempt: {
        id: attempt.id,
        practiceSetId: attempt.practiceSetId,
        attemptType: attempt.attemptType,
        score: attempt.score,
        correctCount: attempt.correctCount,
        totalQuestions: attempt.totalQuestions,
        completedAt: attempt.completedAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error saving practice attempt:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
