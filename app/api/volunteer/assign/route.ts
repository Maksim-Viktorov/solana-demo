import { NextResponse, type NextRequest } from "next/server";
import { data } from "@/lib/data";

// Picks a random KYC-verified user with no stake in the event (and who is not
// its creator or an earlier reviewer). The response names only the volunteer,
// never the participants.
export async function POST(request: NextRequest) {
  // TODO: restrict to the platform (internal secret or cron), not any caller.
  const { eventId } = (await request.json().catch(() => ({}))) as { eventId?: string };
  if (!eventId) return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
  try {
    const c = await data.assignVolunteer(eventId);
    // TODO: record the assignment onchain via lib/solana/program.ts assignVolunteer.
    return NextResponse.json({ caseId: c.id, caseNumber: c.number, volunteer: c.volunteer, round: c.round });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Assignment failed" }, { status: 409 });
  }
}
