"use client";

import { useState } from "react";
import { Placeholder } from "@/components/placeholder";
import type { DraftEventResponse } from "@/app/api/ai/draft-event/route";
import { formatDate } from "@/lib/format";

export function CreateEventForm() {
  const [idea, setIdea] = useState("");
  const [result, setResult] = useState<DraftEventResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function onDraft() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/draft-event", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idea }),
      });
      setResult((await res.json()) as DraftEventResponse);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <Placeholder label="Idea (free text)">
        <textarea
          className="min-h-24 rounded-lg border border-border bg-background p-3 text-heading"
          placeholder="Will Conor pass his driving test by Friday?"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
        />
        <button
          className="self-start rounded-full bg-accent px-4 py-2 font-medium text-black disabled:opacity-50"
          disabled={loading || !idea.trim()}
          onClick={onDraft}
        >
          {loading ? "Drafting..." : "Draft with AI"}
        </button>
      </Placeholder>

      <Placeholder label="Drafted rules">
        {result?.status === "ok" ? result.draft.rules.map((r) => <p key={r}>{r}</p>) : null}
      </Placeholder>
      <Placeholder label="Drafted options">
        {result?.status === "ok" ? <p>{result.draft.options.map((o) => o.label).join(" / ")}</p> : null}
      </Placeholder>
      <Placeholder label="Proof type">
        {result?.status === "ok" ? (
          <p>
            {result.draft.proofType}: {result.draft.proofRequirement}
          </p>
        ) : null}
      </Placeholder>
      <Placeholder label="Deadline">
        {result?.status === "ok" ? <p>{formatDate(result.draft.deadline)}</p> : null}
      </Placeholder>
      <Placeholder label="Provability check">
        {result?.status === "ok" ? <p>Provable. {result.provability.notes}</p> : null}
        {result?.status === "rejected" ? <p>Rejected. {result.provability.reason}</p> : null}
      </Placeholder>
      <Placeholder label="Publish">
        {/* TODO: call lib/solana/program.ts createEvent with the connected wallet. */}
        <button
          className="self-start rounded-full bg-accent px-4 py-2 font-medium text-black disabled:opacity-50"
          disabled={result?.status !== "ok"}
        >
          Publish
        </button>
      </Placeholder>
    </div>
  );
}
