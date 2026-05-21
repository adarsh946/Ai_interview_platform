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

  if (payment.status == "SUCCESS") {
    return res.status(200).json({
      message: "already processed",
    });
  }

  let credits: number = 0;
  let expiresAt: Date | null = null;

  if (payment.planId) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: {
        id: payment.planId,
      },
    });

    credits = plan?.creditsPerCycle;
  } else if (payment.packId) {
    const pack = await prisma.creditPack.findUnique({
      where: {
        id: payment.packId,
      },
    });

    credits = pack?.credits;
  }

  await prisma.$transaction(async (tx) => {
    await tx.creditTransaction.create({
      data: {
        walletId: payment.user.wallet.id,
        type: "CREDIT",
        amount: credits,
        reason: payment.planId ? "plan purchase" : "pack purchase",
        expiresAt,
      },
    });
  });
};
