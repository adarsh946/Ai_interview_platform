import { Job, Worker } from "bullmq";
import { resumeQueue } from "../config/queue.js";
import { extractResumeText } from "../services/resumeParser.js";
import prisma from "../prisma/prisma.js";
import { redisConnection } from "../config/redisConnection.js";

const resumeWorker = new Worker(
  "resume-queue",
  async (job: Job) => {
    const { interviewId, resumeUrl } = job.data;
    console.log(
      `[resumeWorker] processing job=${job.id} interviewId=${interviewId}`
    );

    if (!interviewId || !resumeUrl) {
      throw new Error("Interview id or Resume url not found!");
    }

    //  downloading resume from s3
    const response = await fetch(resumeUrl);
    if (!response.ok) {
      throw new Error(`Failed to download resume: ${response.statusText}`);
    }

    // converting buffer to string....
    const buffer = Buffer.from(await response.arrayBuffer());
    const extractedText = await extractResumeText(buffer);

    // Saving resume content in db....
    await prisma.mockInterview.update({
      where: { id: interviewId },
      data: { resumeText: extractedText },
    });

    console.log(
      `[resumeWorker] interviewId=${interviewId} resume text extracted and saved`
    );
  },
  { connection: redisConnection }
);

// events...

resumeWorker.on("completed", (job) => {
  console.log(`[resumeWorker] job=${job.id} completed`);
});

resumeWorker.on("failed", (job, err) => {
  console.error(`[resumeWorker] job=${job?.id} failed:`, err.message);
});
