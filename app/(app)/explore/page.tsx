import Link from "next/link";
import { PageTitle, Placeholder } from "@/components/placeholder";
import { data } from "@/lib/data";
import { formatDate, formatSol } from "@/lib/format";

export default async function ExplorePage() {
  const events = await data.listEvents();
  return (
    <>
      <PageTitle>Explore</PageTitle>
      <Placeholder label="Filters and search" className="mb-4" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {events.map((e) => (
          <Link key={e.id} href={`/events/${e.id}`}>
            <Placeholder label={`Event card · ${e.status}`}>
              <p className="font-medium text-heading">{e.title}</p>
              <p>Pool {formatSol(e.totalPool)} · deadline {formatDate(e.deadline)}</p>
            </Placeholder>
          </Link>
        ))}
      </div>
    </>
  );
}
