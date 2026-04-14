import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { mapAssignmentToResponse } from "@/lib/teacher/mappers";

/**
 * GET /api/teacher/students/[id]/assignments
 * Returns all assignments for a specific student (teacher-only)
 * Ordered by assignedAt desc
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

    // Fetch all assignments for this student
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

    // Transform to response shape using shared mapper
    const responseAssignments = assignments.map(mapAssignmentToResponse);

    return NextResponse.json({ assignments: responseAssignments });
  } catch (error) {
    console.error("Error fetching student assignments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
