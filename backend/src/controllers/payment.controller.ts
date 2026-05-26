import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils.js";
import prisma from "../prisma/prisma.js";
import razorpay from "../utils/razorpay.js";

export const createOrder = async (req: any, res: any) => {
  const { type, id } = req.body;
  const userId = req.user?.id;

  if (!type || !id) {
    return res.status(403).json({
      message: "Invalid payment request",
    });
  }

  if (!userId) {
    return res.status(401).json({
      message: "user not found!",
    });
  }

  try {
    let item: { price: number; id: string } | null = null;

    if (type === "plan") {
      item = await prisma.subscriptionPlan.findUnique({
        where: {
          id,
        },
      });
    } else {
      item = await prisma.creditPack.findUnique({
        where: {
          id,
        },
      });
    }

    if (!item) return res.status(404).json({ message: "Plan not found" });

    const order = await razorpay.orders.create({
      amount: item.price * 100, // Razorpay takes amount in paise
      currency: "INR",
      receipt: `receipt_${userId}_${Date.now()}`,
    });

    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: item.price,
        status: "PENDING",
        provider: "razorpay",
        providerPaymentId: order.id,
        planId: type === "plan" ? id : null,
        packId: type === "pack" ? id : null,
      },
    });

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const webhookHandler = async (req: any, res: any) => {
  const rawBody = req.body.toString(); // Buffer → string

  const validate = validateWebhookSignature(
    rawBody,
    req.headers["x-razorpay-signature"] as string,
    process.env.RAZORPAY_WEBHOOK_SECRET!
  );

  if (!validate) {
    return res.status(400).json({ message: "Invalid signature" });
  }

  // Then parse it yourself:
  const payload = JSON.parse(rawBody);

  // Razorpay sends different events — payment.captured means success
  if (payload.event !== "payment.captured") {
    return res.status(200).json({ message: "Event ignored" });
    // return 200 even for ignored events — so Razorpay doesn't retry
  }

  const razorpayPaymentId = payload.payload.payment.entity.id;

  const payment = await prisma.payment.findUnique({
    where: {
      providerPaymentId: razorpayPaymentId,
    },
    include: {
      user: {
        include: { wallet: true },
      },
    },
  });

  if (!payment) {
    return res.status(400).json({
      message: "Payment not found!",
    });
  }

  if (!payment.user.wallet) {
    return res.status(400).json({ message: "User wallet not found" });
  }

  if (payment.status == "SUCCESS") {
    return res.status(200).json({
      message: "already processed",
    });
  }

  let credits: number = 0;
  let expiresAt: Date | null = null;
  const endDate = new Date();

  if (payment.planId) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: {
        id: payment.planId,
      },
    });

    if (!plan) return res.status(400).json({ message: "Plan not found" });
    credits = plan?.creditsPerCycle;

    if (plan.interval === "MONTHLY") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }
    expiresAt = endDate;
  } else if (payment.packId) {
    const pack = await prisma.creditPack.findUnique({
      where: {
        id: payment.packId,
      },
    });

    if (!pack) return res.status(400).json({ message: "Pack not found" });

    credits = pack?.credits;
    expiresAt = pack.validDays
      ? new Date(Date.now() + pack.validDays * 24 * 60 * 60 * 1000)
      : null;
  }

  const wallet = payment.user.wallet;

  await prisma.$transaction(async (tx) => {
    await tx.creditTransaction.create({
      data: {
        walletId: wallet.id,
        type: "CREDIT",
        amount: credits,
        reason: payment.planId ? "plan purchase" : "pack purchase",
        expiresAt,
      },
    });

    await tx.wallet.update({
      where: {
        id: wallet.id,
      },
      data: {
        balance: { increment: credits },
      },
    });

    await tx.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: "SUCCESS",
      },
    });

    if (payment.planId) {
      await tx.userSubscription.create({
        data: {
          userId: payment.user.id,
          planId: payment.planId,
          status: "ACTIVE",
          startDate: new Date(),
          endDate,
        },
      });
    }
  });

  return res.status(200).json({
    message: "Payment processed",
  });
};

export const getPlans = async (req: any, res: any) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { active: true },
    });
    return res.status(200).json({ plans });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getPacks = async (req: any, res: any) => {
  try {
    const packs = await prisma.creditPack.findMany({
      where: { active: true },
    });

    return res.status(200).json({ packs });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getWalletBalance = async (req: any, res: any) => {
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

    return res.status(200).json({
      balance: spendable,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
