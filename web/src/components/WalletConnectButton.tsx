"use client";
import * as React from "react";
import { useWallet } from "./WalletProvider";
import { WalletSelectModal } from "./WalletSelectModal";
import { Button } from "./ui/button";
import { CopyableAddress } from "./CopyableAddress";
import { Wallet, LogOut, Send, Zap } from "lucide-react";
import Link from "next/link";

const WALLET_LABEL: Record<string, string> = { freighter: "Freighter", albedo: "Albedo" };

export function WalletConnectButton() {
  const { address, xlmBalance, walletType, isConnecting, disconnect } = useWallet();
  const [modalOpen, setModalOpen] = React.useState(false);

  if (address) {
    return (
      <div className="flex items-center gap-2">
        {xlmBalance !== null && (
          <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-white/8 bg-surface px-2.5 py-1.5 text-xs">
            <span className="font-mono font-semibold text-primary">{parseFloat(xlmBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            <span className="text-muted-foreground">XLM</span>
          </div>
        )}
        <div className="flex items-center gap-2 rounded-lg border border-white/8 bg-surface px-3 py-2 text-sm">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60"/>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"/>
          </span>
          {walletType && <span className="hidden text-[10px] font-semibold text-muted-foreground sm:inline">{WALLET_LABEL[walletType]}</span>}
          <CopyableAddress address={address} chars={5} className="text-foreground font-medium"/>
        </div>
        <Link href="/xlm">
          <Button size="sm" variant="secondary" title="Send XLM"><Send className="h-3.5 w-3.5"/><span className="hidden sm:inline">Send XLM</span></Button>
        </Link>
        <Button size="sm" variant="outline" onClick={disconnect} title="Disconnect"><LogOut className="h-3.5 w-3.5"/><span className="hidden sm:inline">Disconnect</span></Button>
      </div>
    );
  }

  return (
    <>
      <Button onClick={() => setModalOpen(true)} disabled={isConnecting} size="sm">
        {isConnecting ? <><Zap className="h-3.5 w-3.5 animate-pulse"/>Connecting...</> : <><Wallet className="h-3.5 w-3.5"/>Connect Wallet</>}
      </Button>
      <WalletSelectModal open={modalOpen} onClose={() => setModalOpen(false)}/>
    </>
  );
}
