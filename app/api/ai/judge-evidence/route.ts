import { createHash, randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { data } from "@/lib/data";
import type { AiVerdict } from "@/lib/types";

// The verdict must stay hidden, so this route stores it server side and only
// returns a commitment (hash of choice + salt), never the choice itself.
export type JudgeEvidenceResponse = {
  eventId: string;
  committed: true;
  commitment: string;
  committedAt: string;
};

export async function POST(request: NextRequest) {
  // TODO: restrict to the platform (internal secret or cron), not any caller.
  const { eventId } = (await request.json().catch(() => ({}))) as { eventId?: string };
  const event = eventId ? await data.getEvent(eventId) : null;
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  const evidence = await data.getEvidence(event.id);
  if (evidence.length === 0) return NextResponse.json({ error: "No evidence uploaded" }, { status: 409 });

  // TODO: call Claude via @anthropic-ai/sdk with the rules, proof requirement
  // and evidence (images as content blocks). Ask for { choice, confidence,
  // reasoning } where choice is an option id or "unprovable".
  const choice = event.options[0].id;
  const salt = randomBytes(16).toString("hex");
  const commitment = createHash("sha256").update(`${event.id}:${choice}:${salt}`).digest("hex");
  const verdict: AiVerdict = {
    eventId: event.id,
    choice,
    confidence: 0.88,
    reasoning: "The certificate shows the subject's name and a pass date before the deadline.",
    commitment,
    committedAt: new Date().toISOString(),
  };
  // TODO: keep the salt server side for the reveal, and call
  // lib/solana/program.ts commitAiVerdict with the commitment.
  await data.commitAiVerdict(verdict);

  const body: JudgeEvidenceResponse = { eventId: event.id, committed: true, commitment, committedAt: verdict.committedAt };
  return NextResponse.json(body);
}
