import Link from "next/link";
import { PageTitle, Placeholder } from "@/components/placeholder";
import { getViewer } from "@/lib/auth/session";
import { data } from "@/lib/data";
import { formatSol } from "@/lib/format";

export default async function MyBetsPage() {
  const viewer = await getViewer();
  const bets = viewer ? await data.getBetsForUser(viewer.wallet) : [];
  return (
    <>
      <PageTitle>My Bets</PageTitle>
      <Placeholder label="Status tabs (active, awaiting result, won, lost, refunded)" className="mb-4" />
      <div className="flex flex-col gap-3">
        {bets.length === 0 ? <Placeholder label="Empty state">No bets yet.</Placeholder> : null}
        {bets.map(({ stake, event }) => (
          <Link key={stake.id} href={`/events/${event.id}`}>
            <Placeholder label={`Bet row · ${event.status}`}>
              <p className="font-medium text-heading">{event.title}</p>
              <p>
                {event.options.find((o) => o.id === stake.optionId)?.label} · {formatSol(stake.amount)}
              </p>
            </Placeholder>
          </Link>
        ))}
      </div>
    </>
  );
}
