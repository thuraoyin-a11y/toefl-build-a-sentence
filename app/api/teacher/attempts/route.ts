import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/teacher/attempts
 * Query parameters:
 *   - practiceSetId: Filter by practice set ID
 * Returns all completed attempts for the teacher's students
 * Ordered by completedAt desc
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

    // Check teacher role
    if (session.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Teacher access required" },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const practiceSetId = searchParams.get("practiceSetId");

    // Get all students for this teacher
    const students = await prisma.student.findMany({
      where: {
        teacherId: session.teacherId,
      },
      select: { id: true },
    });

    const studentIds = students.map(s => s.id);

    if (studentIds.length === 0) {
      return NextResponse.json({ attempts: [] });
    }

    // Build where clause
    const whereClause: {
      studentId: { in: string[] };
      completedAt: { not: null };
      practiceSetId?: string;
    } = {
      studentId: { in: studentIds },
      completedAt: { not: null },
    };

    if (practiceSetId) {
      whereClause.practiceSetId = practiceSetId;
    }

    // Fetch all completed attempts
    const attempts = await prisma.practiceAttempt.findMany({
      where: whereClause,
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
        completedAt: true,
        sourceAttemptId: true,
        student: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        practiceSet: {
          select: {
            title: true,
          },
        },
      },
    });

    // Transform to response shape
    const responseAttempts = attempts.map((attempt) => ({
      id: attempt.id,
      practiceSetId: attempt.practiceSetId,
      practiceSetTitle: attempt.practiceSet.title,
      attemptType: attempt.attemptType,
      score: attempt.score,
      correctCount: attempt.correctCount,
      totalQuestions: attempt.totalQuestions,
      answers: JSON.parse(attempt.answers),
      completedAt: attempt.completedAt?.toISOString(),
      sourceAttemptId: attempt.sourceAttemptId,
      studentId: attempt.student.id,
      studentName: attempt.student.user.name,
    }));

    return NextResponse.json({ attempts: responseAttempts });
  } catch (error) {
    console.error("Error fetching teacher attempts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
