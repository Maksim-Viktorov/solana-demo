import Link from "next/link";
import { PageTitle, Placeholder } from "@/components/placeholder";
import { getViewer } from "@/lib/auth/session";
import { data } from "@/lib/data";
import { formatSol } from "@/lib/format";

export default async function VolunteerPage() {
  const viewer = await getViewer();
  const assigned = viewer ? await data.getAssignedCase(viewer.wallet) : null;
  // Read the case through the blind view only, never the raw event.
  const blind = assigned && viewer ? await data.getBlindCase(assigned.id, viewer.wallet) : null;
  const stats = viewer ? await data.getJudgeStats(viewer.wallet) : null;

  return (
    <>
      <PageTitle>Volunteer</PageTitle>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Placeholder label="Assigned case" className="lg:col-span-2">
          {blind ? (
            <>
              <p className="font-medium text-heading">
                Case #{blind.caseNumber} · {blind.event.title}
              </p>
              <p>
                Reward: {formatSol(blind.rewardMatch)} if you match the AI, {formatSol(blind.rewardBounty)} bounty if not
              </p>
              <Link
                href={`/volunteer/${blind.caseId}`}
                className="self-start rounded-full bg-accent px-4 py-2 font-medium text-black"
              >
                Start review
              </Link>
            </>
          ) : (
            <p>No case assigned right now.</p>
          )}
        </Placeholder>
        <Placeholder label="Judge stats">
          {stats ? (
            <>
              <p>Cases judged: {stats.casesJudged}</p>
              <p>Match rate: {Math.round(stats.matchRate * 100)}%</p>
              <p>Earned: {formatSol(stats.earned)}</p>
            </>
          ) : null}
        </Placeholder>
      </div>
    </>
  );
}
