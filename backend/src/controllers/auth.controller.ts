import jwt from "jsonwebtoken";
import prisma from "../prisma/prisma.js";
import { signinSchema, signupSchema } from "../types/schema.js";
import bcrypt from "bcrypt";

export const signupController = async (req: any, res: any) => {
  const schema = signupSchema.safeParse(req.body);

  if (!schema.success) {
    return res.status(401).json({
      message: "Invalid Credentials",
    });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        email: schema.data.email,
      },
    });

    if (user) {
      return res.status(401).json({
        message: "User already Exist!",
      });
    }

    const hashedPassword = await bcrypt.hash(schema.data.password, 10);

    if (!hashedPassword) {
      return res.status(500).json({
        message: "Problem in hashing the password!",
      });
    }

    const newUser = await prisma.user.create({
      data: {
        fullName: schema.data.fullName,
        password: hashedPassword,
        email: schema.data.email,
        provider: "local",
      },
    });

    if (!newUser) {
      return res.status(401).json({
        message: "Problem in creating account",
      });
    }

    res.status(201).json({
      message: "Account created Successfully!",
    });
  } catch (error) {
    return res.status(401).json({
      message: "User already Exists!",
    });
  }
};

export const signinController = async (req: any, res: any) => {
  const schema = signinSchema.safeParse(req.body);

  if (!schema.success) {
    return res.status(401).json({
      message: "Invalid Credentials",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        email: schema.data.email,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }
    const hashedPassword = await bcrypt.hash(schema.data.password, 10);
    const isValidPassword = bcrypt.compare(user.password, hashedPassword);

    if (!isValidPassword) {
      return res.status(401).json({
        message: "Incorrect Password",
      });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!);
    if (!token)
      return res.status(401).json({ message: "problem in creating Token" });

    res.status(201).json({ token });
  } catch (error) {
    console.log(error);
    res.status(403).json({
      messege: "unable to signIn",
    });
  }
};

export const logoutController = async (req: any, res: any) => {};
