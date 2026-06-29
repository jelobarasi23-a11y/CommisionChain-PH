"use client";

import * as React from "react";
import { useWallet } from "./WalletProvider";
import { ApprovalStamp } from "./ApprovalStamp";
import { Button } from "./ui/button";
import { CopyableAddress } from "./CopyableAddress";
import { TransactionOverlay, type TxStage } from "./TransactionOverlay";
import { ConfettiOverlay } from "./ConfettiOverlay";
import { useToast } from "./Toast";
import { formatAmount, formatDate, explorerTxUrl } from "@/lib/format";
import { getViewerRole, statusCaption } from "@/lib/status";
import { signTransactionXdr } from "@/lib/wallet";
import type { Referral } from "@/lib/types";
import {
  ExternalLink, Check, X, Banknote, Inbox,
  ChevronDown, ChevronRight, Clock, CheckCircle2,
  XCircle, Coins, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015";

type Action = "approve" | "reject" | "claim";

const ACTION_TITLE: Record<Action, string> = {
  approve: "Setting the money aside",
  reject:  "Declining the referral",
  claim:   "Sending the payout to your wallet",
};

const ACTION_SUCCESS: Record<Action, (r: Referral) => string> = {
  approve: (r) => `${formatAmount(r.commissionAmount)} is now in escrow for ${r.clientName}'s referral.`,
  reject:  (r) => `Declined ${r.clientName}'s referral.`,
  claim:   (r) => `${formatAmount(r.commissionAmount)} was sent straight to your wallet. 🎉`,
};

const TX_TYPE_ICON: Record<string, React.ElementType> = {
  CREATE_REFERRAL:   Zap,
  APPROVE_REFERRAL:  CheckCircle2,
  REJECT_REFERRAL:   XCircle,
  CLAIM_COMMISSION:  Coins,
};

const TX_TYPE_COLOR: Record<string, string> = {
  CREATE_REFERRAL:   "text-primary bg-primary/10 border-primary/20",
  APPROVE_REFERRAL:  "text-[hsl(var(--gold))] bg-[hsl(var(--gold)/_0.1)] border-[hsl(var(--gold)/_0.2)]",
  REJECT_REFERRAL:   "text-[hsl(var(--coral))] bg-[hsl(var(--coral)/_0.1)] border-[hsl(var(--coral)/_0.2)]",
  CLAIM_COMMISSION:  "text-primary bg-primary/10 border-primary/20",
};

const TX_TYPE_LABEL: Record<string, string> = {
  CREATE_REFERRAL:   "Referral submitted",
  APPROVE_REFERRAL:  "Commission escrowed",
  REJECT_REFERRAL:   "Referral rejected",
  CLAIM_COMMISSION:  "Payout sent to wallet",
};

async function runAction(
  action: Action,
  onChainId: number,
  address: string,
  onStage: (s: TxStage) => void
): Promise<{ txHash: string }> {
  const endpoint = `/api/referrals/${action}`;
  const bodyBase = action === "claim"
    ? { onChainId, agentPublicKey: address }
    : { onChainId, businessPublicKey: address };

  onStage("building");
  const buildRes  = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ step: "build", ...bodyBase }) });
  const buildData = await buildRes.json();
  if (!buildRes.ok) throw new Error(buildData.error ?? `Failed to build ${action} transaction.`);

  onStage("awaiting-signature");
  const signedXdr = await signTransactionXdr(buildData.xdr, NETWORK_PASSPHRASE, address);

  onStage("submitting");
  const submitRes  = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ step: "submit", signedXdr, ...bodyBase }) });
  const submitData = await submitRes.json();
  if (!submitRes.ok) throw new Error(submitData.error ?? `Failed to submit ${action} transaction.`);

  return { txHash: submitData.txHash };
}

/** Expandable transaction timeline shown when a row is clicked open. */
function TxTimeline({ referral }: { referral: Referral }) {
  const txs = [...referral.transactions].reverse(); // oldest first
  if (txs.length === 0) {
    return <p className="py-3 text-xs text-muted-foreground">No transaction history yet.</p>;
  }
  return (
    <div className="relative mt-2 ml-1 flex flex-col gap-4 pb-2">
      {/* Vertical track */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-white/8" aria-hidden />
      {txs.map((tx, i) => {
        const Icon   = TX_TYPE_ICON[tx.type] ?? Zap;
        const colors = TX_TYPE_COLOR[tx.type] ?? "text-muted-foreground bg-surface-raised border-white/10";
        const label  = TX_TYPE_LABEL[tx.type] ?? tx.type;
        return (
          <div key={tx.id} className="relative flex items-start gap-3 pl-0">
            {/* Node */}
            <div className={cn("relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border", colors)}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">{label}</span>
                {i === txs.length - 1 && (
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">Latest</span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{formatDate(tx.createdAt)}</span>
                <a
                  href={explorerTxUrl(tx.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                >
                  View on Stellar Expert
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ReferralTable({
  referrals,
  onChanged,
  emptyMessage = "No referrals yet.",
}: {
  referrals: Referral[];
  onChanged?: () => void;
  emptyMessage?: string;
}) {
  const { address }   = useWallet();
  const { showToast } = useToast();

  const [pendingRow, setPendingRow]     = React.useState<number | null>(null);
  const [activeAction, setActiveAction] = React.useState<Action | null>(null);
  const [stage, setStage]               = React.useState<TxStage>("building");
  const [overlayOpen, setOverlayOpen]   = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [expandedRow, setExpandedRow]   = React.useState<string | null>(null);
  const [confetti, setConfetti]         = React.useState(false);

  async function handleAction(action: Action, referral: Referral, e: React.MouseEvent) {
    e.stopPropagation(); // don't toggle row expand
    if (!address) return;
    setPendingRow(referral.onChainId);
    setActiveAction(action);
    setErrorMessage(null);
    setOverlayOpen(true);
    setStage("building");
    try {
      await runAction(action, referral.onChainId, address, setStage);
      setStage("success");
      showToast(ACTION_SUCCESS[action](referral), "success");
      if (action === "claim") {
        setConfetti(true);
        window.setTimeout(() => setConfetti(false), 4000);
      }
      onChanged?.();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStage("error");
    } finally {
      setPendingRow(null);
    }
  }

  if (referrals.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-14 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-raised">
          <Inbox className="h-7 w-7 text-muted-foreground/40" aria-hidden />
        </div>
        <p className="text-sm font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <ConfettiOverlay trigger={confetti} />
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/6 text-xs uppercase tracking-wider text-muted-foreground">
              <th className="py-3 pr-2 w-5 font-medium" />
              <th className="py-3 pr-4 font-medium">Status</th>
              <th className="py-3 pr-4 font-medium">Client</th>
              <th className="py-3 pr-4 font-medium">Business</th>
              <th className="py-3 pr-4 font-medium">Commission</th>
              <th className="py-3 pr-4 font-medium">Submitted</th>
              <th className="py-3 pr-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {referrals.map((r, i) => {
              const role         = getViewerRole(r, address);
              const isRowPending = pendingRow === r.onChainId;
              const isExpanded   = expandedRow === r.id;

              return (
                <React.Fragment key={r.id}>
                  {/* Main row */}
                  <tr
                    style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                    onClick={() => setExpandedRow(isExpanded ? null : r.id)}
                    className={cn(
                      "animate-in fade-in slide-in-from-bottom-1 border-b border-white/4 align-middle duration-300 cursor-pointer transition-colors",
                      isExpanded ? "bg-surface-raised/60" : "hover:bg-surface-raised/40",
                      !isExpanded && "last:border-0"
                    )}
                  >
                    {/* Expand chevron */}
                    <td className="py-4 pl-1 pr-2 w-5">
                      {isExpanded
                        ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      }
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <ApprovalStamp status={r.status} size="sm" />
                        <span className="max-w-[10rem] text-xs leading-snug text-muted-foreground">
                          {statusCaption(r, role)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 pr-4 font-medium">{r.clientName}</td>
                    <td className="py-4 pr-4">
                      <div className="font-medium">{r.businessName}</div>
                      <CopyableAddress address={r.business.publicKey} />
                    </td>
                    <td className="py-4 pr-4 font-mono font-semibold text-primary tabular-nums">
                      {formatAmount(r.commissionAmount)}
                    </td>
                    <td className="py-4 pr-4 text-muted-foreground">{formatDate(r.createdAt)}</td>
                    <td className="py-4 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        {role === "business" && r.status === "PENDING" && (
                          <>
                            <Button size="sm" variant="default" disabled={isRowPending} onClick={(e) => handleAction("approve", r, e)}>
                              <Check className="h-3.5 w-3.5" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" disabled={isRowPending} onClick={(e) => handleAction("reject", r, e)}>
                              <X className="h-3.5 w-3.5" /> Reject
                            </Button>
                          </>
                        )}
                        {role === "agent" && r.status === "APPROVED" && (
                          <Button size="sm" variant="accent" disabled={isRowPending} onClick={(e) => handleAction("claim", r, e)}>
                            <Banknote className="h-3.5 w-3.5" /> Claim
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expandable timeline row */}
                  {isExpanded && (
                    <tr className="border-b border-white/4 bg-night/40">
                      <td colSpan={7} className="px-8 pb-5 pt-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Transaction history
                        </p>
                        <TxTimeline referral={r} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <TransactionOverlay
        open={overlayOpen}
        stage={stage}
        title={activeAction ? ACTION_TITLE[activeAction] : ""}
        errorMessage={errorMessage}
        onClose={() => setOverlayOpen(false)}
      />
    </>
  );
}
