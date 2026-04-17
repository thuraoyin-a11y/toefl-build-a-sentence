import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions, isTeacher } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getAllPracticeSets } from "@/data/mock/practiceSets";

/**
 * GET /api/practice-sets
 * Returns all practice sets available to the current user.
 * For teachers: returns database practice sets + mock practice sets.
 */
export async function GET() {
  try {
    const cookieStore = cookies();
    const session = await getIronSession<SessionData>(
      cookieStore,
      sessionOptions
    );

    if (!session.isLoggedIn) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    if (isTeacher(session)) {
      // Fetch teacher's database practice sets
      const dbPracticeSets = await prisma.practiceSet.findMany({
        where: { teacherId: session.teacherId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          difficulty: true,
          createdAt: true,
          topic: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Fetch mock practice sets
      const mockPracticeSets = getAllPracticeSets();

      // Combine DB sets and mock sets
      const allPracticeSets = [
        ...dbPracticeSets.map((set) => ({
          id: set.id,
          title: set.title,
          description: set.description ?? "",
          difficulty: set.difficulty,
          questionIds: [], // DB sets don't expose questionIds here
          topic: set.topic,
          createdAt: set.createdAt.toISOString(),
          source: "database",
        })),
        ...mockPracticeSets.map((set) => ({
          id: set.id,
          title: set.title,
          description: set.description,
          difficulty: set.difficulty,
          questionIds: set.questionIds,
          topic: null,
          createdAt: null,
          source: "mock",
        })),
      ];

      return NextResponse.json({ practiceSets: allPracticeSets });
    }

    // For students, return an empty list (they use /api/student/assignments)
    return NextResponse.json({ practiceSets: [] });
  } catch (error) {
    console.error("Error fetching practice sets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
