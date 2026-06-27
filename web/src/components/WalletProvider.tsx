"use client";

import * as React from "react";
import {
  connectWallet,
  getConnectedAddress,
  isSiteAllowed,
  verifyNetwork,
  WalletError,
} from "@/lib/wallet";

const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015";

type WalletContextValue = {
  address: string | null;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
};

const WalletContext = React.createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = React.useState<string | null>(null);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // On first load, silently restore the connection if this site was
  // already granted access on a previous visit — no need to make the
  // person click "Connect" again every single time.
  React.useEffect(() => {
    (async () => {
      try {
        const allowed = await isSiteAllowed();
        if (allowed) {
          const existing = await getConnectedAddress();
          if (existing) setAddress(existing);
        }
      } catch {
        // Silent — this is a best-effort background check, not a
        // user-initiated action, so there's nothing useful to surface yet.
      }
    })();
  }, []);

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

  return (
    <WalletContext.Provider value={{ address, isConnecting, error, connect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = React.useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within a WalletProvider.");
  return ctx;
}
