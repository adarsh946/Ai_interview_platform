"use client";

import Link from "next/link";

import { PricingSection } from "@/components/pricing/PricingSection";

export default function PricingPage() {
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
      <PricingSection />

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
