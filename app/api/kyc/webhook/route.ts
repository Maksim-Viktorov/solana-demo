import { NextResponse, type NextRequest } from "next/server";
import { data } from "@/lib/data";
import { takeKycSession } from "@/lib/kyc/mock-provider";

// Mock webhook. In production the KYC provider calls this, not the browser.
// TODO: verify the provider's webhook signature header before trusting the body.
export async function POST(request: NextRequest) {
  const { kycSessionId, status } = (await request.json().catch(() => ({}))) as {
    kycSessionId?: string;
    status?: "approved" | "rejected";
  };
  const wallet = kycSessionId ? takeKycSession(kycSessionId) : null;
  if (!wallet) return NextResponse.json({ error: "Unknown KYC session" }, { status: 404 });
  if (status !== "approved") return NextResponse.json({ wallet, kycVerified: false });

  const user = await data.setKycVerified(wallet);
  // TODO: create the onchain verified record for this wallet, signed with
  // PLATFORM_AUTHORITY_SECRET, so the program can require KYC for stakes and votes.
  return NextResponse.json({ wallet, kycVerified: user.kycVerified });
}
