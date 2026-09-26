import type { Event } from "@/lib/types";

const LAMPORTS_PER_SOL = 1_000_000_000;
// Fixed locale so server-rendered and client-rendered text match (no hydration mismatch).
const LOCALE = "en-IE";

export function formatSol(lamports: string, digits = 2): string {
  return `${(Number(lamports) / LAMPORTS_PER_SOL).toLocaleString(LOCALE, { maximumFractionDigits: digits })} SOL`;
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(LOCALE, { day: "numeric", month: "short", year: "numeric" });
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(LOCALE, { day: "numeric", month: "short" });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(LOCALE, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function daysLeft(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

// Share of the pool on each option, in whole percent. Empty pools split evenly.
export function optionPercents(event: Event): number[] {
  const total = Number(event.totalPool);
  if (!total) return event.options.map(() => Math.round(100 / event.options.length));
  return event.options.map((o) => Math.round((Number(event.poolByOption[o.id] ?? "0") / total) * 100));
}
