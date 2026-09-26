import { notFound } from "next/navigation";
import { CheckIcon, PaperclipIcon, SparklesIcon, UserIcon } from "@/components/icons";
import { Avatar, Card, CATEGORY_LABEL, SplitBar, StatusDot, TrustBadge } from "@/components/ui";
import { data } from "@/lib/data";
import { formatDateTime, formatSol, optionPercents } from "@/lib/format";
import type { EventStatus } from "@/lib/types";
import { EvidenceUpload, StakeForm } from "./event-actions";

const TIMELINE: { label: string; reachedAt: EventStatus[] }[] = [
  { label: "Bet created", reachedAt: ["open", "awaiting_evidence", "in_review", "resolved", "invalid"] },
  { label: "Betting closed", reachedAt: ["awaiting_evidence", "in_review", "resolved", "invalid"] },
  { label: "Proof uploaded", reachedAt: ["in_review", "resolved", "invalid"] },
  { label: "AI + volunteer checked", reachedAt: ["resolved", "invalid"] },
  { label: "Paid out or refunded", reachedAt: ["resolved", "invalid"] },
];

export default async function EventPage({ params }: PageProps<"/events/[id]">) {
  const { id } = await params;
  const event = await data.getEvent(id);
  if (!event) notFound();
  const [stakes, creator] = await Promise.all([data.getStakesForEvent(id), data.getUser(event.creator)]);
  const pcts = optionPercents(event);
  const creatorName = creator?.displayName.split(" ")[0] ?? "Anon";

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted">
          <StatusDot status={event.status} />
          <span>·</span>
          {CATEGORY_LABEL[event.category]}
          <span>·</span>
          {event.status === "open" ? "Betting closes" : "Deadline"} {formatDateTime(event.deadline)}
        </div>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight">{event.title}</h1>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-body">
          <Avatar name={creatorName} />
          {creatorName}
          <TrustBadge value={(creator?.trust.bettor ?? 0) * 5} />
        </p>
        <p className="mt-3 max-w-3xl text-body">{event.description}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-5">
          <Card className="p-6">
            <h2 className="mb-3 text-lg font-semibold">Rules</h2>
            <ul className="space-y-1.5 text-sm text-body">
              {event.rules.map((r) => (
                <li key={r} className="flex gap-2">
                  <span className="text-muted">•</span>
                  {r}
                </li>
              ))}
            </ul>
            <p className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-white/[0.03] p-3 text-sm text-body">
              <PaperclipIcon className="mt-0.5 h-4 w-4 shrink-0" />
              {event.proofRequirement}
            </p>
          </Card>

          {event.status === "awaiting_evidence" ? <EvidenceUpload proofRequirement={event.proofRequirement} /> : null}

          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Status</h2>
            <ol className="flex flex-col gap-3">
              {TIMELINE.map((s) => {
                const done = s.reachedAt.includes(event.status);
                return (
                  <li key={s.label} className="flex items-center gap-3 text-sm">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full ${done ? "bg-emerald-500 text-black" : "border border-border text-muted"}`}
                    >
                      {done ? <CheckIcon className="h-3.5 w-3.5" /> : null}
                    </span>
                    <span className={done ? "text-heading" : "text-muted"}>{s.label}</span>
                  </li>
                );
              })}
            </ol>
            {event.status === "resolved" ? (
              <p className="mt-4 text-sm text-emerald-400">
                Result: {event.options.find((o) => o.id === event.winningOptionId)?.label} won
              </p>
            ) : null}
            {event.status === "invalid" ? (
              <p className="mt-4 text-sm text-rose-400">Invalid: everyone refunded minus the platform fee.</p>
            ) : null}
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card className="flex flex-col gap-3 bg-gradient-to-br from-[#9945FF]/10 to-transparent p-6">
            <p className="text-xs font-medium uppercase tracking-widest text-muted">Pool</p>
            <p className="text-3xl font-extrabold text-heading">
              {formatSol(event.totalPool)} <span className="text-sm font-normal text-muted">{stakes.length} bettors</span>
            </p>
            <SplitBar yesPct={pcts[0]} />
            <div className="flex justify-between text-sm font-semibold">
              {event.options.map((o, i) => (
                <span key={o.id} className={i === 0 ? "text-emerald-400" : "text-rose-400"}>
                  {o.label} {pcts[i]}% · {formatSol(event.poolByOption[o.id] ?? "0")}
                </span>
              ))}
            </div>
          </Card>

          {event.status === "open" ? <StakeForm options={event.options} /> : null}

          <Card className="p-6 text-sm">
            <h2 className="mb-3 text-lg font-semibold">How it&apos;s judged</h2>
            <p className="flex items-center gap-2 text-heading">
              <SparklesIcon className="h-4 w-4 text-purple-400" /> AI checker rules first, verdict stays hidden
            </p>
            <p className="mt-2 flex items-center gap-2 text-heading">
              <UserIcon className="h-4 w-4 text-emerald-400" /> A random verified volunteer votes blind
            </p>
            <p className="mt-3 text-muted">
              If they agree, the bet resolves. If 3 volunteers in a row disagree with the AI, everyone is refunded.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
