import { NextRequest, NextResponse } from "next/server";
import { unsealData } from "iron-session";
import { SessionData, sessionOptions, hasStaleSessionId } from "./lib/auth/session";

/**
 * Middleware for lightweight route protection
 * 
 * Rules:
 * - Only reads the session cookie
 * - Checks whether a session exists
 * - Checks role access
 * - Redirects to /login or /unauthorized
 * 
 * Middleware never:
 * - queries the database
 * - verifies passwords
 * - creates or destroys sessions
 * - performs heavy auth logic
 */

// Routes that require authentication
const protectedRoutes = ["/", "/practice", "/result", "/retry", "/teacher"];

// Routes that require teacher role
const teacherRoutes = ["/teacher"];

// Public routes that should not be accessed when logged in
const authRoutes = ["/login"];

/**
 * Get session from cookie in middleware
 * Uses unsealData directly for edge compatibility
 */
async function getSessionFromCookie(
  request: NextRequest
): Promise<SessionData | null> {
  try {
    const cookie = request.cookies.get(sessionOptions.cookieName);
    if (!cookie?.value) {
      return null;
    }

    const data = await unsealData<SessionData>(cookie.value, {
      password: sessionOptions.password,
    });

    return data;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get session from cookie
  const session = await getSessionFromCookie(request);
  const isLoggedIn = session?.isLoggedIn === true;
  const userRole = session?.isLoggedIn ? session.role : null;

  // Check if this is a protected route
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if this is a teacher-only route
  const isTeacherRoute = teacherRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if this is an auth route (login)
  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Redirect unauthenticated users to login
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login page
  if (isAuthRoute && isLoggedIn) {
    // Redirect based on role
    if (userRole === "TEACHER") {
      return NextResponse.redirect(new URL("/teacher", request.url));
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Redirect non-teachers away from teacher routes
  if (isTeacherRoute && userRole !== "TEACHER") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  // Detect stale sessions with hardcoded demo IDs and force re-login
  if (session && hasStaleSessionId(session)) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(sessionOptions.cookieName);
    return response;
  }

  // Allow the request to proceed
  return NextResponse.next();
}

// Configure matcher for middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (handled separately)
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.).*)",
  ],
};
