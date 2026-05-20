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
