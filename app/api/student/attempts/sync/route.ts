import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/student/attempts/sync
 * Returns the count of attempts for the current student
 * Used by student page to sync localStorage with server state
 */
export async function GET(_request: NextRequest) {
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

    // Count attempts for this student
    const attemptCount = await prisma.practiceAttempt.count({
      where: {
        studentId: student.id,
        completedAt: { not: null },
      },
    });

    return NextResponse.json({
      attemptCount,
      synced: true,
    });
  } catch (error) {
    console.error("Error syncing student attempts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
