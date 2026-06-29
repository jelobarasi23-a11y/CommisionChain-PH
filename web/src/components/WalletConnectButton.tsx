"use client";

import { useWallet } from "./WalletProvider";
import { Button } from "./ui/button";
import { CopyableAddress } from "./CopyableAddress";
import { Wallet, Zap, LogOut, Send } from "lucide-react";
import Link from "next/link";

export function WalletConnectButton() {
  const { address, xlmBalance, isConnecting, error, connect, disconnect } = useWallet();

  if (address) {
    return (
      <div className="flex items-center gap-2">
        {/* XLM balance */}
        {xlmBalance !== null && (
          <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-white/8 bg-surface px-2.5 py-1.5 text-xs">
            <span className="font-mono font-semibold text-primary">
              {parseFloat(xlmBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
            <span className="text-muted-foreground">XLM</span>
          </div>
        )}

        {/* Address pill */}
        <div className="flex items-center gap-2 rounded-lg border border-white/8 bg-surface px-3 py-2 text-sm">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <span className="text-xs text-muted-foreground">Connected</span>
          <CopyableAddress address={address} chars={5} className="text-foreground font-medium" />
        </div>

        {/* Send XLM */}
        <Link href="/xlm">
          <Button size="sm" variant="secondary" title="Send XLM">
            <Send className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Send XLM</span>
          </Button>
        </Link>

        {/* Disconnect */}
        <Button
          size="sm"
          variant="outline"
          onClick={disconnect}
          title="Disconnect wallet"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Disconnect</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={connect} disabled={isConnecting} size="sm">
        {isConnecting ? (
          <>
            <Zap className="h-3.5 w-3.5 animate-pulse" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="h-3.5 w-3.5" />
            Connect Wallet
          </>
        )}
      </Button>
      {error && (
        <p className="max-w-xs text-right text-xs text-[hsl(var(--coral))]">{error}</p>
      )}
    </div>
  );
}
