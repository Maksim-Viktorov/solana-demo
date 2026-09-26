"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckIcon, ShuffleIcon, XCircleIcon } from "@/components/icons";
import { Card, PrimaryButton } from "@/components/ui";
import type { CaseOutcome, EventOption } from "@/lib/types";
import { submitVote } from "./actions";

const RESULT: Record<CaseOutcome, { title: string; text: string; tone: string; Icon: typeof CheckIcon }> = {
  matched: {
    title: "You matched the AI judge",
    text: "The bet resolves, winners can claim their payout, and your bonus is on its way.",
    tone: "border-emerald-500/40 bg-emerald-950/30 text-emerald-400",
    Icon: CheckIcon,
  },
  not_matched: {
    title: "No match",
    text: "You get the fixed bounty. The case goes to the next volunteer, who also reviews it blind.",
    tone: "border-amber-500/40 bg-amber-950/30 text-amber-300",
    Icon: ShuffleIcon,
  },
  invalid: {
    title: "Bet invalid",
    text: "Three volunteers in a row disagreed with the AI. Everyone is refunded minus the platform fee.",
    tone: "border-rose-500/40 bg-rose-950/30 text-rose-400",
    Icon: XCircleIcon,
  },
};

export function VoteForm({
  caseId,
  options,
  initialOutcome,
}: {
  caseId: string;
  options: EventOption[];
  initialOutcome?: CaseOutcome;
}) {
  const [choice, setChoice] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<CaseOutcome | undefined>(initialOutcome);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (outcome) {
    const r = RESULT[outcome];
    return (
      <div className={`rounded-card border p-6 ${r.tone}`}>
        <p className="flex items-center gap-2 text-lg font-semibold">
          <r.Icon className="h-5 w-5" />
          {r.title}
        </p>
        <p className="mt-1 text-sm text-body">{r.text}</p>
        <Link href="/volunteer" className="mt-4 inline-block text-sm font-semibold text-heading hover:underline">
          Back to Volunteer
        </Link>
      </div>
    );
  }

  const choices = [...options, { id: "unprovable", label: "Evidence doesn't prove either" }];
  return (
    <Card className="p-6">
      <h2 className="mb-1 text-lg font-semibold">Your verdict</h2>
      <p className="mb-4 text-sm text-muted">Based only on the evidence and the rules above.</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {choices.map((o, i) => {
          const selected = choice === o.id;
          const tone =
            o.id === "unprovable"
              ? "border-border text-body"
              : i === 0
                ? "border-emerald-500/40 text-emerald-400"
                : "border-rose-500/40 text-rose-400";
          return (
            <button
              key={o.id}
              onClick={() => setChoice(o.id)}
              className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${tone} ${
                selected ? "bg-white/10 ring-2 ring-white/60" : "bg-white/[0.03] hover:bg-white/[0.07]"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
      <PrimaryButton
        className="mt-4 w-full"
        disabled={!choice || pending}
        onClick={() =>
          startTransition(async () => {
            const res = await submitVote(caseId, choice!);
            if ("error" in res) setError(res.error);
            else setOutcome(res.outcome);
          })
        }
      >
        {pending ? "Submitting..." : "Submit vote"}
      </PrimaryButton>
    </Card>
  );
}
