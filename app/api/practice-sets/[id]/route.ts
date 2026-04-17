import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions, isTeacher, isStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { Question } from "@/lib/types";
import { getPracticeSetById, getQuestionsForSet } from "@/data/mock/practiceSets";

/**
 * GET /api/practice-sets/[id]
 * Returns a single PracticeSet with resolved SampleItem questions
 */
export async function GET(
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

    const { id } = await params;

    // Fetch PracticeSet for ownership check
    let practiceSet = await prisma.practiceSet.findUnique({
      where: { id },
    });

    // Fallback to mock data if not found in database
    let mockPracticeSet = getPracticeSetById(id);
    let questions: Question[] = [];

    if (practiceSet) {
      // --- Database path ---
      // Access control
      if (isTeacher(session)) {
        if (practiceSet.teacherId !== session.teacherId) {
          return NextResponse.json(
            { error: "Practice set not found" },
            { status: 404 }
          );
        }
      } else if (isStudent(session)) {
        const assignment = await prisma.assignment.findFirst({
          where: {
            studentId: session.studentId,
            practiceSetId: id,
          },
          select: { id: true },
        });

        if (!assignment) {
          return NextResponse.json(
            { error: "Practice set not found" },
            { status: 404 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "Practice set not found" },
          { status: 404 }
        );
      }

      // Parse PracticeSet.questions as ordered SampleItem ID array
      let orderedIds: unknown;
      try {
        orderedIds = JSON.parse(practiceSet.questions);
      } catch {
        return NextResponse.json(
          { error: "PracticeSet questions format is invalid or has not been migrated to SampleItem ID array" },
          { status: 422 }
        );
      }

      if (!Array.isArray(orderedIds) || orderedIds.some((id) => typeof id !== "string" || id.length === 0)) {
        return NextResponse.json(
          { error: "PracticeSet questions format is invalid or has not been migrated to SampleItem ID array" },
          { status: 422 }
        );
      }

      const sampleItemIds = orderedIds as string[];

      // Fetch SampleItems
      const sampleItems = await prisma.sampleItem.findMany({
        where: {
          id: { in: sampleItemIds },
        },
      });

      // Integrity check: all IDs must resolve
      if (sampleItems.length !== sampleItemIds.length) {
        return NextResponse.json(
          { error: "PracticeSet references one or more missing SampleItems" },
          { status: 409 }
        );
      }

      // Build lookup map to preserve order
      const sampleItemMap = new Map(sampleItems.map((item: any) => [item.id, item]));

      questions = sampleItemIds.map((sampleItemId) => {
        const item = sampleItemMap.get(sampleItemId) as any;
        return {
          id: item.id,
          context: item.context,
          wordBank: JSON.parse(item.wordBank) as string[],
          correctAnswer: JSON.parse(item.correctAnswer) as string[],
          hint: item.hint ?? undefined,
          explanation: item.explanation ?? undefined,
        };
      });

      return NextResponse.json({
        practiceSet: {
          id: practiceSet.id,
          title: practiceSet.title,
          description: practiceSet.description ?? "",
          questionIds: sampleItemIds,
          difficulty: practiceSet.difficulty,
        },
        questions,
      });
    } else if (mockPracticeSet) {
      // --- Mock data path ---
      // Access control for mock data
      if (isTeacher(session)) {
        // Teachers can access mock practice sets
      } else if (isStudent(session)) {
        const assignment = await prisma.assignment.findFirst({
          where: {
            studentId: session.studentId,
            practiceSetId: id,
          },
          select: { id: true },
        });

        if (!assignment) {
          return NextResponse.json(
            { error: "Practice set not found" },
            { status: 404 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "Practice set not found" },
          { status: 404 }
        );
      }

      questions = getQuestionsForSet(id);

      return NextResponse.json({
        practiceSet: {
          id: mockPracticeSet.id,
          title: mockPracticeSet.title,
          description: mockPracticeSet.description,
          questionIds: mockPracticeSet.questionIds,
          difficulty: mockPracticeSet.difficulty,
        },
        questions,
      });
    }

    return NextResponse.json(
      { error: "Practice set not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error fetching practice set:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
