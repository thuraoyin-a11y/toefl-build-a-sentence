import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/teacher/sample-items/[id]
 * Returns full detail for a single sample item (teacher-only)
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

    // Check teacher role
    if (session.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Teacher access required" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Find the sample item belonging to this teacher
    const sampleItem = await prisma.sampleItem.findFirst({
      where: {
        id,
        teacherId: session.teacherId,
      },
      include: {
        topic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!sampleItem) {
      return NextResponse.json(
        { error: "Sample item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      sampleItem: {
        id: sampleItem.id,
        topicId: sampleItem.topicId,
        topicName: sampleItem.topic?.name ?? null,
        title: sampleItem.title,
        context: sampleItem.context,
        wordBank: JSON.parse(sampleItem.wordBank) as string[],
        correctAnswer: JSON.parse(sampleItem.correctAnswer) as string[],
        hint: sampleItem.hint,
        explanation: sampleItem.explanation,
        isSelfReviewed: sampleItem.isSelfReviewed,
        selfReviewedAt: sampleItem.selfReviewedAt,
        isActive: sampleItem.isActive,
        createdAt: sampleItem.createdAt.toISOString(),
        updatedAt: sampleItem.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching sample item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
