import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/teacher/practice-sets
 * Creates a new PracticeSet composed of SampleItems
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Validate input shape
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body is required" },
        { status: 400 }
      );
    }

    // Check for unknown/forbidden fields
    const allowedFields = [
      "title",
      "difficulty",
      "sampleItemIds",
      "description",
      "topicId",
    ];
    const bodyKeys = Object.keys(body as Record<string, unknown>);
    const unknownFields = bodyKeys.filter((key) => !allowedFields.includes(key));
    if (unknownFields.length > 0) {
      return NextResponse.json(
        { error: "Unknown or forbidden fields in request body" },
        { status: 400 }
      );
    }

    const {
      title,
      difficulty,
      sampleItemIds,
      description,
      topicId,
    } = body as Record<string, unknown>;

    // Validate title
    const trimmedTitle = typeof title === "string" ? title.trim() : "";
    if (!trimmedTitle) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    // Validate difficulty
    if (typeof difficulty !== "string" || !["easy", "medium", "hard"].includes(difficulty)) {
      return NextResponse.json(
        { error: "difficulty is required and must be 'easy', 'medium', or 'hard'" },
        { status: 400 }
      );
    }

    // Validate sampleItemIds
    if (!Array.isArray(sampleItemIds) || sampleItemIds.length === 0) {
      return NextResponse.json(
        { error: "sampleItemIds is required and must be a non-empty array" },
        { status: 400 }
      );
    }
    if (!sampleItemIds.every((id) => typeof id === "string" && id.length > 0)) {
      return NextResponse.json(
        { error: "sampleItemIds must be an array of non-empty strings" },
        { status: 400 }
      );
    }

    // Check for duplicates in sampleItemIds
    const uniqueIds = new Set(sampleItemIds);
    if (uniqueIds.size !== sampleItemIds.length) {
      return NextResponse.json(
        { error: "sampleItemIds contains duplicate values" },
        { status: 409 }
      );
    }

    // Validate description if provided
    const trimmedDescription = typeof description === "string" ? description.trim() : null;

    // Validate topicId if provided
    let validatedTopicId: string | null = null;
    if (topicId !== undefined) {
      if (topicId === null) {
        validatedTopicId = null;
      } else if (typeof topicId === "string" && topicId.trim()) {
        // Verify topic exists and belongs to this teacher
        const topic = await prisma.topic.findFirst({
          where: {
            id: topicId.trim(),
            teacherId: session.teacherId,
          },
          select: { id: true },
        });
        if (!topic) {
          return NextResponse.json(
            { error: "Topic not found" },
            { status: 404 }
          );
        }
        validatedTopicId = topicId.trim();
      } else {
        return NextResponse.json(
          { error: "topicId must be a string or null" },
          { status: 400 }
        );
      }
    }

    // Step 1: Verify all SampleItems exist and belong to this teacher
    const sampleItems = await prisma.sampleItem.findMany({
      where: {
        id: { in: sampleItemIds as string[] },
        teacherId: session.teacherId,
      },
      select: { id: true, isSelfReviewed: true },
    });

    if (sampleItems.length !== sampleItemIds.length) {
      return NextResponse.json(
        { error: "One or more SampleItems not found" },
        { status: 404 }
      );
    }

    // Step 2: Verify all SampleItems are self-reviewed
    const unreviewedItems = sampleItems.filter((item) => !item.isSelfReviewed);
    if (unreviewedItems.length > 0) {
      return NextResponse.json(
        {
          error: "One or more SampleItems are not self-reviewed",
          unreviewedItemIds: unreviewedItems.map((item) => item.id),
        },
        { status: 409 }
      );
    }

    // Create PracticeSet with sampleItemIds preserved in order
    const practiceSet = await prisma.practiceSet.create({
      data: {
        teacherId: session.teacherId,
        title: trimmedTitle,
        description: trimmedDescription,
        questions: JSON.stringify(sampleItemIds),
        difficulty: difficulty,
        topicId: validatedTopicId,
      },
    });

    return NextResponse.json(
      {
        practiceSet: {
          id: practiceSet.id,
          teacherId: practiceSet.teacherId,
          topicId: practiceSet.topicId,
          title: practiceSet.title,
          description: practiceSet.description,
          difficulty: practiceSet.difficulty,
          questionCount: sampleItemIds.length,
          createdAt: practiceSet.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating practice set:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
