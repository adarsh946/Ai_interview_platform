import prisma from "../prisma/prisma.js";
import { createMockSchema } from "../types/schema.js";

export const createMockInterview = async (req: any, res: any) => {
  const schema = createMockSchema.safeParse(req.body);
  if (!schema.success) {
    return res.status(401).json({
      message: "please fill correct details",
    });
  }

  try {
    const mock = await prisma.mockInterview.create({
      data: {
        role: schema.data.role,
        round: schema.data.round,
        duration: schema.data.duration,
        skills: schema.data.skills,
        difficulty: schema.data.difficulty,
        resume: schema.data.resume,
        userId: req.userId,
      },
    });

    if (!mock) {
    }

    //   Ai logic for generating questions on the basic of mock and resume....

    return res.status(201).json({
      message: "mock created successfully!",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Problem in creating mock",
    });
  }
};
