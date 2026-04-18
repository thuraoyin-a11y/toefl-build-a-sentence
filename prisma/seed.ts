import { PrismaClient, UserRole, AttemptType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { questionBank, practiceSets } from "../data/mock/practiceSets";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("Start seeding...");
  console.log("Database URL:", (process.env.DATABASE_URL || "").substring(0, 50) + "...");

  // Clean up existing data (reverse dependency order)
  await prisma.practiceAttempt.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.practiceSet.deleteMany();
  await prisma.sampleItem.deleteMany();
  await prisma.user.deleteMany();

  // Create teacher user
  const teacherUser = await prisma.user.create({
    data: {
      email: "teacher@example.com",
      name: "Ms. Johnson",
      passwordHash: "$2b$10$Tc6gcETHjJ5Q0LL8wNn/QOeNK0xIaKBMtvfEz3ePODmXw8Z6N7iBq", // bcrypt hash for "password123"
      role: UserRole.TEACHER,
    },
  });

  // Create teacher profile
  const teacher = await prisma.teacher.create({
    data: {
      userId: teacherUser.id,
    },
  });

  // Create student users (2 students)
  const studentUser1 = await prisma.user.create({
    data: {
      email: "alex@example.com",
      name: "Alex Chen",
      passwordHash: "$2b$10$Tc6gcETHjJ5Q0LL8wNn/QOeNK0xIaKBMtvfEz3ePODmXw8Z6N7iBq", // bcrypt hash for "password123"
      role: UserRole.STUDENT,
    },
  });

  const studentUser2 = await prisma.user.create({
    data: {
      email: "sam@example.com",
      name: "Sam Taylor",
      passwordHash: "$2b$10$Tc6gcETHjJ5Q0LL8wNn/QOeNK0xIaKBMtvfEz3ePODmXw8Z6N7iBq", // bcrypt hash for "password123"
      role: UserRole.STUDENT,
    },
  });

  // Create student profiles
  const student1 = await prisma.student.create({
    data: {
      userId: studentUser1.id,
      teacherId: teacher.id,
      dailyGoal: 10,
    },
  });

  const student2 = await prisma.student.create({
    data: {
      userId: studentUser2.id,
      teacherId: teacher.id,
      dailyGoal: 15,
    },
  });

  // Create SampleItems from questionBank (using mock data as source of truth)
  const sampleItemMap = new Map<string, string>(); // Maps question.id -> SampleItem.id
  
  for (const question of questionBank) {
    const sampleItem = await prisma.sampleItem.create({
      data: {
        teacherId: teacher.id,
        topicId: null,
        title: question.id,
        context: question.context,
        wordBank: JSON.stringify(question.wordBank),
        correctAnswer: JSON.stringify(question.correctAnswer),
        hint: question.hint,
        explanation: question.explanation,
        isSelfReviewed: true,
        selfReviewedAt: new Date(),
        isActive: true,
      },
    });
    sampleItemMap.set(question.id, sampleItem.id);
  }
  
  console.log(`Created ${sampleItemMap.size} SampleItems`);

  // Create PracticeSets using mock metadata (preserving original composition)
  const practiceSetData = practiceSets.map(ps => ({
    title: ps.title,
    description: ps.description,
    difficulty: ps.difficulty,
    // Map mock questionIds to actual SampleItem UUIDs, preserving order
    questionIds: ps.questionIds.map(qid => sampleItemMap.get(qid)!),
  }));

  const practiceSet1 = await prisma.practiceSet.create({
    data: {
      teacherId: teacher.id,
      title: practiceSetData[0].title,
      description: practiceSetData[0].description,
      questions: JSON.stringify(practiceSetData[0].questionIds),
      difficulty: practiceSetData[0].difficulty,
    },
  });

  const practiceSet2 = await prisma.practiceSet.create({
    data: {
      teacherId: teacher.id,
      title: practiceSetData[1].title,
      description: practiceSetData[1].description,
      questions: JSON.stringify(practiceSetData[1].questionIds),
      difficulty: practiceSetData[1].difficulty,
    },
  });

  const practiceSet3 = await prisma.practiceSet.create({
    data: {
      teacherId: teacher.id,
      title: practiceSetData[2].title,
      description: practiceSetData[2].description,
      questions: JSON.stringify(practiceSetData[2].questionIds),
      difficulty: practiceSetData[2].difficulty,
    },
  });

  // Create assignments (at least 2)
  // Assignment 1: Alex gets Basic Sentence Structure
  const assignment1 = await prisma.assignment.create({
    data: {
      teacherId: teacher.id,
      studentId: student1.id,
      practiceSetId: practiceSet1.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      completed: false,
    },
  });

  // Assignment 2: Sam gets Complex Sentences
  const assignment2 = await prisma.assignment.create({
    data: {
      teacherId: teacher.id,
      studentId: student2.id,
      practiceSetId: practiceSet2.id,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      completed: false,
    },
  });

  // Assignment 3: Alex gets Complex Sentences again (repeated assignment validation)
  const assignment3 = await prisma.assignment.create({
    data: {
      teacherId: teacher.id,
      studentId: student1.id,
      practiceSetId: practiceSet2.id,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      completed: false,
    },
  });

  // Create a sample full attempt (Alex completed Basic Sentence Structure)
  const fullAttempt = await prisma.practiceAttempt.create({
    data: {
      studentId: student1.id,
      practiceSetId: practiceSet1.id,
      assignmentId: assignment1.id,
      attemptType: AttemptType.full_attempt,
      score: 67, // 2 out of 3 correct
      correctCount: 2,
      totalQuestions: 3,
      answers: JSON.stringify({
        q1: { selectedWords: ["is"], isCorrect: true, timeSpent: 15 },
        q2: { selectedWords: ["go"], isCorrect: true, timeSpent: 12 },
        q3: { selectedWords: ["reads"], isCorrect: false, timeSpent: 20 },
      }),
      wrongItems: JSON.stringify([
        {
          id: "q3",
          sentence: "She ___ a book yesterday.",
          words: ["read", "reads", "reading", "will read"],
          correctAnswer: "read",
          hint: "Past tense of read is spelled the same.",
        },
      ]),
      completedAt: new Date(),
    },
  });

  // Create a sample retry attempt linked to the full attempt
  const retryAttempt = await prisma.practiceAttempt.create({
    data: {
      studentId: student1.id,
      practiceSetId: practiceSet1.id,
      assignmentId: assignment1.id,
      attemptType: AttemptType.retry_attempt,
      sourceAttemptId: fullAttempt.id,
      score: 100, // Got the wrong item correct this time
      correctCount: 1,
      totalQuestions: 1,
      answers: JSON.stringify({
        q3: { selectedWords: ["read"], isCorrect: true, timeSpent: 10 },
      }),
      wrongItems: JSON.stringify([]), // No wrong items after retry
      completedAt: new Date(),
    },
  });

  console.log("Seeding completed successfully!");
  console.log(`- Created 1 teacher (${teacherUser.name})`);
  console.log(`- Created 2 students (${studentUser1.name}, ${studentUser2.name})`);
  console.log(`- Created ${sampleItemMap.size} SampleItems`);
  console.log(`- Created 3 practice sets`);
  console.log(`- Created 3 assignments`);
  console.log(`- Created 1 full attempt (id: ${fullAttempt.id})`);
  console.log(`- Created 1 retry attempt linked to full attempt (id: ${retryAttempt.id})`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
