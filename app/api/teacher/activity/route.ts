import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import type { ActivityEventWithStudent } from "@/lib/teacher/types";
import {
  mapAssignmentToActivityEventWithStudent,
  mapAttemptToActivityEventWithStudent,
} from "@/lib/teacher/mappers";

/**
 * GET /api/teacher/activity
 * Returns recent activity across all teacher-owned students
 * Combines assignments and completed attempts, sorted by timestamp descending
 * Limited to most recent 50 events
 */
export async function GET() {
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

    // Fetch recent assignments for all teacher's students
    const assignments = await prisma.assignment.findMany({
      where: {
        teacherId: session.teacherId,
      },
      orderBy: {
        assignedAt: "desc",
      },
      take: 50,
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
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

    // Fetch recent completed attempts for all teacher's students
    const attempts = await prisma.practiceAttempt.findMany({
      where: {
        completedAt: { not: null },
        student: {
          teacherId: session.teacherId,
        },
      },
      orderBy: {
        completedAt: "desc",
      },
      take: 50,
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
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

    // Map assignments to activity events using shared mapper
    const assignmentEvents: ActivityEventWithStudent[] = assignments.map(
      mapAssignmentToActivityEventWithStudent
    );

    // Map attempts to activity events using shared mapper
    // Note: completedAt is guaranteed non-null by the where clause
    const attemptEvents: ActivityEventWithStudent[] = attempts.map((attempt) =>
      mapAttemptToActivityEventWithStudent({
        ...attempt,
        completedAt: attempt.completedAt!, // Safe due to where clause filter
      })
    );

    // Merge and sort by timestamp descending
    const events = [...assignmentEvents, ...attemptEvents].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Take only the most recent 50 events
    const limitedEvents = events.slice(0, 50);

    return NextResponse.json({ events: limitedEvents });
  } catch (error) {
    console.error("Error fetching teacher activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
