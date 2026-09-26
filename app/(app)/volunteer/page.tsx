import Link from "next/link";
import { CheckIcon, ShuffleIcon } from "@/components/icons";
import { Card, GradientCard, PageTitle, Pill, StatTile } from "@/components/ui";
import { getViewer } from "@/lib/auth/session";
import { data } from "@/lib/data";
import { formatSol, formatShortDate } from "@/lib/format";
import type { CaseOutcome } from "@/lib/types";

const OUTCOME_PILL: Record<CaseOutcome, { tone: "green" | "amber" | "grey"; label: string }> = {
  matched: { tone: "green", label: "Resolved" },
  not_matched: { tone: "amber", label: "Passed to Next Reviewer" },
  invalid: { tone: "grey", label: "Invalid, Refunded" },
};

export default async function VolunteerPage() {
  const viewer = await getViewer();
  const assigned = viewer ? await data.getAssignedCase(viewer.wallet) : null;
  // Read the case through the blind view only, never the raw event.
  const blind = assigned && viewer ? await data.getBlindCase(assigned.id, viewer.wallet) : null;
  const stats = viewer ? await data.getJudgeStats(viewer.wallet) : null;
  const history = viewer ? await data.getJudgingHistory(viewer.wallet, viewer.wallet) : [];

  return (
    <>
      <PageTitle>Volunteer Judging</PageTitle>

      {blind ? (
        <GradientCard>
          <div className="flex items-center gap-3 rounded-t-[14.5px] bg-gradient-to-r from-[#9945FF]/30 to-[#14F195]/20 px-6 py-4">
            <ShuffleIcon className="h-5 w-5 text-heading" />
            <p className="text-lg font-semibold text-heading">You&apos;ve been randomly assigned a case</p>
          </div>
          <div className="flex flex-col gap-3 p-6">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-2xl font-bold">{blind.event.title}</h2>
              <span className="shrink-0 rounded-full border border-border bg-white/5 px-3 py-1 text-xs text-body">
                Case #{blind.caseNumber}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <p className="flex items-center gap-2 text-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-black">
                  <CheckIcon className="h-3.5 w-3.5" />
                </span>
                <span className="text-emerald-400">Verified onchain:</span>
                <span className="text-body">you are not a participant</span>
              </p>
              <span className="shrink-0 rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-xs text-rose-300">
                Deadline was {formatShortDate(blind.event.deadline)}
              </span>
            </div>
            <span className="self-start rounded-full border border-border bg-white/5 px-3 py-1 text-xs text-body">
              Reviewer {blind.round} of 3
            </span>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-2 text-sm text-body">Reward:</p>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="rounded-lg border border-border bg-white/5 px-3 py-1.5 text-body">
                    Match AI judge: <span className="text-emerald-400">+{formatSol(blind.rewardMatch)}</span> bonus
                  </span>
                  <span className="rounded-lg border border-border bg-white/5 px-3 py-1.5 text-body">
                    No match: <span className="text-emerald-400">+{formatSol(blind.rewardBounty, 3)}</span> fixed bounty
                  </span>
                </div>
              </div>
              <Link
                href={`/volunteer/${blind.caseId}`}
                className="rounded-xl bg-accent px-8 py-3 font-semibold text-white hover:brightness-110"
              >
                Start Review
              </Link>
            </div>
          </div>
        </GradientCard>
      ) : (
        <Card className="p-8 text-center">
          <ShuffleIcon className="mx-auto mb-2 h-8 w-8 text-muted" />
          <p className="font-semibold text-heading">No case assigned right now</p>
          <p className="text-sm text-muted">
            Cases are assigned at random to verified users with no stake in the bet. Check back soon.
          </p>
        </Card>
      )}

      {stats ? (
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <StatTile label="Cases Judged" value={String(stats.casesJudged)} />
          <StatTile label="Agreement Rate" value={`${Math.round(stats.matchRate * 100)}%`} />
          <StatTile label="Earned" value={formatSol(stats.earned)} />
        </div>
      ) : null}

      <Card className="mt-5 p-6">
        <h2 className="mb-3 text-xl font-bold">Recent Cases</h2>
        {history.length === 0 ? <p className="text-sm text-muted">No cases judged yet.</p> : null}
        <ul>
          {history.map((h) => (
            <li key={h.caseNumber} className="flex items-center gap-4 border-b border-border py-3 last:border-b-0">
              {h.visibility === "full" && h.outcome ? (
                <Pill tone={OUTCOME_PILL[h.outcome].tone}>{OUTCOME_PILL[h.outcome].label}</Pill>
              ) : (
                <Pill tone="blue">Pending</Pill>
              )}
              <span className="text-sm text-muted">Case #{h.caseNumber}</span>
              {h.visibility === "full" ? <span className="truncate text-sm text-body">{h.eventTitle}</span> : null}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
