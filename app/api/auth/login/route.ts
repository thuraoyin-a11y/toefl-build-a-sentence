import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { authenticateUser } from "@/lib/auth/user";
import { SessionData, sessionOptions } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Authenticate user
    const user = await authenticateUser(email, password);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Get session and populate it
    const cookieStore = cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    // Use type assertion to set discriminated union properties
    if (user.role === "TEACHER") {
      const teacherSession = session as unknown as {
        isLoggedIn: true;
        userId: string;
        email: string;
        role: "TEACHER";
        teacherId: string;
        save: () => Promise<void>;
      };
      teacherSession.isLoggedIn = true;
      teacherSession.userId = user.userId;
      teacherSession.email = user.email;
      teacherSession.role = "TEACHER";
      teacherSession.teacherId = user.teacherId!;
    } else {
      const studentSession = session as unknown as {
        isLoggedIn: true;
        userId: string;
        email: string;
        role: "STUDENT";
        studentId: string;
        save: () => Promise<void>;
      };
      studentSession.isLoggedIn = true;
      studentSession.userId = user.userId;
      studentSession.email = user.email;
      studentSession.role = "STUDENT";
      studentSession.studentId = user.studentId!;
    }

    await session.save();

    return NextResponse.json({
      success: true,
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role,
        teacherId: user.teacherId,
        studentId: user.studentId,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
