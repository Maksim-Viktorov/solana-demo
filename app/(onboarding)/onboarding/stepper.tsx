"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Placeholder } from "@/components/placeholder";
import { WalletButton } from "@/components/wallet-button";

const STEPS = ["Connect wallet", "Verify identity", "Ready"];

export function OnboardingStepper({ sessionWallet, kycVerified }: { sessionWallet: string | null; kycVerified: boolean }) {
  const router = useRouter();
  const step = !sessionWallet ? 0 : !kycVerified ? 1 : 2;
  const [kycSessionId, setKycSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startKyc() {
    setError(null);
    const res = await fetch("/api/kyc/start", { method: "POST" });
    const body = (await res.json()) as { kycSessionId?: string; error?: string };
    if (body.kycSessionId) setKycSessionId(body.kycSessionId);
    else setError(body.error ?? "Could not start verification");
  }

  async function simulateApproval() {
    // In production the provider calls the webhook, not the browser.
    await fetch("/api/kyc/webhook", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kycSessionId, status: "approved" }),
    });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <Placeholder label="Stepper">
        <ol className="flex gap-4">
          {STEPS.map((s, i) => (
            <li key={s} className={i === step ? "text-heading" : "text-muted"}>
              {i + 1}. {s}
            </li>
          ))}
        </ol>
      </Placeholder>

      {step === 0 ? (
        <Placeholder label="Step 1: Connect wallet">
          <p>Connect your wallet, then sign the message to prove you own it.</p>
          <WalletButton sessionWallet={sessionWallet} />
        </Placeholder>
      ) : null}

      {step === 1 ? (
        <Placeholder label="Step 2: Verify identity (mock KYC provider widget)">
          {!kycSessionId ? (
            <button className="self-start rounded-full bg-accent px-4 py-2 font-medium text-black" onClick={startKyc}>
              Start verification
            </button>
          ) : (
            <>
              <p>Mock provider session {kycSessionId}</p>
              <button
                className="self-start rounded-full bg-accent px-4 py-2 font-medium text-black"
                onClick={simulateApproval}
              >
                Simulate approval
              </button>
            </>
          )}
          {error ? <p className="text-red-400">{error}</p> : null}
        </Placeholder>
      ) : null}

      {step === 2 ? (
        <Placeholder label="Step 3: Ready">
          <p>You are verified.</p>
          <Link href="/explore" className="self-start rounded-full bg-accent px-4 py-2 font-medium text-black">
            Go to Explore
          </Link>
        </Placeholder>
      ) : null}
    </div>
  );
}
