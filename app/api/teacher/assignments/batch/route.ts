import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/teacher/assignments/batch
 * 批量创建分配（更高效）
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const session = await getIronSession<SessionData>(
      cookieStore,
      sessionOptions
    );

    if (!session.isLoggedIn || session.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { studentIds, practiceSetIds, dueDate } = body;

    // 验证输入
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { error: "studentIds array is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(practiceSetIds) || practiceSetIds.length === 0) {
      return NextResponse.json(
        { error: "practiceSetIds array is required" },
        { status: 400 }
      );
    }

    // 验证所有学生属于该教师
    const students = await prisma.student.findMany({
      where: {
        id: { in: studentIds },
        teacherId: session.teacherId,
      },
      select: { id: true },
    });

    if (students.length !== studentIds.length) {
      return NextResponse.json(
        { error: "Some students not found or don't belong to you" },
        { status: 404 }
      );
    }

    // 验证所有练习集存在
    const practiceSets = await prisma.practiceSet.findMany({
      where: {
        id: { in: practiceSetIds },
      },
      select: { id: true },
    });

    if (practiceSets.length !== practiceSetIds.length) {
      return NextResponse.json(
        { error: "Some practice sets not found" },
        { status: 404 }
      );
    }

    // 解析截止日期
    let parsedDueDate: Date | null = null;
    if (dueDate) {
      const d = new Date(dueDate);
      if (!isNaN(d.getTime())) {
        parsedDueDate = d;
      }
    }

    // 批量创建分配（使用 createMany）
    const assignmentData = [];
    for (const studentId of studentIds) {
      for (const practiceSetId of practiceSetIds) {
        assignmentData.push({
          teacherId: session.teacherId,
          studentId,
          practiceSetId,
          dueDate: parsedDueDate,
        });
      }
    }

    const result = await prisma.assignment.createMany({
      data: assignmentData,
      skipDuplicates: true, // 跳过重复项
    });

    return NextResponse.json({
      success: true,
      createdCount: result.count,
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating batch assignments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
