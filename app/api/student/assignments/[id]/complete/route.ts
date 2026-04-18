import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions, isStudent, hasStaleSessionId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/student/assignments/[id]/complete
 * Marks an assignment as completed (student-only)
 */
export async function POST(
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

    // Check student role
    if (!isStudent(session)) {
      return NextResponse.json(
        { error: "Student access required" },
        { status: 403 }
      );
    }

    // Detect stale sessions with hardcoded demo IDs and force re-login
    if (hasStaleSessionId(session)) {
      return NextResponse.json(
        { error: "Session expired. Please log in again." },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Find the assignment belonging to this student
    const assignment = await prisma.assignment.findFirst({
      where: {
        id,
        studentId: session.studentId,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Update completed to true (idempotent - no error if already true)
    const updatedAssignment = await prisma.assignment.update({
      where: { id },
      data: { completed: true },
    });

    return NextResponse.json({
      assignment: {
        id: updatedAssignment.id,
        completed: updatedAssignment.completed,
      },
    });
  } catch (error) {
    console.error("Error completing assignment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
