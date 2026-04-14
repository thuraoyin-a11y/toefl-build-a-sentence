/*
  Warnings:

  - Added the required column `teacherId` to the `PracticeSet` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PracticeSet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teacherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "questions" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "topicId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PracticeSet_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PracticeSet_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PracticeSet" ("createdAt", "description", "difficulty", "id", "questions", "title", "topicId", "updatedAt") SELECT "createdAt", "description", "difficulty", "id", "questions", "title", "topicId", "updatedAt" FROM "PracticeSet";
DROP TABLE "PracticeSet";
ALTER TABLE "new_PracticeSet" RENAME TO "PracticeSet";
CREATE INDEX "PracticeSet_teacherId_idx" ON "PracticeSet"("teacherId");
CREATE INDEX "PracticeSet_topicId_idx" ON "PracticeSet"("topicId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
