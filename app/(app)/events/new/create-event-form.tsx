"use client";

import { useState } from "react";
import type { DraftEventResponse, EventDraft } from "@/app/api/ai/draft-event/route";
import {
  CalendarIcon,
  ClockIcon,
  GlobeIcon,
  LinkIcon,
  LockIcon,
  PaperclipIcon,
  SparklesIcon,
  XCircleIcon,
} from "@/components/icons";
import { Card, PrimaryButton, SecondaryButton } from "@/components/ui";

// datetime-local wants "YYYY-MM-DDTHH:mm" in local time.
function toLocalInput(iso: string) {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

const field = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-heading outline-none focus:border-white/30";
const label = "mb-1.5 block text-sm font-medium text-heading";

export function CreateEventForm() {
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<EventDraft | null>(null);
  const [rejected, setRejected] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [notice, setNotice] = useState<string | null>(null);

  async function onGenerate() {
    setLoading(true);
    setRejected(null);
    setNotice(null);
    try {
      const res = await fetch("/api/ai/draft-event", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idea }),
      });
      const body = (await res.json()) as DraftEventResponse;
      if (body.status === "ok") setDraft(body.draft);
      else {
        setDraft(null);
        setRejected(body.provability.reason);
      }
    } finally {
      setLoading(false);
    }
  }

  function update<K extends keyof EventDraft>(key: K, value: EventDraft[K]) {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  }

  function onCreate() {
    // TODO: call createEvent in lib/solana/program.ts once the
    // program is deployed, then save the event through the data service.
    setNotice("Publishing needs the deployed program. createEvent in lib/solana/program.ts is still a stub.");
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-5">
      <Card className="p-5">
        <div className="relative">
          <SparklesIcon className="absolute left-3 top-3 h-5 w-5 text-muted" />
          <textarea
            className="min-h-28 w-full resize-y rounded-xl border border-border bg-background py-3 pl-11 pr-3 text-heading outline-none placeholder:text-muted focus:border-white/30"
            placeholder="e.g. I will pass my maths exam with more than 80% by Friday"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
          />
        </div>
        <PrimaryButton className="mt-3 w-full" disabled={loading || !idea.trim()} onClick={onGenerate}>
          {loading ? "Generating..." : "Generate Bet ✨"}
        </PrimaryButton>
        <p className="mt-2 text-center text-xs text-muted">Powered by AI · Your bet will be reviewed for validity</p>
      </Card>

      {rejected ? (
        <div className="flex gap-3 rounded-card border border-rose-500/40 bg-rose-950/40 p-4 text-sm text-rose-200">
          <XCircleIcon className="h-5 w-5 shrink-0 text-rose-400" />
          <div className="flex-1">
            <p>{rejected}</p>
            <button className="mt-2 font-semibold text-rose-300 hover:underline" onClick={() => setRejected(null)}>
              Try Again
            </button>
          </div>
        </div>
      ) : null}

      {draft ? (
        <>
          <Card className="flex flex-col gap-4 p-5">
            <div>
              <label className={label}>Bet Title</label>
              <input className={field} value={draft.title} onChange={(e) => update("title", e.target.value)} />
            </div>
            <div>
              <label className={label}>Description</label>
              <textarea
                className={`${field} min-h-16`}
                value={draft.description}
                onChange={(e) => update("description", e.target.value)}
              />
            </div>
            <div>
              <label className={label}>Rules</label>
              <ul className="space-y-1 text-sm text-body">
                {draft.rules.map((r) => (
                  <li key={r} className="flex gap-2">
                    <span className="text-muted">•</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <label className={label}>Options</label>
              <div className="flex gap-2">
                {draft.options.map((o) => (
                  <span key={o.id} className="rounded-lg border border-border bg-white/5 px-3 py-1 text-sm text-heading">
                    {o.label}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className={label}>Proof Required</label>
              <p className="flex items-start gap-2 text-sm text-body">
                <PaperclipIcon className="mt-0.5 h-4 w-4 shrink-0" />
                {draft.proofRequirement}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>Event Deadline</label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    className={field}
                    value={toLocalInput(draft.deadline)}
                    onChange={(e) => update("deadline", new Date(e.target.value).toISOString())}
                  />
                  <CalendarIcon className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-muted" />
                </div>
              </div>
              <div>
                <label className={label}>Proof Submission Deadline</label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    className={field}
                    value={toLocalInput(draft.proofDeadline)}
                    onChange={(e) => update("proofDeadline", new Date(e.target.value).toISOString())}
                  />
                  <ClockIcon className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-muted" />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <label className={label}>Bet Visibility</label>
              <div className="grid grid-cols-2 gap-1 rounded-xl border border-border p-1">
                {(["public", "private"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setVisibility(v)}
                    className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm ${
                      visibility === v ? "bg-white/10 font-medium text-heading" : "text-muted"
                    }`}
                  >
                    {v === "public" ? <GlobeIcon className="h-4 w-4" /> : <LockIcon className="h-4 w-4" />}
                    {v === "public" ? "Public" : "Private"}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-muted">
                Public bets appear in the discover feed. Private bets are only accessible via link or QR code.
              </p>
            </div>

            <div className="border-t border-border pt-4">
              <label className={label}>Share this bet</label>
              <div className="grid grid-cols-2 gap-3">
                <SecondaryButton disabled title="Available after the bet is created" className="flex items-center justify-center gap-2 text-sm">
                  <LinkIcon className="h-4 w-4" /> Copy Link
                </SecondaryButton>
                <SecondaryButton disabled title="Available after the bet is created" className="text-sm">
                  Show QR Code
                </SecondaryButton>
              </div>
              <p className="mt-1.5 text-xs text-muted">Sharing unlocks once the bet exists onchain.</p>
            </div>
          </Card>

          <PrimaryButton className="w-full py-3" onClick={onCreate}>
            Create Bet &amp; Deposit SOL
          </PrimaryButton>
          {notice ? <p className="text-center text-sm text-amber-300">{notice}</p> : null}
        </>
      ) : null}
    </div>
  );
}
