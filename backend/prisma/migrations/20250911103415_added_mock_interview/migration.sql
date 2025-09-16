-- CreateEnum
CREATE TYPE "public"."Difficultylevel" AS ENUM ('Intermidiate', 'Advanced');

-- CreateTable
CREATE TABLE "public"."MockInterview" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "round" TEXT NOT NULL,
    "difficulty" "public"."Difficultylevel" NOT NULL,
    "skills" TEXT[],
    "resume" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "MockInterview_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."MockInterview" ADD CONSTRAINT "MockInterview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
