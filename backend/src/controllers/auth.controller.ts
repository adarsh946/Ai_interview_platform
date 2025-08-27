import prisma from "../prisma/prisma.js";
import { signupSchema } from "../types/schema.js";
import bcrypt from "bcrypt";

export const signupController = async (req: any, res: any) => {
  const schema = signupSchema.safeParse(req.body);

  if (!schema.success) {
    return res.status(401).json({
      message: "Invalid Credentials",
    });
  }

  const hashedPassword = await bcrypt.hash(schema.data.password, 10);

  if (!hashedPassword) {
    return res.status(500).json({
      message: "Problem in hashing the password!",
    });
  }

  const signup = await prisma.user.create({
    data: {
      fullName: schema.data.fullName,
      password: hashedPassword,
      email: schema.data.email,
    },
  });
};
