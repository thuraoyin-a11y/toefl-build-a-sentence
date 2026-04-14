import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/teacher/topics/[id]
 * Returns minimal detail for a single topic (teacher-only)
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

    // Find the topic belonging to this teacher
    const topic = await prisma.topic.findFirst({
      where: {
        id,
        teacherId: session.teacherId,
      },
      include: {
        _count: {
          select: {
            practiceSets: true,
          },
        },
      },
    });

    if (!topic) {
      return NextResponse.json(
        { error: "Topic not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      topic: {
        id: topic.id,
        name: topic.name,
        description: topic.description,
        isActive: topic.isActive,
        sortOrder: topic.sortOrder,
        practiceSetCount: topic._count.practiceSets,
        createdAt: topic.createdAt.toISOString(),
        updatedAt: topic.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching topic:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/teacher/topics/[id]
 * Updates a topic (teacher-only)
 */
export async function PATCH(
  request: NextRequest,
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

    const allowedFields = ["name", "description", "isActive", "sortOrder"];
    const bodyKeys = Object.keys(body as Record<string, unknown>);

    // Reject unknown fields
    const unknownFields = bodyKeys.filter(
      (key) => !allowedFields.includes(key)
    );
    if (unknownFields.length > 0) {
      return NextResponse.json(
        { error: "Unknown fields in request body" },
        { status: 400 }
      );
    }

    // Require at least one valid updatable field
    if (bodyKeys.length === 0) {
      return NextResponse.json(
        { error: "At least one field is required" },
        { status: 400 }
      );
    }

    const { name, description, isActive, sortOrder } = body as Record<
      string,
      unknown
    >;

    const data: Partial<{
      name: string;
      description: string | null;
      isActive: boolean;
      sortOrder: number;
    }> = {};

    // Validate name
    if (name !== undefined) {
      const trimmedName = typeof name === "string" ? name.trim() : "";
      if (!trimmedName) {
        return NextResponse.json(
          { error: "name cannot be empty" },
          { status: 400 }
        );
      }
      data.name = trimmedName;
    }

    // Validate description
    if (description !== undefined) {
      if (description !== null && typeof description !== "string") {
        return NextResponse.json(
          { error: "description must be a string or null" },
          { status: 400 }
        );
      }
      data.description = description;
    }

    // Validate isActive
    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return NextResponse.json(
          { error: "isActive must be a boolean" },
          { status: 400 }
        );
      }
      data.isActive = isActive;
    }

    // Validate sortOrder
    if (sortOrder !== undefined) {
      if (typeof sortOrder !== "number" || !Number.isInteger(sortOrder)) {
        return NextResponse.json(
          { error: "sortOrder must be an integer" },
          { status: 400 }
        );
      }
      data.sortOrder = sortOrder;
    }

    // Verify ownership
    const existingTopic = await prisma.topic.findFirst({
      where: {
        id,
        teacherId: session.teacherId,
      },
      include: {
        _count: {
          select: {
            practiceSets: true,
          },
        },
      },
    });

    if (!existingTopic) {
      return NextResponse.json(
        { error: "Topic not found" },
        { status: 404 }
      );
    }

    // Update topic
    const updatedTopic = await prisma.topic.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      topic: {
        id: updatedTopic.id,
        name: updatedTopic.name,
        description: updatedTopic.description,
        isActive: updatedTopic.isActive,
        sortOrder: updatedTopic.sortOrder,
        practiceSetCount: existingTopic._count.practiceSets,
        createdAt: updatedTopic.createdAt.toISOString(),
        updatedAt: updatedTopic.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error updating topic:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
