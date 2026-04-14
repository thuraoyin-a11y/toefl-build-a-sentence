import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/auth/session";

export async function GET() {
  try {
    const cookieStore = cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.isLoggedIn) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Build response based on role
    if (session.role === "TEACHER") {
      // Get teacher's name from User table
      const { prisma } = await import("@/lib/prisma");
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { name: true },
      });
      
      return NextResponse.json({
        user: {
          userId: session.userId,
          email: session.email,
          name: user?.name ?? "Teacher",
          role: session.role,
          teacherId: session.teacherId,
        },
      });
    } else {
      // Get student's name from User table
      const { prisma } = await import("@/lib/prisma");
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { name: true },
      });
      
      return NextResponse.json({
        user: {
          userId: session.userId,
          email: session.email,
          name: user?.name ?? "Student",
          role: session.role,
          studentId: session.studentId,
        },
      });
    }
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
