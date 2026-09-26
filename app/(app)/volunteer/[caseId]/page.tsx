import { notFound } from "next/navigation";
import { EyeOffIcon, LockIcon, PaperclipIcon } from "@/components/icons";
import { Card } from "@/components/ui";
import { getViewer } from "@/lib/auth/session";
import { data } from "@/lib/data";
import { formatDate, formatSol } from "@/lib/format";
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
      <div className="mb-6">
        <p className="text-sm text-muted">
          Case #{view.caseNumber} · Reviewer {view.round} of 3 · Blind review
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{view.event.title}</h1>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-5">
          <Card className="p-6">
            <h2 className="mb-3 text-lg font-semibold">Rules</h2>
            <ul className="space-y-1.5 text-sm text-body">
              {view.event.rules.map((r) => (
                <li key={r} className="flex gap-2">
                  <span className="text-muted">•</span>
                  {r}
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-xl border border-border bg-white/[0.03] p-3 text-sm">
              <p className="mb-1 flex items-center gap-2 font-medium text-heading">
                <PaperclipIcon className="h-4 w-4" /> Required proof ({view.event.proofType})
              </p>
              <p className="text-body">{view.event.proofRequirement}</p>
              <p className="mt-1 text-xs text-muted">Event deadline: {formatDate(view.event.deadline)}</p>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-3 text-lg font-semibold">Evidence</h2>
            {view.evidence.length === 0 ? <p className="text-sm text-muted">No evidence was uploaded.</p> : null}
            <div className="flex flex-col gap-3">
              {view.evidence.map((e) => (
                <div key={e.id} className="overflow-hidden rounded-xl border border-border">
                  {/* TODO: render the real file (image/PDF viewer) once uploads are stored. */}
                  <div className="flex h-56 items-center justify-center bg-gradient-to-br from-white/[0.06] to-transparent text-sm text-muted">
                    {e.kind} preview
                  </div>
                  <p className="border-t border-border px-4 py-3 text-sm text-body">{e.description}</p>
                </div>
              ))}
            </div>
          </Card>

          <VoteForm caseId={view.caseId} options={view.event.options} initialOutcome={view.outcome} />
        </div>

        <div className="flex flex-col gap-5">
          <Card className="p-6">
            <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
              <EyeOffIcon className="h-5 w-5" /> Hidden from you
            </h2>
            <p className="mb-4 text-sm text-muted">
              You judge the evidence alone. Nothing below is ever sent to your browser.
            </p>
            <div className="flex flex-wrap gap-2">
              {LOCKED.map((l) => (
                <span
                  key={l}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-white/5 px-3 py-1.5 text-sm text-muted"
                >
                  <LockIcon className="h-3.5 w-3.5" />
                  {l}
                </span>
              ))}
            </div>
          </Card>
          <Card className="p-6 text-sm">
            <h2 className="mb-3 text-lg font-semibold">Reward</h2>
            <p className="flex justify-between text-body">
              Match the AI judge <span className="font-semibold text-emerald-400">+{formatSol(view.rewardMatch)}</span>
            </p>
            <p className="mt-1 flex justify-between text-body">
              No match <span className="font-semibold text-emerald-400">+{formatSol(view.rewardBounty, 3)}</span>
            </p>
            <p className="mt-3 text-xs text-muted">
              If 3 reviewers in a row disagree with the AI, the bet is invalid and everyone is refunded.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
