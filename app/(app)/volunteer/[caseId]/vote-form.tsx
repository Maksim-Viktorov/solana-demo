"use client";

import { useState, useTransition } from "react";
import { Placeholder } from "@/components/placeholder";
import type { CaseOutcome, EventOption } from "@/lib/types";
import { submitVote } from "./actions";

const RESULT_TEXT: Record<CaseOutcome, string> = {
  matched: "Matched: your vote agreed with the AI. The bet resolves and you get the bonus.",
  not_matched: "Not matched: you get the fixed bounty and the next volunteer is assigned.",
  invalid: "Bet invalid: three volunteers disagreed. Everyone is refunded minus the platform fee.",
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
    return <Placeholder label={`Result state · ${outcome}`}>{RESULT_TEXT[outcome]}</Placeholder>;
  }

  const choices = [...options, { id: "unprovable", label: "Evidence doesn't prove either" }];
  return (
    <Placeholder label="Vote">
      <div className="flex flex-wrap gap-2">
        {choices.map((o) => (
          <button
            key={o.id}
            className={`rounded-full border px-4 py-2 ${choice === o.id ? "border-transparent bg-accent text-black" : "border-border"}`}
            onClick={() => setChoice(o.id)}
          >
            {o.label}
          </button>
        ))}
      </div>
      {error ? <p className="text-red-400">{error}</p> : null}
      <button
        className="self-start rounded-full bg-accent px-4 py-2 font-medium text-black disabled:opacity-50"
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
      </button>
    </Placeholder>
  );
}
