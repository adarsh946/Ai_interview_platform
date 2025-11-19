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
