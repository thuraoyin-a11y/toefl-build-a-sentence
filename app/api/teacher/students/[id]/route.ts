import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import type { StudentDetail } from "@/lib/teacher/types";
import {
  mapAssignmentToResponse,
  mapAttemptToResponse,
} from "@/lib/teacher/mappers";

/**
 * GET /api/teacher/students/[id]
 * Returns enriched detail for a single student (teacher-only)
 * Includes aggregates, recent assignments, and recent attempts
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Find the student belonging to this teacher with all necessary data
    const student = await prisma.student.findFirst({
      where: {
        id,
        teacherId: session.teacherId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        assignments: {
          select: {
            id: true,
            practiceSetId: true,
            assignedAt: true,
            dueDate: true,
            completed: true,
            practiceSet: {
              select: {
                id: true,
                title: true,
                topic: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            assignedAt: "desc",
          },
          take: 10,
        },
        attempts: {
          where: {
            completedAt: { not: null },
          },
          select: {
            id: true,
            practiceSetId: true,
            attemptType: true,
            score: true,
            correctCount: true,
            totalQuestions: true,
            completedAt: true,
            practiceSet: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: {
            completedAt: "desc",
          },
          take: 10,
        },
        _count: {
          select: {
            assignments: true,
            attempts: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Calculate aggregates
    const totalAssignments = student._count.assignments;
    const completedAssignments = student.assignments.filter((a) => a.completed).length;
    const pendingAssignments = totalAssignments - completedAssignments;
    const totalAttempts = student._count.attempts;
    const lastActiveAt = student.attempts[0]?.completedAt?.toISOString() ?? null;

    // Transform recent assignments and attempts using shared mappers
    const recentAssignments = student.assignments.map(mapAssignmentToResponse);
    // Note: completedAt is guaranteed non-null by the where clause
    const recentAttempts = student.attempts.map((attempt) =>
      mapAttemptToResponse({
        ...attempt,
        completedAt: attempt.completedAt!, // Safe due to where clause filter
      })
    );

    const response: { student: StudentDetail } = {
      student: {
        id: student.id,
        name: student.user.name,
        email: student.user.email,
        isActive: student.isActive,
        dailyGoal: student.dailyGoal,
        createdAt: student.createdAt.toISOString(),
        aggregates: {
          totalAssignments,
          completedAssignments,
          pendingAssignments,
          totalAttempts,
          lastActiveAt,
        },
        recentAssignments,
        recentAttempts,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/teacher/students/[id]
 * Updates a student's isActive status (teacher-only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

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

    const { isActive } = body as Record<string, unknown>;

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "isActive boolean is required" },
        { status: 400 }
      );
    }

    // Find the student belonging to this teacher
    const existingStudent = await prisma.student.findFirst({
      where: {
        id,
        teacherId: session.teacherId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!existingStudent) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Update isActive
    const updatedStudent = await prisma.student.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json({
      student: {
        id: updatedStudent.id,
        name: existingStudent.user.name,
        email: existingStudent.user.email,
        isActive: updatedStudent.isActive,
      },
    });
  } catch (error) {
    console.error("Error updating student:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
