import { notFound } from "next/navigation";
import { PageTitle, Placeholder } from "@/components/placeholder";
import { getViewer } from "@/lib/auth/session";
import { data } from "@/lib/data";
import { formatDate, formatSol, shortAddress } from "@/lib/format";

export default async function ProfilePage({ params }: PageProps<"/profile/[wallet]">) {
  const { wallet } = await params;
  const user = await data.getUser(wallet);
  if (!user) notFound();
  const viewer = await getViewer();
  const [stats, bets, judging] = await Promise.all([
    data.getUserStats(wallet),
    data.getBetsForUser(wallet),
    // The data layer decides how much judging detail the viewer may see.
    data.getJudgingHistory(wallet, viewer?.wallet ?? null),
  ]);

  return (
    <>
      <PageTitle>Profile</PageTitle>
      <div className="flex flex-col gap-4">
        <Placeholder label="Header (avatar, name, joined date, KYC badge, trust score)">
          <p className="font-medium text-heading">
            {user.displayName} · {shortAddress(user.wallet)}
          </p>
          <p>
            Joined {formatDate(user.joinedAt)} · {user.kycVerified ? "KYC verified" : "Not verified"} · Trust{" "}
            {user.trust.total}/100
          </p>
        </Placeholder>
        <Placeholder label="Stats">
          <p>
            {stats.betsPlaced} bets · {stats.betsWon} won · staked {formatSol(stats.totalStaked)} · won{" "}
            {formatSol(stats.totalWon)}
          </p>
        </Placeholder>
        <Placeholder label="Trust breakdown">
          <p>
            KYC {user.trust.kyc} · Betting {user.trust.bettingHistory} · Judging {user.trust.judgingAccuracy} · Account
            age {user.trust.accountAge}
          </p>
        </Placeholder>
        <Placeholder label="Betting history">
          {bets.map(({ stake, event }) => (
            <p key={stake.id}>
              {event.title} · {formatSol(stake.amount)} · {event.status}
            </p>
          ))}
        </Placeholder>
        <Placeholder label="Judging history">
          {judging.map((j) =>
            j.visibility === "full" ? (
              <p key={j.caseNumber}>
                Case #{j.caseNumber} · {j.eventTitle} · {j.outcome ?? "pending"}
              </p>
            ) : (
              <p key={j.caseNumber}>Case #{j.caseNumber}</p>
            ),
          )}
        </Placeholder>
      </div>
    </>
  );
}
