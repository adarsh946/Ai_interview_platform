/*
  Warnings:

  - You are about to drop the column `feedback` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `scores` on the `Result` table. All the data in the column will be lost.
  - Added the required column `overallScore` to the `Result` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."MockInterview" ADD COLUMN     "resumeText" TEXT;

-- AlterTable
ALTER TABLE "public"."Result" DROP COLUMN "feedback",
DROP COLUMN "scores",
ADD COLUMN     "improvements" TEXT[],
ADD COLUMN     "overallFeedback" TEXT,
ADD COLUMN     "overallScore" INTEGER NOT NULL,
ADD COLUMN     "strengths" TEXT[];
