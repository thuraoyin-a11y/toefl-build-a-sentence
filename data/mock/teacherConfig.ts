import { TeacherConfig } from "@/lib/types";

/**
 * Teacher configuration - mock data
 * Defines daily requirements for students
 */
export const teacherConfig: TeacherConfig = {
  // Students need to complete 2 practice sets per day
  dailyRequiredSets: 2,
  
  // Today's assigned practice sets
  assignedSetIds: ["set001", "set002", "set003"],
};

/**
 * Get teacher configuration
 */
export function getTeacherConfig(): TeacherConfig {
  return teacherConfig;
}

/**
 * Get daily required sets count
 */
export function getDailyRequiredSets(): number {
  return teacherConfig.dailyRequiredSets;
}

/**
 * Get assigned set IDs for today
 */
export function getAssignedSetIds(): string[] {
  return teacherConfig.assignedSetIds;
}
