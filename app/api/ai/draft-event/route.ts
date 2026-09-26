import { NextResponse, type NextRequest } from "next/server";
import type { EventOption, ProofType } from "@/lib/types";

export type DraftEventResponse =
  | {
      status: "ok";
      draft: {
        title: string;
        subject: string;
        rules: string[];
        options: EventOption[];
        proofType: ProofType;
        proofRequirement: string;
        deadline: string;
      };
      provability: { provable: true; harmful: false; notes: string };
    }
  | {
      status: "rejected";
      provability: { provable: boolean; harmful: boolean; reason: string };
    };

// Stub with the final response shape.
// TODO: call Claude via @anthropic-ai/sdk (server side, ANTHROPIC_API_KEY) with
// a structured-output schema matching DraftEventResponse. The model drafts
// rules, options and proof, and rejects unprovable or harmful ideas.
export async function POST(request: NextRequest) {
  const { idea } = (await request.json().catch(() => ({}))) as { idea?: string };
  if (!idea?.trim()) return NextResponse.json({ error: "Missing idea" }, { status: 400 });

  // Crude mock of the rejection path so the UI can show both states.
  if (/\b(hurt|kill|drunk|steal|fight)\b/i.test(idea)) {
    const body: DraftEventResponse = {
      status: "rejected",
      provability: { provable: true, harmful: true, reason: "This event could encourage someone to harm themselves or others." },
    };
    return NextResponse.json(body);
  }

  const deadline = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  deadline.setUTCHours(23, 59, 0, 0);
  const body: DraftEventResponse = {
    status: "ok",
    draft: {
      title: "Will Conor pass his driving test by Friday?",
      subject: "Conor",
      rules: [
        "Resolves Yes if Conor passes the full driving test on or before the deadline.",
        "A test rescheduled past the deadline resolves No.",
        "A pass on a provisional or learner test does not count.",
      ],
      options: [
        { id: "yes", label: "Yes" },
        { id: "no", label: "No" },
      ],
      proofType: "document",
      proofRequirement: "Photo of the official pass certificate showing Conor's name and the test date.",
      deadline: deadline.toISOString(),
    },
    provability: {
      provable: true,
      harmful: false,
      notes: "Outcome is binary and backed by an official document with a date.",
    },
  };
  return NextResponse.json(body);
}
