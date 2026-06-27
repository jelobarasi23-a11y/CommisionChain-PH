"use client";

import * as React from "react";
import { NavBar } from "@/components/NavBar";
import { ReferralTable } from "@/components/ReferralTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useReferrals } from "@/lib/use-referrals";
import { cn } from "@/lib/utils";
import type { ReferralStatus } from "@/lib/types";

const TABS: { label: string; value: ReferralStatus | "ALL"; color: string }[] = [
  { label: "All",      value: "ALL",      color: "" },
  { label: "Pending",  value: "PENDING",  color: "data-[active=true]:border-[hsl(var(--gold))] data-[active=true]:text-[hsl(var(--gold))]" },
  { label: "Approved", value: "APPROVED", color: "data-[active=true]:border-primary data-[active=true]:text-primary" },
  { label: "Rejected", value: "REJECTED", color: "data-[active=true]:border-[hsl(var(--coral))] data-[active=true]:text-[hsl(var(--coral))]" },
  { label: "Claimed",  value: "CLAIMED",  color: "data-[active=true]:border-primary data-[active=true]:text-primary" },
];

export default function ReferralsPage() {
  const { referrals, isLoading, error, refresh } = useReferrals();
  const [tab, setTab] = React.useState<ReferralStatus | "ALL">("ALL");

  const filtered = tab === "ALL" ? referrals : referrals.filter((r) => r.status === tab);

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">Referrals</h1>
          <p className="mt-1 text-muted-foreground">
            Every referral submitted on the platform, with live status from the contract.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="mb-5 flex flex-wrap gap-2">
          {TABS.map((t) => {
            const active = tab === t.value;
            return (
              <button
                key={t.value}
                data-active={active}
                onClick={() => setTab(t.value)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-150",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-white/8 bg-surface text-muted-foreground hover:border-white/14 hover:text-foreground",
                  t.color
                )}
              >
                {t.label}
                {tab === t.value && referrals.length > 0 && (
                  <span className="ml-2 rounded-full bg-primary/20 px-1.5 py-0.5 text-xs">
                    {filtered.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <Card>
          <CardContent className="pt-6">
            {error && <p className="py-6 text-center text-sm text-[hsl(var(--coral))]">{error}</p>}
            {isLoading ? (
              <div className="space-y-3 py-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 w-full rounded-lg animate-shimmer" />
                ))}
              </div>
            ) : (
              !error && <ReferralTable referrals={filtered} onChanged={refresh} />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
