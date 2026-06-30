"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletConnectButton } from "./WalletConnectButton";
import { NetworkStatusPill } from "./NetworkStatusPill";
import { cn } from "@/lib/utils";
import { Layers, Menu, X } from "lucide-react";

const links = [
  { href: "/",              label: "Dashboard"    },
  { href: "/referrals",     label: "Referrals"    },
  { href: "/referrals/new", label: "New Referral" },
  { href: "/commissions",   label: "Commissions"  },
];

export function NavBar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Close menu on route change
  React.useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-night/70 backdrop-blur-xl">
      <div className="container flex items-center justify-between gap-3 py-3">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-glow transition-shadow group-hover:shadow-[0_0_24px_4px_hsl(162_100%_41%_/_0.45)]">
            <Layers className="h-4 w-4 text-night" strokeWidth={2.5}/>
          </div>
          <span className="font-display text-base font-bold tracking-tight">
            <span className="gradient-text">CommissionChain</span>
            <span className="text-muted-foreground"> PH</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex gap-1">
          {links.map((l) => (
            <Link key={l.href} href={l.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150",
                pathname === l.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-surface-raised hover:text-foreground"
              )}>
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:block"><NetworkStatusPill/></div>
          <div className="hidden md:block"><WalletConnectButton/></div>
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden rounded-lg border border-white/8 bg-surface p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-4 w-4"/> : <Menu className="h-4 w-4"/>}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/5 bg-night/95 backdrop-blur-xl animate-in slide-in-from-top-1 fade-in duration-200">
          <nav className="container flex flex-col gap-1 py-3">
            {links.map((l) => (
              <Link key={l.href} href={l.href}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === l.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-surface-raised hover:text-foreground"
                )}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="container pb-4 pt-1 border-t border-white/5">
            <WalletConnectButton/>
          </div>
        </div>
      )}
    </header>
  );
}
