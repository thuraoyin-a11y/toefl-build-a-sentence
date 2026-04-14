import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions, isStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/student/assignments
 * Returns list of assignments assigned to the current logged-in student
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

    // Check student role
    if (!isStudent(session)) {
      return NextResponse.json(
        { error: "Student access required" },
        { status: 403 }
      );
    }

    // Fetch assignments belonging to this student
    const assignments = await prisma.assignment.findMany({
      where: { studentId: session.studentId },
      orderBy: { assignedAt: "desc" },
      include: {
        practiceSet: {
          select: {
            id: true,
            title: true,
            description: true,
            difficulty: true,
            questions: true,
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

    // Transform to response shape with full practice set data
    const responseAssignments = assignments.map((assignment) => {
      // Parse questions JSON to get questionIds array
      let questionIds: string[] = [];
      try {
        const parsed = JSON.parse(assignment.practiceSet.questions);
        if (Array.isArray(parsed)) {
          questionIds = parsed.filter((id): id is string => typeof id === "string");
        }
      } catch {
        // questions field may not be valid JSON, use empty array
      }

      return {
        id: assignment.id,
        practiceSetId: assignment.practiceSetId,
        practiceSetTitle: assignment.practiceSet.title,
        topicId: assignment.practiceSet.topic?.id ?? null,
        topicName: assignment.practiceSet.topic?.name ?? null,
        assignedAt: assignment.assignedAt.toISOString(),
        dueDate: assignment.dueDate?.toISOString() ?? null,
        completed: assignment.completed,
        // Include full practice set data needed by the UI
        practiceSet: {
          id: assignment.practiceSet.id,
          title: assignment.practiceSet.title,
          description: assignment.practiceSet.description ?? "",
          questionIds,
          difficulty: assignment.practiceSet.difficulty,
        },
      };
    });

    return NextResponse.json({ assignments: responseAssignments });
  } catch (error) {
    console.error("Error fetching student assignments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
