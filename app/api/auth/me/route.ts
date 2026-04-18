import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions, hasStaleSessionId } from "@/lib/auth/session";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Detect stale sessions with hardcoded demo IDs and force re-login
    if (hasStaleSessionId(session)) {
      return NextResponse.json(
        { error: "Session expired. Please log in again." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        userId: (session as any).userId,
        email: (session as any).email,
        role: (session as any).role,
        teacherId: (session as any).teacherId,
        studentId: (session as any).studentId,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
