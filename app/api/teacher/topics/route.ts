import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/teacher/topics
 * Returns list of topics for the logged-in teacher
 */
export async function GET() {
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

    // Fetch topics belonging to this teacher
    const topics = await prisma.topic.findMany({
      where: { teacherId: session.teacherId },
      include: {
        _count: {
          select: {
            practiceSets: true,
          },
        },
      },
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    // Transform to response shape
    const responseTopics = topics.map((topic) => ({
      id: topic.id,
      name: topic.name,
      description: topic.description,
      isActive: topic.isActive,
      sortOrder: topic.sortOrder,
      practiceSetCount: topic._count.practiceSets,
      createdAt: topic.createdAt.toISOString(),
      updatedAt: topic.updatedAt.toISOString(),
    }));

    return NextResponse.json({ topics: responseTopics });
  } catch (error) {
    console.error("Error fetching teacher topics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teacher/topics
 * Creates a new topic for the logged-in teacher
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

    const { name, description, isActive, sortOrder } = body as Record<
      string,
      unknown
    >;

    // Validate name
    const trimmedName = typeof name === "string" ? name.trim() : "";
    if (!trimmedName) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    // Validate description if provided
    if (
      description !== undefined &&
      description !== null &&
      typeof description !== "string"
    ) {
      return NextResponse.json(
        { error: "description must be a string or null" },
        { status: 400 }
      );
    }

    // Validate isActive if provided
    if (isActive !== undefined && typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "isActive must be a boolean" },
        { status: 400 }
      );
    }

    // Validate sortOrder if provided
    if (sortOrder !== undefined && typeof sortOrder !== "number") {
      return NextResponse.json(
        { error: "sortOrder must be an integer" },
        { status: 400 }
      );
    }
    if (sortOrder !== undefined && !Number.isInteger(sortOrder)) {
      return NextResponse.json(
        { error: "sortOrder must be an integer" },
        { status: 400 }
      );
    }

    // Create topic
    const topic = await prisma.topic.create({
      data: {
        teacherId: session.teacherId,
        name: trimmedName,
        description: description ?? null,
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json(
      {
        topic: {
          id: topic.id,
          teacherId: topic.teacherId,
          name: topic.name,
          description: topic.description,
          isActive: topic.isActive,
          sortOrder: topic.sortOrder,
          createdAt: topic.createdAt.toISOString(),
          updatedAt: topic.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating topic:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
