"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CameraIcon, CheckIcon, CopyIcon, IdCardIcon, LockIcon, ShieldCheckIcon } from "@/components/icons";
import { Avatar, VerifiedBadge } from "@/components/ui";
import { WalletList } from "@/components/wallet-button";
import { shortAddress } from "@/lib/format";

const STEPS = ["Connect Wallet", "Verify Identity", "Ready"];

function StepHeader({ step }: { step: number }) {
  return (
    <ol className="flex text-sm">
      {STEPS.map((label, i) => {
        const done = i < step || step === 2;
        const active = i === step && step !== 2;
        return (
          <li
            key={label}
            className={`flex flex-1 items-center justify-center gap-2 py-3 ${
              active ? "bg-accent font-medium text-white" : done ? "text-emerald-400" : "text-muted"
            }`}
            style={{ clipPath: i < 2 ? "polygon(0 0, 92% 0, 100% 50%, 92% 100%, 0 100%)" : undefined }}
          >
            {done ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-black">
                <CheckIcon className="h-3.5 w-3.5" />
              </span>
            ) : (
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${active ? "bg-white text-purple-700" : "bg-white/10"}`}
              >
                {i + 1}
              </span>
            )}
            {label}
          </li>
        );
      })}
    </ol>
  );
}

export function OnboardingStepper({
  sessionWallet,
  kycVerified,
  displayName,
}: {
  sessionWallet: string | null;
  kycVerified: boolean;
  displayName: string | null;
}) {
  const router = useRouter();
  const step = !sessionWallet ? 0 : !kycVerified ? 1 : 2;
  const [idFile, setIdFile] = useState<string | null>(null);
  const [selfie, setSelfie] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitKyc() {
    setSubmitting(true);
    setError(null);
    try {
      // Mock provider: start a session, then approve it through the webhook.
      // With a real provider the widget collects the ID and the provider calls the webhook.
      const res = await fetch("/api/kyc/start", { method: "POST" });
      const body = (await res.json()) as { kycSessionId?: string; error?: string };
      if (!body.kycSessionId) throw new Error(body.error ?? "Could not start verification");
      await fetch("/api/kyc/webhook", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kycSessionId: body.kycSessionId, status: "approved" }),
      });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full overflow-hidden rounded-card border border-border bg-card/95 shadow-2xl backdrop-blur">
      <div className="border-b border-border bg-white/[0.03]">
        <StepHeader step={step} />
      </div>

      <div className="p-6">
        {step === 0 ? (
          <>
            <h2 className="mb-5 text-center text-2xl font-semibold">Connect Your Wallet</h2>
            <WalletList sessionWallet={sessionWallet} />
            <div className="my-5 flex items-center gap-3 text-xs text-muted">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>
            <button
              disabled
              title="Coming soon"
              className="w-full rounded-full border border-white/30 px-5 py-3 text-sm font-medium text-heading opacity-60"
            >
              Continue with Email · We&apos;ll Create a Wallet for You
            </button>
            <p className="mt-5 flex items-start justify-center gap-2 text-center text-xs text-muted">
              <LockIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              We never ask for your seed phrase or private key. You approve every transaction in your wallet.
            </p>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <h2 className="text-center text-2xl font-semibold">Verify Your Identity</h2>
            <p className="mb-5 mt-1 text-center text-sm text-body">
              Required to keep judging fair and prevent fake accounts from betting or voting.
            </p>
            <label className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-dashed border-white/25 p-5 text-center hover:bg-white/[0.03]">
              <IdCardIcon className="h-9 w-9 text-body" />
              <span className="font-semibold text-heading">Upload a government ID</span>
              <span className="text-xs text-muted">Passport, driver&apos;s license, or national ID card</span>
              <span className="mt-2 rounded-full border border-white/40 px-3 py-1 text-xs text-heading">
                {idFile ?? "Choose File"}
              </span>
              {/* Mock: the file never leaves the browser. A real provider widget replaces this. */}
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => setIdFile(e.target.files?.[0]?.name ?? null)}
              />
            </label>
            <div className="mt-3 flex items-center gap-4 rounded-xl border border-border bg-white/[0.04] p-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/10">
                {selfie ? <CheckIcon className="h-6 w-6 text-emerald-400" /> : <CameraIcon className="h-6 w-6 text-body" />}
              </span>
              <div>
                <p className="font-semibold text-heading">Take a quick selfie</p>
                <p className="text-xs text-muted">We match your face to your ID</p>
                <button
                  onClick={() => setSelfie(true)}
                  className="mt-2 rounded-full border border-white/40 px-3 py-1 text-xs text-heading"
                >
                  {selfie ? "Selfie captured" : "Open Camera"}
                </button>
              </div>
            </div>
            <p className="mt-4 flex items-start justify-center gap-2 text-center text-xs text-muted">
              <LockIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Your ID is encrypted and used only for verification. It is never shown on your public profile.
            </p>
            <button
              onClick={submitKyc}
              disabled={!idFile || !selfie || submitting}
              className="mt-4 w-full rounded-xl bg-accent px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? "Verifying..." : "Submit for Verification"}
            </button>
            {error ? <p className="mt-2 text-center text-sm text-rose-400">{error}</p> : null}
          </>
        ) : null}

        {step === 2 && sessionWallet ? (
          <div className="flex flex-col items-center">
            <ShieldCheckIcon className="h-16 w-16 text-emerald-400" />
            <h2 className="mt-2 text-2xl font-semibold text-emerald-400">You&apos;re Verified</h2>
            <div className="mt-5 flex w-full items-center gap-3 rounded-xl border border-border bg-white/[0.04] p-3">
              <Avatar name={displayName ?? "?"} className="h-9 w-9 text-sm" />
              <span className="font-semibold text-heading">{displayName}</span>
              <VerifiedBadge />
              <button
                className="ml-auto flex items-center gap-1.5 text-sm text-body hover:text-heading"
                onClick={() => navigator.clipboard.writeText(sessionWallet)}
                title="Copy address"
              >
                {shortAddress(sessionWallet)}
                <CopyIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 w-full rounded-xl border border-border bg-white/[0.04] p-4 text-center">
              <p className="mb-2 font-semibold text-heading">How Your Money Works</p>
              <ul className="space-y-0.5 text-sm text-body">
                <li>Stakes lock in a program vault, not with us</li>
                <li>You claim payouts and refunds straight from the vault</li>
                <li>You approve every stake in your wallet</li>
              </ul>
            </div>
            <div className="mt-5 grid w-full grid-cols-2 gap-3">
              <Link href="/explore" className="rounded-xl bg-accent px-4 py-3 text-center font-semibold text-white">
                Explore Bets
              </Link>
              <Link
                href="/volunteer"
                className="rounded-xl border border-white/40 px-4 py-3 text-center font-semibold text-heading"
              >
                Become a Volunteer
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
