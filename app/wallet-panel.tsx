"use client";

import { useMemo } from "react";
import {
  address,
  formatDecimalFixedPoint,
  lamportsToSol,
  type Address,
  type Lamports,
} from "@solana/kit";
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

const solFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 5,
});

// Initial getBalance plus a live account subscription, slot-deduped so an
// older value never overwrites a newer one.
function useBalance(accountAddress: Address) {
  const { rpc, rpcSubscriptions } = useClient<AppClient>();
  const spec = useMemo(
    () => ({
      initialValueSource: rpc.getBalance(accountAddress, {
        commitment: "confirmed",
      }),
      initialValueMapper: (lamports: Lamports) => lamports,
      streamSource: rpcSubscriptions.accountNotifications(accountAddress, {
        commitment: "confirmed",
      }),
      streamValueMapper: ({ lamports }: { lamports: Lamports }) => lamports,
    }),
    [rpc, rpcSubscriptions, accountAddress],
  );
  const { data, error } = useTrackedDataSWR(
    ["devnet-balance", accountAddress],
    spec,
  );
  return { lamports: data?.value ?? null, error };
}

function Balance({ accountAddress }: { accountAddress: Address }) {
  const { lamports, error } = useBalance(accountAddress);
  if (error) return <span className="text-red-600">Could not load balance</span>;
  if (lamports == null) return <span>Loading…</span>;
  return (
    <span>{formatDecimalFixedPoint(solFormatter, lamportsToSol(lamports))} SOL</span>
  );
}

function WalletControls() {
  const client = useClient<AppClient>();
  const wallets = useWallets(client);
  const connected = useConnectedWallet(client);
  const connect = useConnect(client);
  const disconnect = useDisconnect(client);

  if (!connected) {
    if (wallets.length === 0) {
      return (
        <p>
          No Solana wallet found. Install{" "}
          <a className="underline" href="https://phantom.com" target="_blank" rel="noopener noreferrer">
            Phantom
          </a>{" "}
          and reload.
        </p>
      );
    }
    return (
      <div className="flex flex-col gap-2">
        {wallets.map((wallet) => (
          <button
            key={wallet.name}
            className="rounded-full bg-foreground px-5 py-2 text-background disabled:opacity-50"
            disabled={connect.isRunning}
            onClick={() => connect.dispatch(wallet)}
          >
            Connect {wallet.name}
          </button>
        ))}
        {connect.error ? (
          <p className="text-red-600">Connection failed or was rejected.</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="break-all font-mono text-sm">{connected.account.address}</p>
      <p>
        Devnet balance: <Balance accountAddress={address(connected.account.address)} />
      </p>
      <button
        className="self-start rounded-full border px-5 py-2"
        onClick={() => disconnect.dispatch()}
      >
        Disconnect {connected.wallet.name}
      </button>
    </div>
  );
}

export function WalletPanel() {
  const client = useClient<AppClient>();
  return (
    <WalletReadyGate client={client} fallback={<p>Looking for wallets…</p>}>
      <WalletControls />
    </WalletReadyGate>
  );
}
