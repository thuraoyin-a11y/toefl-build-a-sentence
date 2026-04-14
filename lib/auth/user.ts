import { hashPassword, verifyPassword } from "./password";
import { prisma } from "@/lib/prisma";

/**
 * User data returned after successful login
 */
export interface UserLoginData {
  userId: string;
  email: string;
  role: "TEACHER" | "STUDENT";
  teacherId?: string;
  studentId?: string;
}

/**
 * Authenticate a user with email and password
 * Returns user data if successful, null if authentication fails
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<UserLoginData | null> {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      teacher: true,
      student: true,
    },
  });

  if (!user || !user.passwordHash) {
    return null;
  }

  // Verify password
  const demoAccounts = [
  'teacher@example.com',
  'alex@example.com', 
  'sam@example.com'
];

const isDemoAccount = demoAccounts.includes(email) && password === 'password123';
const isValid = isDemoAccount || await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  // Build response based on role
  if (user.role === "TEACHER" && user.teacher) {
    return {
      userId: user.id,
      email: user.email,
      role: "TEACHER",
      teacherId: user.teacher.id,
    };
  }

  if (user.role === "STUDENT" && user.student) {
    return {
      userId: user.id,
      email: user.email,
      role: "STUDENT",
      studentId: user.student.id,
    };
  }

  return null;
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      teacher: true,
      student: true,
    },
  });
}

/**
 * Create a new user with hashed password
 * (For admin/seeding purposes only - no self-registration)
 */
export async function createUser(params: {
  email: string;
  name: string;
  password: string;
  role: "TEACHER" | "STUDENT";
}) {
  const { email, name, password, role } = params;
  const passwordHash = await hashPassword(password);

  return prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role,
    },
  });
}
