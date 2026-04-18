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
export const getSessionOptions = () => {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET environment variable is required");
  }
  return {
    cookieName: "session",
    password: secret,
    cookieOptions: { secure: process.env.NODE_ENV === "production" }
  };
};


/**
 * Get the current session from request cookies
 * For use in Server Components and API routes
 */
export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
export const sessionOptions = getSessionOptions();
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

/**
 * UUID regex for validating database IDs
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Check if a session contains stale hardcoded demo IDs
 * Legacy login route used IDs like "student-alex-001" instead of UUIDs.
 * This helper detects those stale sessions so they can be cleared.
 */
export function hasStaleSessionId(session: SessionData): boolean {
  if (!session.isLoggedIn) return false;

  if (session.role === "STUDENT" && session.studentId) {
    return !UUID_REGEX.test(session.studentId);
  }

  if (session.role === "TEACHER" && session.teacherId) {
    return !UUID_REGEX.test(session.teacherId);
  }

  return false;
}
