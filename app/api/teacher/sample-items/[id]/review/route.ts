import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/teacher/sample-items/[id]/review
 * Marks a sample item as self-reviewed (teacher-only, idempotent)
 */
export async function POST(
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

    // If already reviewed, return unchanged (idempotent)
    if (sampleItem.isSelfReviewed) {
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
    }

    // Mark as reviewed
    const now = new Date();
    const updatedSampleItem = await prisma.sampleItem.update({
      where: { id },
      data: {
        isSelfReviewed: true,
        selfReviewedAt: now,
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

    return NextResponse.json({
      sampleItem: {
        id: updatedSampleItem.id,
        topicId: updatedSampleItem.topicId,
        topicName: updatedSampleItem.topic?.name ?? null,
        title: updatedSampleItem.title,
        context: updatedSampleItem.context,
        wordBank: JSON.parse(updatedSampleItem.wordBank) as string[],
        correctAnswer: JSON.parse(updatedSampleItem.correctAnswer) as string[],
        hint: updatedSampleItem.hint,
        explanation: updatedSampleItem.explanation,
        isSelfReviewed: updatedSampleItem.isSelfReviewed,
        selfReviewedAt: updatedSampleItem.selfReviewedAt,
        isActive: updatedSampleItem.isActive,
        createdAt: updatedSampleItem.createdAt.toISOString(),
        updatedAt: updatedSampleItem.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error marking sample item as reviewed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
