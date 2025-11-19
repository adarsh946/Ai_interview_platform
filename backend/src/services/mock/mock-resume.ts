import { resumeQueue } from "../../config/queue.js";
import prisma from "../../prisma/prisma.js";
import { createMockSchema } from "../../types/schema.js";

export const createMockService = async (req: any, res: any) => {
  const schema = createMockSchema.safeParse(req.body);
  if (!schema.success) {
    return res.status(401).json({
      message: "please fill correct details",
    });
  }

  if (!req.file) {
    throw new Error("Resume is required");
  }

  const resumeUrl = req.file.location; // s3 url
  try {
    const interview = prisma.mockInterview.create({
      data: {
        role: schema.data.role,
        round: schema.data.round,
        duration: schema.data.duration,
        skills: schema.data.skills,
        difficulty: schema.data.difficulty,
        resume: resumeUrl,
        userId: req.userId,
      },
    });

    if (!interview) {
      return res.status(500).json({
        message: "Problem in creating Interview..",
      });
    }

    await resumeQueue.add("Process-resume", {
      interviewId: (await interview).id,
      resumeUrl,
    });

    return res.status(200).json({
      message: "Resume uploaded successfully. Processing started.",
      interviewId: (await interview).id,
      status: "processing",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Problem in creating mock",
    });
  }
};
