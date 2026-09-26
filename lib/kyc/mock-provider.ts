import { randomBytes } from "node:crypto";

// Stand-in for a real KYC provider (Sumsub, Persona, ...). Maps provider
// session ids to wallets so the webhook knows who was approved.
const g = globalThis as unknown as { __kycSessions?: Map<string, string> };
const sessions = (g.__kycSessions ??= new Map<string, string>());

export function startKycSession(wallet: string) {
  const kycSessionId = `kyc_${randomBytes(8).toString("hex")}`;
  sessions.set(kycSessionId, wallet);
  return { kycSessionId };
}

export function takeKycSession(kycSessionId: string): string | null {
  const wallet = sessions.get(kycSessionId) ?? null;
  sessions.delete(kycSessionId);
  return wallet;
}
