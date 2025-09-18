-- CreateEnum
CREATE TYPE "public"."SessionStatus" AS ENUM ('PENDING', 'MIC_CHECK', 'CAMERA_CHECK', 'READY', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "mockInterviewId" TEXT NOT NULL,
    "status" "public"."SessionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cameraTestPassed" BOOLEAN NOT NULL DEFAULT false,
    "micTestPassed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Result" (
    "id" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "scores" JSONB,
    "expressions" JSONB,
    "feedback" TEXT,
    "screenshots" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_mockInterviewId_key" ON "public"."Session"("mockInterviewId");

-- CreateIndex
CREATE UNIQUE INDEX "Result_sessionId_key" ON "public"."Result"("sessionId");

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_mockInterviewId_fkey" FOREIGN KEY ("mockInterviewId") REFERENCES "public"."MockInterview"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Result" ADD CONSTRAINT "Result_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
