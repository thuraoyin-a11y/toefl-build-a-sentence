import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/teacher/sample-items
 * Returns list of sample items for the logged-in teacher
 * Query params:
 *   - isSelfReviewed: "true" | "false" (optional, strict validation)
 */
export async function GET(request: NextRequest) {
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

    // Parse and validate isSelfReviewed filter
    const { searchParams } = request.nextUrl;
    const isSelfReviewedParam = searchParams.get("isSelfReviewed");

    let validatedIsSelfReviewed: boolean | undefined;

    if (isSelfReviewedParam !== null) {
      if (isSelfReviewedParam === "true") {
        validatedIsSelfReviewed = true;
      } else if (isSelfReviewedParam === "false") {
        validatedIsSelfReviewed = false;
      } else {
        return NextResponse.json(
          { error: "isSelfReviewed must be 'true' or 'false'" },
          { status: 400 }
        );
      }
    }

    // Build where clause
    const where: {
      teacherId: string;
      isSelfReviewed?: boolean;
    } = {
      teacherId: session.teacherId,
    };

    if (validatedIsSelfReviewed !== undefined) {
      where.isSelfReviewed = validatedIsSelfReviewed;
    }

    // Fetch sample items
    const sampleItems = await prisma.sampleItem.findMany({
      where,
      include: {
        topic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform to minimal list response shape
    const responseItems = sampleItems.map((item) => ({
      id: item.id,
      topicId: item.topicId,
      topicName: item.topic?.name ?? null,
      title: item.title,
      isSelfReviewed: item.isSelfReviewed,
      isActive: item.isActive,
      createdAt: item.createdAt.toISOString(),
    }));

    return NextResponse.json({ sampleItems: responseItems });
  } catch (error) {
    console.error("Error fetching sample items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teacher/sample-items
 * Creates a new sample item in draft state for the logged-in teacher
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
      "context",
      "wordBank",
      "correctAnswer",
      "topicId",
      "hint",
      "explanation",
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
      context,
      wordBank,
      correctAnswer,
      topicId,
      hint,
      explanation,
    } = body as Record<string, unknown>;

    // Validate title
    const trimmedTitle = typeof title === "string" ? title.trim() : "";
    if (!trimmedTitle) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    // Validate context
    const trimmedContext = typeof context === "string" ? context.trim() : "";
    if (!trimmedContext) {
      return NextResponse.json(
        { error: "context is required" },
        { status: 400 }
      );
    }

    // Validate wordBank
    if (!Array.isArray(wordBank) || wordBank.length < 2) {
      return NextResponse.json(
        { error: "wordBank must be an array with at least 2 elements" },
        { status: 400 }
      );
    }
    if (!wordBank.every((w) => typeof w === "string")) {
      return NextResponse.json(
        { error: "wordBank must be an array of strings" },
        { status: 400 }
      );
    }

    // Validate correctAnswer
    if (!Array.isArray(correctAnswer) || correctAnswer.length === 0) {
      return NextResponse.json(
        { error: "correctAnswer must be a non-empty array" },
        { status: 400 }
      );
    }
    if (!correctAnswer.every((w) => typeof w === "string")) {
      return NextResponse.json(
        { error: "correctAnswer must be an array of strings" },
        { status: 400 }
      );
    }

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

    // Validate hint if provided
    if (
      hint !== undefined &&
      hint !== null &&
      typeof hint !== "string"
    ) {
      return NextResponse.json(
        { error: "hint must be a string or null" },
        { status: 400 }
      );
    }

    // Validate explanation if provided
    if (
      explanation !== undefined &&
      explanation !== null &&
      typeof explanation !== "string"
    ) {
      return NextResponse.json(
        { error: "explanation must be a string or null" },
        { status: 400 }
      );
    }

    // Create sample item in draft state
    const sampleItem = await prisma.sampleItem.create({
      data: {
        teacherId: session.teacherId,
        topicId: validatedTopicId,
        title: trimmedTitle,
        context: trimmedContext,
        wordBank: JSON.stringify(wordBank),
        correctAnswer: JSON.stringify(correctAnswer),
        hint: hint ?? null,
        explanation: explanation ?? null,
        isSelfReviewed: false,
        selfReviewedAt: null,
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        sampleItem: {
          id: sampleItem.id,
          teacherId: sampleItem.teacherId,
          topicId: sampleItem.topicId,
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
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating sample item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
