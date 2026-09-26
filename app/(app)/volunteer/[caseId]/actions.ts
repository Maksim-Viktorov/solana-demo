"use server";

import { getViewer } from "@/lib/auth/session";
import { data } from "@/lib/data";
import type { CaseOutcome } from "@/lib/types";

// Returns only the outcome for this volunteer, never the AI verdict itself.
export async function submitVote(caseId: string, choice: string): Promise<{ outcome: CaseOutcome } | { error: string }> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Sign in first" };
  const view = await data.getBlindCase(caseId, viewer.wallet);
  if (!view) return { error: "Case not found" };
  if (choice !== "unprovable" && !view.event.options.some((o) => o.id === choice)) return { error: "Invalid choice" };
  try {
    // TODO: have the volunteer sign lib/solana/program.ts castVote instead.
    return { outcome: await data.castVote(caseId, viewer.wallet, choice) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Vote failed" };
  }
}
