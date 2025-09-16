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
  role: z.string("Required field"),
  difficulty: z.string(),
  duration: z.number(),
  round: z.string(),
  skills: z.array(string()),
  resume: z.url(),
});
