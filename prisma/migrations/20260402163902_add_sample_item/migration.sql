-- CreateTable
CREATE TABLE "SampleItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teacherId" TEXT NOT NULL,
    "topicId" TEXT,
    "title" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "wordBank" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "hint" TEXT,
    "explanation" TEXT,
    "isSelfReviewed" BOOLEAN NOT NULL DEFAULT false,
    "selfReviewedAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SampleItem_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SampleItem_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SampleItem_teacherId_isSelfReviewed_idx" ON "SampleItem"("teacherId", "isSelfReviewed");

-- CreateIndex
CREATE INDEX "SampleItem_teacherId_createdAt_idx" ON "SampleItem"("teacherId", "createdAt");

-- CreateIndex
CREATE INDEX "SampleItem_topicId_idx" ON "SampleItem"("topicId");
