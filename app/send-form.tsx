"use client";

import { useState } from "react";
import { address, isAddress, sol, solToLamports, type Address, type Lamports } from "@solana/kit";
import { useConnectedWallet } from "@solana/kit-plugin-wallet/react";
import { useAction, useClient } from "@solana/react";
import { DEVNET_RPC_URL, type AppClient } from "./providers";
import { sendSol } from "./send-sol";

type Transfer = { recipient: Address; amount: Lamports; amountText: string };

function parseTransfer(recipientText: string, amountText: string): Transfer | string {
  const recipient = recipientText.trim();
  if (!isAddress(recipient)) return "Recipient is not a valid Solana address.";
  let amount: Lamports;
  try {
    amount = solToLamports(sol(amountText.trim()));
  } catch {
    return "Amount must be a number of SOL, e.g. 0.01.";
  }
  if (amount <= BigInt(0)) return "Amount must be greater than 0.";
  return { recipient: address(recipient), amount, amountText: amountText.trim() };
}

export function SendForm() {
  const client = useClient<AppClient>();
  const connected = useConnectedWallet(client);
  const [recipientText, setRecipientText] = useState("");
  const [amountText, setAmountText] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  // Set once the inputs are valid; the user confirms this summary before the
  // wallet is asked to sign.
  const [pending, setPending] = useState<Transfer | null>(null);

  const [status, setStatus] = useState<string | null>(null);

  const send = useAction(async (signal: AbortSignal, transfer: Transfer) => {
    try {
      return await sendSol({
        rpc: client.rpc,
        rpcUrl: DEVNET_RPC_URL,
        payer: client.payer,
        recipient: transfer.recipient,
        amount: transfer.amount,
        abortSignal: signal,
        onStatus: setStatus,
      });
    } finally {
      setStatus(null);
    }
  });

  if (!connected) return <p>Connect a wallet to send SOL.</p>;

  function onReview(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseTransfer(recipientText, amountText);
    if (typeof parsed === "string") {
      setFormError(parsed);
      return;
    }
    setFormError(null);
    send.reset();
    setPending(parsed);
  }

  function onConfirm() {
    if (!pending) return;
    send.dispatch(pending);
    setPending(null);
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <form className="flex flex-col gap-3" onSubmit={onReview}>
        <label className="flex flex-col gap-1">
          Recipient address
          <input
            className="rounded border px-3 py-2 font-mono text-sm"
            value={recipientText}
            onChange={(e) => setRecipientText(e.target.value)}
            disabled={send.isRunning}
          />
        </label>
        <label className="flex flex-col gap-1">
          Amount (SOL)
          <input
            className="rounded border px-3 py-2"
            inputMode="decimal"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            disabled={send.isRunning}
          />
        </label>
        <button
          type="submit"
          className="self-start rounded-full bg-foreground px-5 py-2 text-background disabled:opacity-50"
          disabled={send.isRunning || pending != null}
        >
          {send.isRunning ? "Sending…" : "Review"}
        </button>
      </form>

      {formError ? <p className="text-red-600">{formError}</p> : null}

      {status ? <p>{status}</p> : null}

      {pending ? (
        <div className="flex flex-col gap-2 rounded border p-3">
          <p>
            Send <strong>{pending.amountText} SOL</strong> on <strong>devnet</strong>
          </p>
          <p className="break-all font-mono text-sm">to {pending.recipient}</p>
          <p className="break-all font-mono text-sm">from {connected.account.address} (also pays the fee)</p>
          <div className="flex gap-2">
            <button className="rounded-full bg-foreground px-5 py-2 text-background" onClick={onConfirm}>
              Confirm and sign
            </button>
            <button className="rounded-full border px-5 py-2" onClick={() => setPending(null)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {send.error ? (
        <p className="break-words text-red-600">
          Transaction failed: {send.error instanceof Error ? send.error.message : String(send.error)}
        </p>
      ) : null}

      {send.data ? (
        <p className="break-all">
          Sent:{" "}
          <a
            className="font-mono text-sm underline"
            href={`https://explorer.solana.com/tx/${send.data}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {send.data}
          </a>
        </p>
      ) : null}
    </div>
  );
}
