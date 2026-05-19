import prisma from "../prisma/prisma.js";
import { NextFunction, Request, Response } from "express";

export const checkCredits = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    const wallet = await prisma.wallet.findUnique({
      where: {
        userId,
      },
    });

    if (!wallet) {
      return res.status(403).json({
        message: "No credits available",
      });
    }

    const totalCredits = await prisma.creditTransaction.aggregate({
      _sum: { amount: true },
      where: {
        walletId: wallet.id,
        type: "CREDIT",
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    const totalDebits = await prisma.creditTransaction.aggregate({
      _sum: { amount: true },
      where: {
        walletId: wallet.id,
        type: "DEBIT",
      },
    });

    const credits = totalCredits._sum.amount ?? 0;
    const debits = totalDebits._sum.amount ?? 0;

    const spendable = credits - debits;

    if (spendable < 1)
      return res.status(403).json({ message: "Insufficient credits" });

    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
