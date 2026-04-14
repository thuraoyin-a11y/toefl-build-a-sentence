import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/teacher/students/[id]/progress
 * Clears all progress data for a specific student:
 * - Deletes all practice attempts
 * - Resets all assignments to uncompleted status
 * Teacher-only endpoint
 */
export async function DELETE(
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

    // Delete all practice attempts for this student
    const deletedAttempts = await prisma.practiceAttempt.deleteMany({
      where: {
        studentId: id,
      },
    });

    // Reset all assignments to uncompleted status
    const updatedAssignments = await prisma.assignment.updateMany({
      where: {
        studentId: id,
      },
      data: {
        completed: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Student progress cleared successfully",
      deletedAttempts: deletedAttempts.count,
      resetAssignments: updatedAssignments.count,
    });
  } catch (error) {
    console.error("Error clearing student progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
