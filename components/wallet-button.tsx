"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
import { ShieldCheckIcon, WalletIcon } from "./icons";
import { shortAddress } from "@/lib/format";

const solFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

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

function useSignIn() {
  const client = useClient<AppClient>();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run(walletAddress: string) {
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
  return { run, signingIn, error };
}

function TopBarControls({ sessionWallet, kycVerified }: { sessionWallet: string | null; kycVerified: boolean }) {
  const client = useClient<AppClient>();
  const router = useRouter();
  const connected = useConnectedWallet(client);
  const disconnect = useDisconnect(client);
  const signIn = useSignIn();

  if (!connected) {
    return (
      <Link
        href="/onboarding"
        className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-heading hover:bg-white/5"
      >
        Connect wallet
      </Link>
    );
  }

  const walletAddress = connected.account.address;
  const signedIn = sessionWallet === walletAddress;

  async function onDisconnect() {
    await fetch("/api/auth/logout", { method: "POST" });
    disconnect.dispatch();
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      {signIn.error ? <span className="text-rose-400">{signIn.error}</span> : null}
      {!signedIn ? (
        <button
          className="rounded-xl bg-white/10 px-4 py-2.5 font-medium text-heading hover:bg-white/15 disabled:opacity-50"
          disabled={signIn.signingIn}
          onClick={() => signIn.run(walletAddress)}
        >
          {signIn.signingIn ? "Check your wallet..." : "Sign in"}
        </button>
      ) : null}
      <button
        onClick={onDisconnect}
        title="Disconnect"
        className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-body hover:bg-white/5"
      >
        <WalletIcon className="h-4 w-4 text-muted" />
        <span className="text-heading">{shortAddress(walletAddress)}</span>
        <span className="text-muted">·</span>
        <Balance accountAddress={address(walletAddress)} />
        {signedIn && kycVerified ? (
          <span className="ml-1 inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-xs text-emerald-400">
            <ShieldCheckIcon className="h-3.5 w-3.5" />
            Verified
          </span>
        ) : (
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
        )}
      </button>
    </div>
  );
}

export function WalletButton({ sessionWallet, kycVerified }: { sessionWallet: string | null; kycVerified: boolean }) {
  const client = useClient<AppClient>();
  return (
    <WalletReadyGate client={client} fallback={<span className="text-sm text-muted">Looking for wallets...</span>}>
      <TopBarControls sessionWallet={sessionWallet} kycVerified={kycVerified} />
    </WalletReadyGate>
  );
}

const KNOWN_WALLETS = ["Phantom", "Solflare", "Backpack"];

// Onboarding step 1: one button per wallet, first one highlighted. Once a
// wallet is connected, the same card asks for the sign-in signature.
function WalletListInner({ sessionWallet }: { sessionWallet: string | null }) {
  const client = useClient<AppClient>();
  const wallets = useWallets(client);
  const connected = useConnectedWallet(client);
  const connect = useConnect(client);
  const signIn = useSignIn();

  if (connected && sessionWallet !== connected.account.address) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-center text-sm text-body">
          Connected <span className="font-mono text-heading">{shortAddress(connected.account.address)}</span>. Sign a
          message to prove it&apos;s yours. It costs nothing.
        </p>
        <button
          className="rounded-xl bg-accent px-5 py-3 font-semibold text-white disabled:opacity-50"
          disabled={signIn.signingIn}
          onClick={() => signIn.run(connected.account.address)}
        >
          {signIn.signingIn ? "Check your wallet..." : "Sign in with wallet"}
        </button>
        {signIn.error ? <p className="text-center text-sm text-rose-400">{signIn.error}</p> : null}
      </div>
    );
  }

  const detected = new Map(wallets.map((w) => [w.name, w]));
  const names = [...new Set([...KNOWN_WALLETS, ...wallets.map((w) => w.name)])];
  return (
    <div className="flex flex-col gap-3">
      {names.map((name, i) => {
        const wallet = detected.get(name);
        return (
          <button
            key={name}
            disabled={!wallet || connect.isRunning}
            onClick={() => wallet && connect.dispatch(wallet)}
            className={`flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-medium transition disabled:cursor-not-allowed ${
              i === 0 ? "bg-accent text-white" : "border border-border bg-white/5 text-heading hover:bg-white/10"
            } ${!wallet ? "opacity-50" : ""}`}
            title={wallet ? undefined : `${name} not detected in this browser`}
          >
            <WalletIcon className="h-4 w-4" />
            {name}
            {!wallet ? <span className="text-xs text-muted">(not installed)</span> : null}
          </button>
        );
      })}
      {connect.error ? <p className="text-center text-sm text-rose-400">Connection failed or was rejected.</p> : null}
    </div>
  );
}

export function WalletList({ sessionWallet }: { sessionWallet: string | null }) {
  const client = useClient<AppClient>();
  return (
    <WalletReadyGate client={client} fallback={<p className="text-center text-sm text-muted">Looking for wallets...</p>}>
      <WalletListInner sessionWallet={sessionWallet} />
    </WalletReadyGate>
  );
}
