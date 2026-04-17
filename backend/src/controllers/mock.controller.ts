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

// import { extractResumeText } from "../utils/resumeParser";

// export const createMockInterview = async (req, res) => {
//   try {
//     const fileBuffer = req.file.buffer;

//     const resumeText = await extractResumeText(fileBuffer);

//     // store in DB
//     const interview = await MockInterview.create({
//       ...req.body,
//       resumeText,
//     });

//     res.status(201).json(interview);
//   } catch (error) {
//     res.status(500).json({ message: "Something went wrong" });
//   }
// };
