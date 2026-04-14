import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { mapAttemptToResponse } from "@/lib/teacher/mappers";

/**
 * GET /api/teacher/students/[id]/attempts
 * Returns all completed attempts for a specific student (teacher-only)
 * Ordered by completedAt desc
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
      select: { id: true },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Fetch all completed attempts for this student
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
                name: true,
              },
            },
          },
        },
      },
    });

    // Transform to response shape using shared mapper
    // Note: completedAt is guaranteed non-null by the where clause
    const responseAttempts = attempts.map((attempt) =>
      mapAttemptToResponse({
        ...attempt,
        completedAt: attempt.completedAt!, // Safe due to where clause filter
      })
    );

    return NextResponse.json({ attempts: responseAttempts });
  } catch (error) {
    console.error("Error fetching student attempts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
