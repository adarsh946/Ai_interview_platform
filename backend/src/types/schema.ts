import z, { string } from "zod";

export const signupSchema = z.object({
  fullName: z.string().trim(),
  email: z.email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one digit")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character"
    ),
});

export const signinSchema = z.object({
  email: z.email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one digit")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character"
    ),
});

export const createJobSchema = z.object({
  title: z.string(),
  description: z.string(),
  skills: z.string().array(),
  ctc: z.number(),
  location: z.string(),
  expiry: z.date(),
  active: z.boolean(),
});

export const createMockSchema = z.object({
  role: z.string().min(1, "Required field"),
  difficulty: z.string(),
  duration: z.string().transform((val) => parseInt(val)),
  round: z.string(),
  skills: z.string().transform((val) => JSON.parse(val)),
});

export const EvaluationSchema = z.object({
  score: z
    .number()
    .min(0)
    .max(10)
    .describe("Score between 0 and 10 calibrated to difficulty level"),
  feedback: z.string().describe("Brief overall feedback on the answer"),
  strength: z.string().describe("What was good about the answer"),
  weakness: z.string().describe("What was missing or weak"),
  followUpNeeded: z
    .boolean()
    .describe("Whether a follow-up question is needed"),
  followUpContext: z
    .string()
    .describe("What to probe deeper — empty string if followUpNeeded is false"),
});

export const ResultSchema = z.object({
  overallScore: z.number().min(0).max(10),
  overallFeedback: z.string(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
});
