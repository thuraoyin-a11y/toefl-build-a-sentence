import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/teacher/assignments
 * Returns list of assignments created by the logged-in teacher
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

    // Parse optional topicId filter
    const { searchParams } = request.nextUrl;
    const topicId = searchParams.get("topicId");
    const trimmedTopicId = typeof topicId === "string" ? topicId.trim() : "";

    // Build where clause
    const where: {
      teacherId: string;
      practiceSet?: { topicId: string };
    } = {
      teacherId: session.teacherId,
    };

    if (trimmedTopicId) {
      where.practiceSet = { topicId: trimmedTopicId };
    }

    // Fetch assignments belonging to this teacher
    const assignments = await prisma.assignment.findMany({
      where,
      orderBy: { assignedAt: "desc" },
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

    // Transform to response shape
    const responseAssignments = assignments.map((assignment) => ({
      id: assignment.id,
      studentId: assignment.studentId,
      practiceSetId: assignment.practiceSetId,
      practiceSetTitle: assignment.practiceSet.title,
      topicId: assignment.practiceSet.topic?.id ?? null,
      topicName: assignment.practiceSet.topic?.name ?? null,
      assignedAt: assignment.assignedAt.toISOString(),
      dueDate: assignment.dueDate?.toISOString() ?? null,
      completed: assignment.completed,
    }));

    return NextResponse.json({ assignments: responseAssignments });
  } catch (error) {
    console.error("Error fetching teacher assignments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teacher/assignments
 * Creates a single assignment for an owned student
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

    // Check teacher role
    if (session.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Teacher access required" },
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

    // Validate input shape
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body is required" },
        { status: 400 }
      );
    }

    const { studentId, practiceSetId, dueDate } = body as Record<
      string,
      unknown
    >;

    // Validate studentId
    const trimmedStudentId =
      typeof studentId === "string" ? studentId.trim() : "";
    if (!trimmedStudentId) {
      return NextResponse.json(
        { error: "studentId is required" },
        { status: 400 }
      );
    }

    // Validate practiceSetId
    const trimmedPracticeSetId =
      typeof practiceSetId === "string" ? practiceSetId.trim() : "";
    if (!trimmedPracticeSetId) {
      return NextResponse.json(
        { error: "practiceSetId is required" },
        { status: 400 }
      );
    }

    // Validate dueDate if provided
    let parsedDueDate: Date | undefined;
    if (dueDate !== undefined) {
      if (typeof dueDate !== "string" || !dueDate.trim()) {
        return NextResponse.json(
          { error: "dueDate must be a valid ISO date string" },
          { status: 400 }
        );
      }
      const d = new Date(dueDate);
      if (isNaN(d.getTime())) {
        return NextResponse.json(
          { error: "dueDate must be a valid ISO date string" },
          { status: 400 }
        );
      }
      parsedDueDate = d;
    }

    // Verify student exists and belongs to this teacher
    const student = await prisma.student.findFirst({
      where: {
        id: trimmedStudentId,
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

    // Verify practiceSet exists
    const practiceSet = await prisma.practiceSet.findUnique({
      where: { id: trimmedPracticeSetId },
      select: { id: true },
    });

    if (!practiceSet) {
      return NextResponse.json(
        { error: "Practice set not found" },
        { status: 404 }
      );
    }

    // Create assignment
    const assignment = await prisma.assignment.create({
      data: {
        teacherId: session.teacherId,
        studentId: trimmedStudentId,
        practiceSetId: trimmedPracticeSetId,
        dueDate: parsedDueDate ?? null,
      },
    });

    return NextResponse.json(
      {
        assignment: {
          id: assignment.id,
          studentId: assignment.studentId,
          practiceSetId: assignment.practiceSetId,
          assignedAt: assignment.assignedAt.toISOString(),
          dueDate: assignment.dueDate?.toISOString() ?? null,
          completed: assignment.completed,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
