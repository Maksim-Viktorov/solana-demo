import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, Card, GradientCard, Pill, StatTile, VerifiedBadge } from "@/components/ui";
import { getViewer } from "@/lib/auth/session";
import { betResult } from "@/lib/bets";
import { data } from "@/lib/data";
import { formatSol, shortAddress } from "@/lib/format";
import { CopyAddress } from "./copy-address";
import { ProfileTabs } from "./profile-tabs";

// Half-ring gauge for a 0..1 score. Arc radius 60 centred at (70, 76), so the
// label fits inside the ring.
function Gauge({ label, value, caption }: { label: string; value: number; caption: string }) {
  const arc = "M10 76 A60 60 0 0 1 130 76";
  const len = Math.PI * 60;
  return (
    <div className="relative flex w-40 flex-col items-center">
      <svg viewBox="0 0 140 84" className="w-40">
        <defs>
          <linearGradient id="gauge-g" x1="0" x2="1">
            <stop offset="0" stopColor="#9945FF" />
            <stop offset="1" stopColor="#14F195" />
          </linearGradient>
        </defs>
        <path d={arc} fill="none" stroke="rgb(255 255 255 / 0.1)" strokeWidth="8" strokeLinecap="round" />
        <path d={arc} fill="none" stroke="url(#gauge-g)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${len * value} ${len}`} />
      </svg>
      <div className="absolute top-10 text-center">
        <p className="text-[11px] text-body">{label}</p>
        <p className="text-lg font-bold leading-tight text-heading">
          {value.toFixed(2)} <span className="text-[11px] font-normal text-muted">/ 1.00</span>
        </p>
      </div>
      <span className="-mt-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
        {caption}
      </span>
    </div>
  );
}

function Bar({ label, value, display }: { label: string; value: number; display: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm text-heading">
        <span>{label}</span>
        <span>{display}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10">
        <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(2, value * 100)}%` }} />
      </div>
    </div>
  );
}

export default async function ProfilePage({ params }: PageProps<"/profile/[wallet]">) {
  const { wallet } = await params;
  const user = await data.getUser(wallet);
  if (!user) notFound();
  const viewer = await getViewer();
  const [stats, bets, judging, judge] = await Promise.all([
    data.getUserStats(wallet),
    data.getBetsForUser(wallet),
    // The data layer decides how much judging detail the viewer may see.
    data.getJudgingHistory(wallet, viewer?.wallet ?? null),
    data.getJudgeStats(wallet),
  ]);
  const handle = user.displayName.split(" ")[0].toLowerCase();
  const settled = bets.filter((b) => b.event.status === "resolved");
  const winRate = settled.length ? Math.round((stats.betsWon / settled.length) * 100) : 0;
  const { trust } = user;

  const bettorTab = (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.6fr]">
      <Card className="flex flex-col gap-4 p-5">
        <div>
          <h2 className="text-xl font-bold">Bettor Trust</h2>
          <p className="text-sm text-muted">
            Starts at 1.00, decreases with disputes and missed deadlines. Current: {trust.bettor.toFixed(2)}
          </p>
        </div>
        <Bar label="Proof Submitted On Time" value={trust.proofOnTime} display={`${Math.round(trust.proofOnTime * 100)}%`} />
        <Bar label="Evidence Accepted" value={trust.evidenceAccepted} display={`${Math.round(trust.evidenceAccepted * 100)}%`} />
        <Bar label={`Disputes Lost · ${trust.disputesLost}`} value={Math.min(1, trust.disputesLost / 10)} display={String(trust.disputesLost)} />
      </Card>
      <Card className="p-5">
        <h2 className="mb-3 text-xl font-bold">Betting History</h2>
        {bets.length === 0 ? <p className="text-sm text-muted">No bets yet.</p> : null}
        <table className="w-full text-sm">
          <thead className="text-left text-muted">
            <tr>
              <th className="pb-2 font-normal">Event</th>
              <th className="pb-2 font-normal">Pick</th>
              <th className="pb-2 font-normal">Stake</th>
              <th className="pb-2 font-normal">Result</th>
              <th className="pb-2 text-right font-normal">Payout</th>
            </tr>
          </thead>
          <tbody>
            {bets.map(({ stake, event }) => {
              const r = betResult(stake, event);
              return (
                <tr key={stake.id} className="border-t border-border">
                  <td className="max-w-52 truncate py-2.5 pr-2 text-heading">
                    <Link href={`/events/${event.id}`} className="hover:underline">
                      {event.title}
                    </Link>
                  </td>
                  <td className="py-2.5 text-heading">{event.options.find((o) => o.id === stake.optionId)?.label}</td>
                  <td className="py-2.5 text-heading">{formatSol(stake.amount)}</td>
                  <td className="py-2.5">
                    <Pill tone={r.tone}>{r.label}</Pill>
                  </td>
                  <td
                    className={`py-2.5 text-right font-medium ${r.tone === "green" ? "text-emerald-400" : r.tone === "red" ? "text-rose-400" : "text-body"}`}
                  >
                    {r.payout ?? "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );

  const volunteerTab = (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.6fr]">
      <Card className="flex flex-col gap-4 p-5">
        <div>
          <h2 className="text-xl font-bold">Volunteer Trust</h2>
          <p className="text-sm text-muted">Grows when votes agree with the AI judge. Current: {trust.volunteer.toFixed(2)}</p>
        </div>
        <Bar label="Agreement Rate" value={judge.matchRate} display={`${Math.round(judge.matchRate * 100)}%`} />
        <Bar label="Cases Judged" value={Math.min(1, judge.casesJudged / 50)} display={String(judge.casesJudged)} />
        <p className="text-sm text-body">
          Earned from judging: <span className="font-semibold text-heading">{formatSol(judge.earned)}</span>
        </p>
      </Card>
      <Card className="p-5">
        <h2 className="mb-3 text-xl font-bold">Judging History</h2>
        {judging.length === 0 ? <p className="text-sm text-muted">No cases judged yet.</p> : null}
        <ul>
          {judging.map((j) => (
            <li key={j.caseNumber} className="flex items-center gap-4 border-t border-border py-2.5 text-sm first:border-t-0">
              <span className="text-muted">Case #{j.caseNumber}</span>
              {j.visibility === "full" ? (
                <>
                  <span className="flex-1 truncate text-heading">{j.eventTitle}</span>
                  {j.outcome ? (
                    <Pill tone={j.outcome === "matched" ? "green" : j.outcome === "invalid" ? "grey" : "amber"}>
                      {j.outcome === "matched" ? "Matched AI" : j.outcome === "invalid" ? "Invalid" : "No match"}
                    </Pill>
                  ) : null}
                </>
              ) : null}
            </li>
          ))}
        </ul>
        {judging.some((j) => j.visibility === "public") ? (
          <p className="mt-3 text-xs text-muted">Case details are private to the reviewer.</p>
        ) : null}
      </Card>
    </div>
  );

  return (
    <>
      <GradientCard className="flex flex-wrap items-center gap-6 p-6">
        <Avatar name={user.displayName} className="h-24 w-24 text-4xl" />
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{user.displayName}</h1>
            {user.kycVerified ? <VerifiedBadge /> : null}
          </div>
          <p className="mt-1 flex items-center gap-2 text-body">
            @{handle} · <CopyAddress wallet={user.wallet} label={shortAddress(user.wallet)} />
          </p>
          <p className="text-sm text-muted">
            Member since {new Date(user.joinedAt).toLocaleDateString("en-IE", { month: "short", year: "numeric" })}
          </p>
        </div>
        <div className="flex gap-4">
          <Gauge label="Bettor Trust" value={trust.bettor} caption={trust.bettor >= 0.8 ? "Reliable" : "Building trust"} />
          <Gauge
            label="Volunteer Trust"
            value={trust.volunteer}
            caption={trust.volunteer >= 0.8 ? "Reliable Judge" : "New Judge"}
          />
        </div>
      </GradientCard>

      <div className="my-5 grid gap-4 md:grid-cols-4">
        <StatTile label="Bets Placed" value={String(stats.betsPlaced)} />
        <StatTile label="Win Rate" value={`${winRate}%`} />
        <StatTile label="Volume" value={formatSol(stats.totalStaked)} />
        <StatTile label="Cases Judged" value={String(judge.casesJudged)} />
      </div>

      <ProfileTabs bettor={bettorTab} volunteer={volunteerTab} />
    </>
  );
}
