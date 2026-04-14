import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";

/**
 * Session data structure - Discriminated Union
 * Provides type safety for role-specific fields
 */
export type SessionData =
  | {
      isLoggedIn: true;
      userId: string;
      email: string;
      role: "TEACHER";
      teacherId: string;
      studentId?: never;
    }
  | {
      isLoggedIn: true;
      userId: string;
      email: string;
      role: "STUDENT";
      studentId: string;
      teacherId?: never;
    }
  | {
      isLoggedIn: false;
    };

/**
 * Default empty session
 */
export const defaultSession: SessionData = {
  isLoggedIn: false,
};

/**
 * Validate and get session secret
 * Throws error if not set - prevents insecure fallback
 */
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET environment variable is required. " +
        "Please set a secure random string of at least 32 characters."
    );
  }
  if (secret.length < 32) {
    throw new Error(
      "SESSION_SECRET must be at least 32 characters long. " +
        `Current length: ${secret.length}`
    );
  }
  return secret;
}

/**
 * Iron session configuration
 */
export const sessionOptions = {
  password: getSessionSecret(),
  cookieName: "toefl_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

/**
 * Get the current session from request cookies
 * For use in Server Components and API routes
 */
export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

/**
 * Type guard to check if user is a teacher
 */
export function isTeacher(
  session: SessionData
): session is SessionData & { isLoggedIn: true; role: "TEACHER"; teacherId: string } {
  return session.isLoggedIn === true && session.role === "TEACHER";
}

/**
 * Type guard to check if user is a student
 */
export function isStudent(
  session: SessionData
): session is SessionData & { isLoggedIn: true; role: "STUDENT"; studentId: string } {
  return session.isLoggedIn === true && session.role === "STUDENT";
}
