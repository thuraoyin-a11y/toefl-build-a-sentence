import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateTemporaryPassword } from "@/lib/auth/password";
import { Prisma } from "@prisma/client";

/**
 * GET /api/teacher/students
 * Returns list of students belonging to the logged-in teacher
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

    // Fetch students belonging to this teacher
    const students = await prisma.student.findMany({
      where: { teacherId: session.teacherId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignments: {
          select: {
            completed: true,
          },
        },
        attempts: {
          where: {
            completedAt: { not: null },
          },
          orderBy: {
            completedAt: "desc",
          },
          take: 1,
          select: {
            completedAt: true,
          },
        },
        _count: {
          select: {
            assignments: true,
            attempts: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform to response shape
    const responseStudents = students.map((student) => ({
      id: student.id,
      userId: student.user.id,
      name: student.user.name,
      email: student.user.email,
      dailyGoal: student.dailyGoal,
      isActive: student.isActive,
      createdAt: student.createdAt.toISOString(),
      updatedAt: student.updatedAt.toISOString(),
      assignmentCount: student._count.assignments,
      pendingAssignments: student.assignments.filter((a) => !a.completed).length,
      completedAssignments: student.assignments.filter((a) => a.completed).length,
      attemptCount: student._count.attempts,
      lastActiveAt: student.attempts[0]?.completedAt?.toISOString() ?? null,
    }));

    return NextResponse.json({ students: responseStudents });
  } catch (error) {
    console.error("Error fetching teacher students:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teacher/students
 * Creates a new student (User + Student records atomically)
 * Returns the temporary password once in the response
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

    // Validate input
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body is required" },
        { status: 400 }
      );
    }

    const { name, email } = body as Record<string, unknown>;

    // Validate name
    const trimmedName = typeof name === "string" ? name.trim() : "";
    if (!trimmedName) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Validate email
    const trimmedEmail = typeof email === "string" ? email.trim() : "";
    if (!trimmedEmail) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Normalize email to lowercase
    const normalizedEmail = trimmedEmail.toLowerCase();

    // Email format validation (simplified RFC 5322)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    // Check email uniqueness early
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword(10);
    const passwordHash = await hashPassword(temporaryPassword);

    // Create User and Student atomically
    let student;
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create User record
        const user = await tx.user.create({
          data: {
            email: normalizedEmail,
            name: trimmedName,
            passwordHash,
            role: "STUDENT",
          },
        });

        // Create Student record linked to User and Teacher
        const studentRecord = await tx.student.create({
          data: {
            userId: user.id,
            teacherId: session.teacherId,
          },
        });

        return { user, student: studentRecord };
      });

      student = result;
    } catch (txError) {
      // Handle unique constraint violation (race condition)
      if (
        txError instanceof Prisma.PrismaClientKnownRequestError &&
        txError.code === "P2002"
      ) {
        return NextResponse.json(
          { error: "A user with this email already exists" },
          { status: 409 }
        );
      }
      throw txError;
    }

    // Return success response
    return NextResponse.json(
      {
        student: {
          id: student.student.id,
          name: student.user.name,
          email: student.user.email,
          isActive: student.student.isActive,
        },
        temporaryPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating student:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
