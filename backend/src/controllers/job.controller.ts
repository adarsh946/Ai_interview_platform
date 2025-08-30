import prisma from "../prisma/prisma.js";
import { createJobSchema } from "../types/schema.js";

export const jobCreation = async (req: any, res: any) => {
  const jobSchema = createJobSchema.safeParse(req.body);
  if (!jobSchema.success) {
    return res.status(401).json({
      message: "Invalid Inputs!",
    });
  }

  try {
    const job = await prisma.job.create({
      data: {
        title: jobSchema.data.title,
        description: jobSchema.data.description,
        ctc: jobSchema.data.ctc,
        location: jobSchema.data.location,
        active: jobSchema.data.active,
        expiry: jobSchema.data.expiry,
        skills: jobSchema.data.skills,
      },
    });

    if (!job) {
      return res.status(500).json({
        message: "Unable to save the job",
      });
    }
    return res.status(201).json({
      message: "Job created Sucessfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to save the job",
    });
  }
};
