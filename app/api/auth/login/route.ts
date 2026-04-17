import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { authenticateUser } from "@/lib/auth/user";
import { SessionData, sessionOptions } from "@/lib/auth/session";

export const dynamic = 'force-dynamic';

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

    // 统一走数据库验证（authenticateUser 内部已支持 demo 账户密码校验）
    const authResult = await authenticateUser(email, password);
    if (!authResult) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }
    const user = authResult;

    // 获取 session
    const cookieStore = cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    // 设置 session 数据
    if (user.role === "TEACHER") {
      (session as any).isLoggedIn = true;
      (session as any).userId = user.userId;
      (session as any).email = user.email;
      (session as any).role = "TEACHER";
      (session as any).teacherId = user.teacherId;
    } else {
      (session as any).isLoggedIn = true;
      (session as any).userId = user.userId;
      (session as any).email = user.email;
      (session as any).role = "STUDENT";
      (session as any).studentId = user.studentId;
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
