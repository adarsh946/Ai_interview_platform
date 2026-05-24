"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import api from "@/lib/api";
import { loadRazorpay } from "@/lib/loadRazorpay";
import { useAuthStore } from "@/store/authStore";
import { Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Add this above your component:
const planDisplayData: Record<
  string,
  {
    features: string[];
    popular: boolean;
    pro: boolean;
    yearlyPrice: number;
    credits: string;
  }
> = {
  "Basic Plan": {
    features: [
      "10 credits/month",
      "All interview types",
      "Detailed AI feedback",
      "Resume-based questions",
    ],
    popular: true,
    pro: false,
    yearlyPrice: 159,
    credits: "10 credits per month",
  },
  "Pro Plan": {
    features: [
      "30 credits/month",
      "Priority AI responses",
      "Expression analysis",
      "All interview types",
      "Detailed AI feedback",
    ],
    popular: false,
    pro: true,
    yearlyPrice: 399,
    credits: "30 credits per month",
  },
  "Pro Yearly": {
    features: [
      "360 credits/year",
      "Best value",
      "Priority AI responses",
      "Expression analysis",
    ],
    popular: false,
    pro: true,
    yearlyPrice: 4999,
    credits: "360 credits per year",
  },
};

const faqs = [
  {
    question: "What is a credit?",
    answer:
      "1 credit = 1 complete mock interview session. Each session includes AI-powered questions, real-time feedback, and a detailed performance report.",
  },
  {
    question: "Do credits expire?",
    answer:
      "Subscription credits expire at the end of each billing cycle. One-time pack credits never expire — use them whenever you want.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes, you can cancel your subscription anytime from your dashboard. You&apos;ll continue to have access until the end of your current billing period.",
  },
  {
    question: "What interview types are available?",
    answer:
      "We offer technical interviews, behavioral interviews, case studies, and industry-specific mock interviews for roles in tech, finance, consulting, and more.",
  },
];

export default function PricingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [packs, setPacks] = useState<any[]>([]);
  const [isYearly, setIsYearly] = useState(false);

  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchData = async () => {
      const plan = await api.get("/payment/plans");
      setPlans(plan.data.plans);
      const pack = await api.get("/payment/packs");
      setPacks(pack.data.packs);
    };
    fetchData();
  }, []);

  const handleBuy = async (type: "plan" | "pack", id: string) => {
    try {
      const loaded = await loadRazorpay();
      if (!loaded) {
        alert("Payment system failed to load. Please try again.");
        return;
      }

      const response = await api.post("/payment/create-order", {
        type,
        id,
      });
      const { orderId, amount, currency, keyId } = response.data;

      const options = {
        key: keyId,
        amount,
        currency,
        order_id: orderId,
        name: "baatcheet",
        description: "Interview Credits",
        handler: function (response: any) {
          // payment successful
          // response.razorpay_payment_id
          // response.razorpay_order_id
          alert("Payment successful!");
          router.push("/dashboard");
        },
        prefill: {
          email: user?.email, // from your auth store
        },
        theme: {
          color: "#10b981", // emerald to match your theme
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error(error);
      alert("Payment failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">
                BC
              </span>
            </div>
            <span className="text-xl font-semibold tracking-tight">
              BaatCheet
            </span>
          </Link>
          <nav>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </header>
      <main>
        <section className="px-6 pt-20 pb-12 text-center">
          <Badge
            variant="secondary"
            className="mb-6 rounded-full px-4 py-1.5 text-sm font-medium"
          >
            🎉 3 free credits on signup
          </Badge>
          <h1 className="mx-auto max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
            Buy credits and practice interviews anytime. No subscription
            lock-in.
          </p>
        </section>
        <div className="flex items-center justify-center gap-4 pb-12">
          <span
            className={`text-sm font-medium transition-colors ${
              !isYearly ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            Monthly
          </span>
          <Switch
            checked={isYearly}
            onCheckedChange={() => setIsYearly(!isYearly)}
          />
          <span
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${
              isYearly ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            Yearly
            <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">
              -20%
            </Badge>
          </span>
        </div>
        <section className="mx-auto max-w-6xl px-6">
          <h2 className="mb-8 text-center text-2xl font-semibold">
            Subscription Plans
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Free plan — static, not from DB */}
            <Card className="relative flex flex-col border border-border transition-all duration-200 hover:shadow-lg">
              <CardHeader className="pb-4">
                <h3 className="text-lg font-semibold">Free</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">₹0</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  3 credits on signup
                </p>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {[
                    "3 credits on signup",
                    "All interview types",
                    "Basic feedback",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => router.push("/register")}
                >
                  Get Started
                </Button>
              </CardFooter>
            </Card>

            {plans
              .filter((plan: any) =>
                isYearly
                  ? plan.interval === "YEARLY"
                  : plan.interval === "MONTHLY"
              )
              .map((plan: any) => {
                const display = planDisplayData[plan.name] ?? {
                  features: [],
                  popular: false,
                  pro: false,
                  yearlyPrice: plan.price,
                  credits: `${plan.creditsPerCycle} credits`,
                };
                const displayPrice = isYearly
                  ? display.yearlyPrice
                  : plan.price;

                return (
                  <Card
                    key={plan.name}
                    className={`relative flex flex-col transition-all duration-200 hover:shadow-lg ${
                      display.pro
                        ? "border-2 border-primary shadow-md"
                        : display.popular
                        ? "border border-border shadow-md"
                        : "border border-border"
                    }`}
                  >
                    {display.popular && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary text-primary-foreground">
                        Popular
                      </Badge>
                    )}
                    {display.pro && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary text-primary-foreground">
                        Best Value
                      </Badge>
                    )}
                    <CardHeader className="pb-4">
                      <h3 className="text-lg font-semibold">{plan.name}</h3>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-4xl font-bold">
                          ₹{displayPrice}
                        </span>
                        {plan.price > 0 && (
                          <span className="text-muted-foreground">/month</span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {display.credits}
                      </p>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <ul className="space-y-3">
                        {display.features.map((feature) => (
                          <li
                            key={feature}
                            className="flex items-center gap-3 text-sm"
                          >
                            <Check className="h-4 w-4 shrink-0 text-primary" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        variant={plan.name === "Free" ? "outline" : "default"}
                        onClick={() =>
                          plan.name !== "Free" && handleBuy("plan", plan.id)
                        }
                      >
                        {plan.name === "Free"
                          ? "Get Started"
                          : `Get ${plan.name}`}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
          </div>
        </section>
        <section className="mx-auto mt-20 max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold">
              Just need a few interviews?
            </h2>
            <p className="mt-2 text-muted-foreground">
              Buy credit packs for one-time use. No subscription required.
            </p>
          </div>
          <div className="mx-auto mt-8 grid max-w-2xl gap-6 sm:grid-cols-2">
            {packs.map((pack) => (
              <Card
                key={pack.name}
                className="flex flex-col transition-all duration-200 hover:shadow-lg"
              >
                <CardHeader className="pb-4">
                  <h3 className="text-lg font-semibold">{pack.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">₹{pack.price}</span>
                    <span className="text-muted-foreground">one-time</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-foreground">
                      {pack.credits} credits
                    </p>
                    <p className="text-muted-foreground">
                      Credits never expire
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleBuy("pack", pack.id)}
                  >
                    Buy Pack
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
        <section className="mx-auto mt-20 max-w-3xl px-6 pb-20">
          <h2 className="mb-8 text-center text-2xl font-semibold">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-base font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>
      <footer className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} BaatCheet. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
