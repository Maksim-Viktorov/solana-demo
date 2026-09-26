import { NextResponse, type NextRequest } from "next/server";
import type { EventCategory, EventOption, ProofType } from "@/lib/types";

export type EventDraft = {
  title: string;
  description: string;
  subject: string;
  category: EventCategory;
  rules: string[];
  options: EventOption[];
  proofType: ProofType;
  proofRequirement: string;
  deadline: string;
  proofDeadline: string;
};

export type DraftEventResponse =
  | { status: "ok"; draft: EventDraft; provability: { provable: true; harmful: false; notes: string } }
  | { status: "rejected"; provability: { provable: boolean; harmful: boolean; reason: string } };

const DAY = 24 * 60 * 60 * 1000;

// Stub with the final response shape. It echoes the idea back as a draft.
// TODO: call Claude via @anthropic-ai/sdk (server side, ANTHROPIC_API_KEY) with
// a structured-output schema matching DraftEventResponse. The model drafts
// rules, options and proof, and rejects unprovable or harmful ideas.
export async function POST(request: NextRequest) {
  const { idea } = (await request.json().catch(() => ({}))) as { idea?: string };
  const text = idea?.trim();
  if (!text) return NextResponse.json({ error: "Missing idea" }, { status: 400 });

  // Crude mock of the rejection paths so the UI can show both states.
  if (/\b(hurt|kill|drunk|steal|fight)\b/i.test(text)) {
    return NextResponse.json({
      status: "rejected",
      provability: { provable: true, harmful: true, reason: "This bet could encourage someone to harm themselves or others." },
    } satisfies DraftEventResponse);
  }
  if (/\b(feel|happy|love|think|believe)\b/i.test(text)) {
    return NextResponse.json({
      status: "rejected",
      provability: {
        provable: false,
        harmful: false,
        reason: "This bet couldn't be verified as a valid claim. Try rephrasing with a clear, measurable outcome and a verifiable proof source.",
      },
    } satisfies DraftEventResponse);
  }

  const isExam = /\b(exam|test|grade|score|%|percent)\b/i.test(text);
  const title = text.charAt(0).toUpperCase() + text.slice(1).replace(/[.?!]+$/, "");
  const subject = text.match(/^(I|[A-Z][a-z]+)\b/)?.[1] ?? "The creator";
  const deadline = new Date(Date.now() + 5 * DAY);
  deadline.setUTCHours(23, 59, 0, 0);

  const body: DraftEventResponse = {
    status: "ok",
    draft: {
      title,
      description: `${subject === "I" ? "The creator bets they" : subject} will make this happen: ${text.replace(/[.?!]+$/, "")}.`,
      subject: subject === "I" ? "The creator" : subject,
      category: isExam ? "study" : "life",
      rules: [
        `Resolves Yes if the proof shows: ${text.replace(/[.?!]+$/, "")}.`,
        "Resolves No if the proof shows it did not happen by the event deadline.",
        "If no clear proof is uploaded before the proof deadline, the bet is invalid and everyone is refunded minus the platform fee.",
      ],
      options: [
        { id: "yes", label: "Yes" },
        { id: "no", label: "No" },
      ],
      proofType: isExam ? "screenshot" : "photo",
      proofRequirement: isExam
        ? "Official exam grade transcript or screenshot from the student portal, showing the name and the score."
        : "Photo or screenshot that clearly shows the outcome and the date.",
      deadline: deadline.toISOString(),
      proofDeadline: new Date(deadline.getTime() + 2 * DAY).toISOString(),
    },
    provability: { provable: true, harmful: false, notes: "Outcome is measurable and backed by a checkable document." },
  };
  return NextResponse.json(body);
}
