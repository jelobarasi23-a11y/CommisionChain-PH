"use client";

import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { StatCard } from "@/components/StatCard";
import { ReferralTable } from "@/components/ReferralTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useWallet } from "@/components/WalletProvider";
import { useReferrals } from "@/lib/use-referrals";
import { formatAmount } from "@/lib/format";
import {
  Clock, CheckCircle2, Wallet, PlusCircle,
  FileText, Lock, HandCoins, ArrowRight, Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const HOW_IT_WORKS: { icon: LucideIcon; step: string; title: string; body: string; color: string; bg: string }[] = [
  {
    icon: FileText,
    step: "01",
    title: "Record the referral",
    body: "The agent fills in who they referred and what the commission should be — written on-chain for everyone to verify.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Lock,
    step: "02",
    title: "Money gets set aside",
    body: "When the business approves, the commission moves into escrow immediately — not a promise, the actual funds.",
    color: "text-[hsl(var(--gold))]",
    bg: "bg-[hsl(var(--gold)/_0.1)]",
  },
  {
    icon: HandCoins,
    step: "03",
    title: "Agent gets paid",
    body: "The agent withdraws straight to their wallet any time after approval — no invoices, no waiting on payroll.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
];

export default function DashboardPage() {
  const { address } = useWallet();
  const { referrals, isLoading, refresh } = useReferrals();

  const pendingCount  = referrals.filter((r) => r.status === "PENDING").length;
  const approvedCount = referrals.filter((r) => r.status === "APPROVED").length;
  const claimedTotal  = referrals
    .filter((r) => r.status === "CLAIMED")
    .reduce((sum, r) => sum + Number(r.commissionAmount), 0);

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      {/* ── Hero section ─────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-white/5">
        {/* Atmospheric glow orbs */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-20 right-0 h-[400px] w-[400px] rounded-full bg-[hsl(var(--gold)/_0.04)] blur-[80px]" />

        <div className="container relative py-14">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Zap className="h-3 w-3" />
            Live on Stellar Testnet
          </div>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
            Commission payouts,{" "}
            <span className="gradient-text">trustless</span>
          </h1>
          <p className="mt-3 max-w-xl text-base text-muted-foreground leading-relaxed">
            No more spreadsheets or chasing payments. Commissions are set aside
            the moment a referral is approved — agents withdraw directly to their
            wallet.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/referrals/new">
              <Button size="lg">
                <PlusCircle className="h-4 w-4" />
                New Referral
              </Button>
            </Link>
            <Link href="/referrals">
              <Button size="lg" variant="secondary">
                View all referrals
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <main className="container py-10 space-y-8">

        {/* Wallet banner */}
        {!address && (
          <div className="flex items-center gap-4 rounded-xl border border-[hsl(var(--gold)/_0.2)] bg-[hsl(var(--gold)/_0.05)] px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--gold)/_0.12)]">
              <Wallet className="h-5 w-5 text-[hsl(var(--gold))]" />
            </div>
            <div>
              <p className="text-sm font-medium">Connect your wallet to get started</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Freighter is a free browser extension — install it at{" "}
                <a href="https://freighter.app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  freighter.app
                </a>
                , then click <strong>Connect Wallet</strong> top-right.
              </p>
            </div>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Pending referrals"
            value={pendingCount}
            description="Submitted, waiting for business review."
            icon={Clock}
            accent="gold"
          />
          <StatCard
            label="Awaiting claim"
            value={approvedCount}
            description="Approved — funds escrowed, ready to withdraw."
            icon={CheckCircle2}
            accent="teal"
          />
          <StatCard
            label="Total settled"
            value={claimedTotal}
            format={formatAmount}
            description="Already paid out to agents."
            icon={Wallet}
            accent="teal"
          />
        </div>

        {/* How it works */}
        <Card>
          <CardHeader>
            <CardTitle>How it works</CardTitle>
            <CardDescription>Three steps, each a real signed transaction on Stellar.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {HOW_IT_WORKS.map((step) => (
                <div key={step.step} className="relative flex flex-col gap-3 rounded-xl border border-white/5 bg-night/40 p-5">
                  <div className="flex items-center justify-between">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${step.bg}`}>
                      <step.icon className={`h-5 w-5 ${step.color}`} />
                    </div>
                    <span className="font-mono text-3xl font-bold text-white/5 select-none">{step.step}</span>
                  </div>
                  <p className="font-display text-sm font-semibold">{step.title}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent referrals */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Recent referrals</CardTitle>
              <CardDescription>The five most recently submitted across the platform.</CardDescription>
            </div>
            <Link href="/referrals">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3 py-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 w-full rounded-lg animate-shimmer" />
                ))}
              </div>
            ) : (
              <ReferralTable
                referrals={referrals.slice(0, 5)}
                onChanged={refresh}
                emptyMessage="No referrals yet — submit the first one."
              />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
