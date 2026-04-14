import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions, isStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/student/assignments/[id]
 * Returns minimal detail for a single assignment (student-only)
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

    // Check student role
    if (!isStudent(session)) {
      return NextResponse.json(
        { error: "Student access required" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Find the assignment belonging to this student
    const assignment = await prisma.assignment.findFirst({
      where: {
        id,
        studentId: session.studentId,
      },
      include: {
        practiceSet: {
          select: {
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

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      assignment: {
        id: assignment.id,
        practiceSetId: assignment.practiceSetId,
        practiceSetTitle: assignment.practiceSet.title,
        topicId: assignment.practiceSet.topic?.id ?? null,
        topicName: assignment.practiceSet.topic?.name ?? null,
        assignedAt: assignment.assignedAt.toISOString(),
        dueDate: assignment.dueDate?.toISOString() ?? null,
        completed: assignment.completed,
      },
    });
  } catch (error) {
    console.error("Error fetching assignment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
