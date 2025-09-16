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
      },
    });
  } catch (error) {}
};
