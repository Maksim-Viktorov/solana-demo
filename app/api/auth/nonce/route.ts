import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { isAddress } from "@solana/kit";
import { NONCE_COOKIE, NONCE_TTL_S, signToken } from "@/lib/auth/session";

// Step 1 of Sign-In With Solana. The server builds the exact message the
// wallet must sign and remembers it in a signed, short-lived cookie.
export async function POST(request: NextRequest) {
  const { address } = (await request.json().catch(() => ({}))) as { address?: string };
  if (!address || !isAddress(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  const nonce = randomBytes(16).toString("hex");
  const domain = request.headers.get("host") ?? "localhost";
  const issuedAt = new Date().toISOString();
  const message = [
    `${domain} wants you to sign in with your Solana account:`,
    address,
    "",
    "Sign in to [AppName]. This does not send a transaction or cost any SOL.",
    "",
    `URI: ${request.nextUrl.origin}`,
    "Chain ID: devnet",
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join("\n");

  const res = NextResponse.json({ message });
  res.cookies.set(NONCE_COOKIE, signToken({ address, message, exp: Math.floor(Date.now() / 1000) + NONCE_TTL_S }), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth",
    maxAge: NONCE_TTL_S,
  });
  return res;
}
