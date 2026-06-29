"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletConnectButton } from "./WalletConnectButton";
import { NetworkStatusPill } from "./NetworkStatusPill";
import { cn } from "@/lib/utils";
import { Layers } from "lucide-react";

const links = [
  { href: "/",              label: "Dashboard"    },
  { href: "/referrals",     label: "Referrals"    },
  { href: "/referrals/new", label: "New Referral" },
  { href: "/commissions",   label: "Commissions"  },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-night/70 backdrop-blur-xl">
      <div className="container flex flex-wrap items-center justify-between gap-3 py-3">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-glow transition-shadow group-hover:shadow-[0_0_24px_4px_hsl(162_100%_41%_/_0.45)]">
            <Layers className="h-4 w-4 text-night" strokeWidth={2.5} />
          </div>
          <span className="font-display text-base font-bold tracking-tight">
            <span className="gradient-text">CommissionChain</span>
            <span className="text-muted-foreground"> PH</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex gap-1">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-surface-raised hover:text-foreground"
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side: network pill + wallet */}
        <div className="flex items-center gap-3">
          <NetworkStatusPill />
          <WalletConnectButton />
        </div>
      </div>
    </header>
  );
}
