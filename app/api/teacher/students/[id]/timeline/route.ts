import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import type { TimelineResponse } from "@/lib/teacher/types";
import {
  mapAssignmentToActivityEvent,
  mapAttemptToActivityEvent,
} from "@/lib/teacher/mappers";

/**
 * GET /api/teacher/students/[id]/timeline
 * Returns a unified activity timeline for a specific student (teacher-only)
 * Combines assignments and completed attempts, sorted by timestamp descending
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

    // Verify student exists and belongs to this teacher
    const student = await prisma.student.findFirst({
      where: {
        id,
        teacherId: session.teacherId,
      },
      select: {
        id: true,
        user: {
          select: {
            name: true,
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

    // Fetch assignments for this student
    const assignments = await prisma.assignment.findMany({
      where: {
        studentId: id,
        teacherId: session.teacherId,
      },
      orderBy: {
        assignedAt: "desc",
      },
      include: {
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
    });

    // Fetch completed attempts for this student
    const attempts = await prisma.practiceAttempt.findMany({
      where: {
        studentId: id,
        completedAt: { not: null },
      },
      orderBy: {
        completedAt: "desc",
      },
      include: {
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
    });

    // Map assignments to timeline events
    const assignmentEvents = assignments.map(mapAssignmentToActivityEvent);

    // Map attempts to timeline events
    // Note: completedAt is guaranteed non-null by the where clause
    const attemptEvents = attempts.map((attempt) =>
      mapAttemptToActivityEvent({
        ...attempt,
        completedAt: attempt.completedAt!, // Safe due to where clause filter
      })
    );

    // Merge and sort by timestamp descending
    const events = [...assignmentEvents, ...attemptEvents].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const response: TimelineResponse = {
      student: {
        id: student.id,
        name: student.user.name,
      },
      events,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching student timeline:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
