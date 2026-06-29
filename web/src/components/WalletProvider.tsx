"use client";

import * as React from "react";
import {
  connectWallet,
  disconnectWallet,
  getConnectedAddress,
  isSiteAllowed,
  verifyNetwork,
  fetchXlmBalance,
  WalletError,
} from "@/lib/wallet";

const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015";

type WalletContextValue = {
  address:      string | null;
  xlmBalance:   string | null;      // native XLM balance, e.g. "9999.9931370"
  isConnecting: boolean;
  error:        string | null;
  connect:      () => Promise<void>;
  disconnect:   () => void;
  refreshBalance: () => Promise<void>;
};

const WalletContext = React.createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address,      setAddress]      = React.useState<string | null>(null);
  const [xlmBalance,   setXlmBalance]   = React.useState<string | null>(null);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [error,        setError]        = React.useState<string | null>(null);

  // Fetch and cache the XLM balance whenever the address changes
  const refreshBalance = React.useCallback(async () => {
    if (!address) { setXlmBalance(null); return; }
    try {
      const bal = await fetchXlmBalance(address);
      setXlmBalance(bal);
    } catch {
      setXlmBalance(null);
    }
  }, [address]);

  // On first load, silently restore the connection if already granted
  React.useEffect(() => {
    (async () => {
      try {
        const allowed = await isSiteAllowed();
        if (allowed) {
          const existing = await getConnectedAddress();
          if (existing) setAddress(existing);
        }
      } catch {
        // Silent — best-effort background check
      }
    })();
  }, []);

  // Refresh balance whenever address changes
  React.useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  const connect = React.useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const addr = await connectWallet();
      await verifyNetwork(NETWORK_PASSPHRASE);
      setAddress(addr);
    } catch (err) {
      const message = err instanceof WalletError ? err.message : "Failed to connect wallet.";
      setError(message);
      setAddress(null);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = React.useCallback(() => {
    // disconnectWallet() is a no-op at the SDK level (Freighter has no
    // revoke API); clearing local state here is the disconnect behaviour.
    disconnectWallet().catch(() => {});
    setAddress(null);
    setXlmBalance(null);
    setError(null);
  }, []);

  return (
    <WalletContext.Provider
      value={{ address, xlmBalance, isConnecting, error, connect, disconnect, refreshBalance }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = React.useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within a WalletProvider.");
  return ctx;
}
