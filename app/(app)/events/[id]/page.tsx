import { notFound } from "next/navigation";
import { PageTitle, Placeholder } from "@/components/placeholder";
import { data } from "@/lib/data";
import { formatDate, formatSol } from "@/lib/format";

export default async function EventPage({ params }: PageProps<"/events/[id]">) {
  const { id } = await params;
  const event = await data.getEvent(id);
  if (!event) notFound();
  const stakes = await data.getStakesForEvent(id);
  const pastDeadline = new Date(event.deadline) < new Date();

  return (
    <>
      <PageTitle>{event.title}</PageTitle>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Placeholder label="Options">
            {event.options.map((o) => (
              <p key={o.id}>
                {o.label} · {formatSol(event.poolByOption[o.id] ?? "0")}
              </p>
            ))}
          </Placeholder>
          <Placeholder label="Rules and proof requirement">
            {event.rules.map((r) => (
              <p key={r}>{r}</p>
            ))}
            <p>Proof ({event.proofType}): {event.proofRequirement}</p>
          </Placeholder>
          {pastDeadline ? (
            <Placeholder label="Evidence upload (after deadline)" />
          ) : null}
          <Placeholder label="Status timeline">
            <p>Created {formatDate(event.createdAt)} · deadline {formatDate(event.deadline)} · now {event.status}</p>
          </Placeholder>
        </div>
        <div className="flex flex-col gap-4">
          <Placeholder label="Pool">
            <p>
              {formatSol(event.totalPool)} from {stakes.length} stakes
            </p>
          </Placeholder>
          {event.status === "open" ? <Placeholder label="Stake form (option, amount, place stake)" /> : null}
        </div>
      </div>
    </>
  );
}
