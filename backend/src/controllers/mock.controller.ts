import prisma from "../prisma/prisma.js";
import { createMockService } from "../services/mock/mock-resume.js";

export const createMockInterview = async (req: Request, res: any) => {
  try {
    const result: any = await createMockService(req, res);
    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Problem in creating mock",
    });
  }
};

export const getMyInterviews = async (req: any, res: any) => {
  const userid = req.user.id;
  if (!userid) {
    return res.status(401).json({
      message: "user not found!",
    });
  }

  try {
    const interviews = await prisma.mockInterview.findMany({
      where: {
        userId: userid,
      },
      include: {
        session: {
          include: {
            result: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    res.status(200).json({ interviews });
  } catch (err) {
    console.error("[mock.controller] getMyInterviews error:", err);
    res.status(500).json({ message: "Failed to fetch interviews" });
  }
};
