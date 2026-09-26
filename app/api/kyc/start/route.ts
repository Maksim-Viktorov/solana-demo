import { NextResponse } from "next/server";
import { getSessionWallet } from "@/lib/auth/session";
import { startKycSession } from "@/lib/kyc/mock-provider";

// Mock. Requires a real signed-in session, not the demo viewer.
export async function POST() {
  const wallet = await getSessionWallet();
  if (!wallet) return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  // TODO: create a session with the real KYC provider and return its widget token.
  return NextResponse.json({ ...startKycSession(wallet), provider: "mock" });
}
