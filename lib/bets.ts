import type { Event, Stake } from "@/lib/types";

export type BetResult = { label: "Won" | "Lost" | "Refunded" | "Open"; tone: "green" | "red" | "grey" | "blue"; payout: string | null };

// Mock payout: pro-rata share of the whole pool, ignoring fee and judge
// payments. The program computes the exact amount at claim time.
export function betResult(stake: Stake, event: Event): BetResult {
  const sol = (lamports: number) => `${(lamports / 1e9).toLocaleString("en-IE", { maximumFractionDigits: 2 })} SOL`;
  if (event.status === "resolved") {
    if (stake.optionId !== event.winningOptionId) return { label: "Lost", tone: "red", payout: `-${sol(Number(stake.amount))}` };
    const win = Number(event.poolByOption[stake.optionId] ?? "0");
    const payout = win ? (Number(stake.amount) * Number(event.totalPool)) / win : 0;
    return { label: "Won", tone: "green", payout: `+${sol(payout)}` };
  }
  if (event.status === "invalid") return { label: "Refunded", tone: "grey", payout: "0 SOL" };
  return { label: "Open", tone: "blue", payout: null };
}
