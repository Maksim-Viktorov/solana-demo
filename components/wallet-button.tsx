"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { address, formatDecimalFixedPoint, lamportsToSol, type Address, type Lamports } from "@solana/kit";
import {
  useConnect,
  useConnectedWallet,
  useDisconnect,
  useWallets,
  WalletReadyGate,
} from "@solana/kit-plugin-wallet/react";
import { useClient } from "@solana/react";
import { useTrackedDataSWR } from "@solana/react/swr";
import type { AppClient } from "./providers";
import { shortAddress } from "@/lib/format";

const solFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 });

// Initial getBalance plus a live account subscription, slot-deduped so an
// older value never overwrites a newer one.
function useBalance(accountAddress: Address) {
  const { rpc, rpcSubscriptions } = useClient<AppClient>();
  const spec = useMemo(
    () => ({
      initialValueSource: rpc.getBalance(accountAddress, { commitment: "confirmed" }),
      initialValueMapper: (lamports: Lamports) => lamports,
      streamSource: rpcSubscriptions.accountNotifications(accountAddress, { commitment: "confirmed" }),
      streamValueMapper: ({ lamports }: { lamports: Lamports }) => lamports,
    }),
    [rpc, rpcSubscriptions, accountAddress],
  );
  const { data, error } = useTrackedDataSWR(["devnet-balance", accountAddress], spec);
  return { lamports: data?.value ?? null, error };
}

function Balance({ accountAddress }: { accountAddress: Address }) {
  const { lamports, error } = useBalance(accountAddress);
  if (error) return <span>-- SOL</span>;
  if (lamports == null) return <span>... SOL</span>;
  return <span>{formatDecimalFixedPoint(solFormatter, lamportsToSol(lamports))} SOL</span>;
}

// Sign-In With Solana: server issues the message, wallet signs it, server
// verifies the signature and sets an httpOnly session cookie.
async function signIn(client: AppClient, walletAddress: string) {
  const nonceRes = await fetch("/api/auth/nonce", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ address: walletAddress }),
  });
  if (!nonceRes.ok) throw new Error("Could not get a sign-in nonce");
  const { message } = (await nonceRes.json()) as { message: string };
  const signature = await client.wallet.signMessage(new TextEncoder().encode(message));
  const verifyRes = await fetch("/api/auth/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ signature: btoa(String.fromCharCode(...signature)) }),
  });
  if (!verifyRes.ok) throw new Error(((await verifyRes.json()) as { error: string }).error);
}

function Controls({ sessionWallet }: { sessionWallet: string | null }) {
  const client = useClient<AppClient>();
  const router = useRouter();
  const wallets = useWallets(client);
  const connected = useConnectedWallet(client);
  const connect = useConnect(client);
  const disconnect = useDisconnect(client);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!connected) {
    if (wallets.length === 0) return <span className="text-sm">Install Phantom, Solflare or Backpack</span>;
    return (
      <div className="flex gap-2">
        {wallets.map((wallet) => (
          <button
            key={wallet.name}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
            disabled={connect.isRunning}
            onClick={() => connect.dispatch(wallet)}
          >
            Connect {wallet.name}
          </button>
        ))}
      </div>
    );
  }

  const walletAddress = connected.account.address;
  const signedIn = sessionWallet === walletAddress;

  async function onSignIn() {
    setSigningIn(true);
    setError(null);
    try {
      await signIn(client, walletAddress);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setSigningIn(false);
    }
  }

  async function onDisconnect() {
    await fetch("/api/auth/logout", { method: "POST" });
    disconnect.dispatch();
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      {error ? <span className="text-red-400">{error}</span> : null}
      {!signedIn ? (
        <button
          className="rounded-full bg-accent px-4 py-2 font-medium text-black disabled:opacity-50"
          disabled={signingIn}
          onClick={onSignIn}
        >
          {signingIn ? "Check your wallet..." : "Sign in"}
        </button>
      ) : null}
      <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
        <span className="font-mono text-heading">{shortAddress(walletAddress)}</span>
        <Balance accountAddress={address(walletAddress)} />
      </div>
      <button className="text-muted hover:text-heading" onClick={onDisconnect}>
        Disconnect
      </button>
    </div>
  );
}

export function WalletButton({ sessionWallet }: { sessionWallet: string | null }) {
  const client = useClient<AppClient>();
  return (
    <WalletReadyGate client={client} fallback={<span className="text-sm text-muted">Looking for wallets...</span>}>
      <Controls sessionWallet={sessionWallet} />
    </WalletReadyGate>
  );
}
