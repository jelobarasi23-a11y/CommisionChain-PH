"use client";

import * as React from "react";
import { useWallet } from "./WalletProvider";
import { ApprovalStamp } from "./ApprovalStamp";
import { Button } from "./ui/button";
import { CopyableAddress } from "./CopyableAddress";
import { TransactionOverlay, type TxStage } from "./TransactionOverlay";
import { useToast } from "./Toast";
import { formatAmount, formatDate, explorerTxUrl } from "@/lib/format";
import { getViewerRole, statusCaption } from "@/lib/status";
import { signTransactionXdr } from "@/lib/wallet";
import type { Referral } from "@/lib/types";
import { ExternalLink, Check, X, Banknote, Inbox } from "lucide-react";

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
  claim:   (r) => `${formatAmount(r.commissionAmount)} was sent straight to your wallet.`,
};

async function runAction(
  action: Action,
  onChainId: number,
  address: string,
  onStage: (s: TxStage) => void
): Promise<{ txHash: string }> {
  const endpoint  = `/api/referrals/${action}`;
  const bodyBase  = action === "claim"
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

export function ReferralTable({
  referrals,
  onChanged,
  emptyMessage = "No referrals yet.",
}: {
  referrals: Referral[];
  onChanged?: () => void;
  emptyMessage?: string;
}) {
  const { address }  = useWallet();
  const { showToast } = useToast();
  const [pendingRow, setPendingRow]     = React.useState<number | null>(null);
  const [activeAction, setActiveAction] = React.useState<Action | null>(null);
  const [stage, setStage]               = React.useState<TxStage>("building");
  const [overlayOpen, setOverlayOpen]   = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  async function handleAction(action: Action, referral: Referral) {
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
        <div>
          <p className="text-sm font-medium">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/6 text-xs uppercase tracking-wider text-muted-foreground">
              <th className="py-3 pr-4 font-medium">Status</th>
              <th className="py-3 pr-4 font-medium">Client</th>
              <th className="py-3 pr-4 font-medium">Business</th>
              <th className="py-3 pr-4 font-medium">Commission</th>
              <th className="py-3 pr-4 font-medium">Submitted</th>
              <th className="py-3 pr-4 font-medium">Proof</th>
              <th className="py-3 pr-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {referrals.map((r, i) => {
              const role        = getViewerRole(r, address);
              const latestTx    = r.transactions[0];
              const isRowPending = pendingRow === r.onChainId;

              return (
                <tr
                  key={r.id}
                  style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                  className="animate-in fade-in slide-in-from-bottom-1 border-b border-white/4 align-middle duration-300 last:border-0 hover:bg-surface-raised/40 transition-colors"
                >
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-3">
                      <ApprovalStamp status={r.status} size="sm" />
                      <span className="max-w-[11rem] text-xs leading-snug text-muted-foreground">
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
                  <td className="py-4 pr-4">
                    {latestTx ? (
                      <a
                        href={explorerTxUrl(latestTx.txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={latestTx.txHash}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        View proof
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="py-4 pr-4 text-right">
                    <div className="flex justify-end gap-2">
                      {role === "business" && r.status === "PENDING" && (
                        <>
                          <Button size="sm" variant="default" disabled={isRowPending} onClick={() => handleAction("approve", r)}>
                            <Check className="h-3.5 w-3.5" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" disabled={isRowPending} onClick={() => handleAction("reject", r)}>
                            <X className="h-3.5 w-3.5" />
                            Reject
                          </Button>
                        </>
                      )}
                      {role === "agent" && r.status === "APPROVED" && (
                        <Button size="sm" variant="accent" disabled={isRowPending} onClick={() => handleAction("claim", r)}>
                          <Banknote className="h-3.5 w-3.5" />
                          Claim
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
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
