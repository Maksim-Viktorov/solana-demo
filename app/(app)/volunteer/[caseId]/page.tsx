import { notFound } from "next/navigation";
import { PageTitle, Placeholder } from "@/components/placeholder";
import { getViewer } from "@/lib/auth/session";
import { data } from "@/lib/data";
import { VoteForm } from "./vote-form";

const LOCKED = ["Participants", "Stakes", "AI verdict", "Other reviewers"];

// Blind review. This page may only read data.getBlindCase, which has no
// participants, stakes or AI verdict in it, so nothing can leak to the client.
export default async function BlindReviewPage({ params }: PageProps<"/volunteer/[caseId]">) {
  const { caseId } = await params;
  const viewer = await getViewer();
  const view = viewer ? await data.getBlindCase(caseId, viewer.wallet) : null;
  if (!view) notFound();

  return (
    <>
      <PageTitle>
        Case #{view.caseNumber} · {view.event.title}
      </PageTitle>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Placeholder label="Event rules and proof requirement">
            {view.event.rules.map((r) => (
              <p key={r}>{r}</p>
            ))}
            <p>
              Proof ({view.event.proofType}): {view.event.proofRequirement}
            </p>
          </Placeholder>
          <Placeholder label="Evidence viewer">
            {view.evidence.map((e) => (
              <p key={e.id}>
                [{e.kind}] {e.description}
              </p>
            ))}
          </Placeholder>
          <VoteForm caseId={view.caseId} options={view.event.options} initialOutcome={view.outcome} />
        </div>
        <Placeholder label="Locked chips">
          <div className="flex flex-wrap gap-2">
            {LOCKED.map((l) => (
              <span key={l} className="rounded-full border border-border px-3 py-1 text-muted">
                {l}: hidden
              </span>
            ))}
          </div>
        </Placeholder>
      </div>
    </>
  );
}
