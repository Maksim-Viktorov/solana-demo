import Link from "next/link";
import { ChevronRightIcon } from "@/components/icons";
import { Card, CategoryIcon, PageTitle, Pill, StatusDot } from "@/components/ui";
import { getViewer } from "@/lib/auth/session";
import { betResult } from "@/lib/bets";
import { data } from "@/lib/data";
import { formatSol } from "@/lib/format";

export default async function MyBetsPage() {
  const viewer = await getViewer();
  const bets = viewer ? await data.getBetsForUser(viewer.wallet) : [];
  const active = bets.filter((b) => betResult(b.stake, b.event).label === "Open");
  const settled = bets.filter((b) => betResult(b.stake, b.event).label !== "Open");

  const section = (title: string, list: typeof bets) => (
    <section className="mb-8">
      <h2 className="mb-3 text-xl font-bold">{title}</h2>
      <Card>
        {list.length === 0 ? <p className="p-6 text-center text-sm text-muted">Nothing here yet.</p> : null}
        {list.map(({ stake, event }) => {
          const r = betResult(stake, event);
          return (
            <Link
              key={stake.id}
              href={`/events/${event.id}`}
              className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-border px-5 py-4 last:border-b-0 hover:bg-white/[0.02] md:grid-cols-[auto_1.4fr_1fr_auto_auto_auto]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border">
                <CategoryIcon category={event.category} className="h-4 w-4 text-body" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-heading">{event.title}</p>
                <p className="text-sm text-muted">
                  Picked {event.options.find((o) => o.id === stake.optionId)?.label} · {formatSol(stake.amount)}
                </p>
              </div>
              <span className="hidden md:block">
                <StatusDot status={event.status} />
              </span>
              <span className="hidden md:block">
                <Pill tone={r.tone}>{r.label}</Pill>
              </span>
              <span className={`hidden w-24 text-right font-semibold md:block ${r.tone === "green" ? "text-emerald-400" : r.tone === "red" ? "text-rose-400" : "text-body"}`}>
                {r.payout ?? "-"}
              </span>
              <ChevronRightIcon className="h-4 w-4 text-muted" />
            </Link>
          );
        })}
      </Card>
    </section>
  );

  return (
    <>
      <PageTitle subtitle="Payouts and refunds are claimed from the event vault once a bet settles.">My Bets</PageTitle>
      {section("Active", active)}
      {section("Settled", settled)}
    </>
  );
}
