import { PrismaClient, SubscriptionInterval } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const plans: {
    name: string;
    price: number;
    creditsPerCycle: number;
    interval: SubscriptionInterval;
    active: boolean;
  }[] = [
    {
      name: "Basic Plan",
      price: 199,
      creditsPerCycle: 10,
      interval: SubscriptionInterval.MONTHLY,
      active: true,
    },
    {
      name: "Pro Plan",
      price: 499,
      creditsPerCycle: 30,
      interval: SubscriptionInterval.MONTHLY,
      active: true,
    },
    {
      name: "Pro Yearly",
      price: 4999,
      creditsPerCycle: 360,
      interval: SubscriptionInterval.YEARLY,
      active: true,
    },
  ];

  const packs = [
    {
      name: "Starter",
      price: 99,
      credits: 5,
      validDays: null,
    },
    {
      name: "Booster",
      price: 199,
      credits: 12,
      validDays: null,
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: {
        name: plan.name,
      },
      update: plan,
      create: { ...plan, active: true },
    });
  }

  for (const pack of packs) {
    await prisma.creditPack.upsert({
      where: {
        name: pack.name,
      },
      update: pack,
      create: { ...pack, active: true },
    });
  }

  console.log("Seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
