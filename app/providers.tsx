"use client";

import { createClient } from "@solana/kit";
import { solanaDevnetRpc } from "@solana/kit-plugin-rpc";
import { walletSigner } from "@solana/kit-plugin-wallet";
import { ClientProvider } from "@solana/react";

export const DEVNET_RPC_URL = "https://api.devnet.solana.com";

// One client for the whole app, devnet only. The connected wallet fills the
// payer role. Version 0 transactions are signed by every current wallet.
export const client = createClient()
  .use(walletSigner({ chain: "solana:devnet" }))
  .use(solanaDevnetRpc({ rpcUrl: DEVNET_RPC_URL, transactionConfig: { version: 0 } }));

export type AppClient = Awaited<typeof client>;

export function Providers({ children }: { children: React.ReactNode }) {
  return <ClientProvider client={client}>{children}</ClientProvider>;
}
