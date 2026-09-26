import { NextResponse, type NextRequest } from "next/server";
import nacl from "tweetnacl";
import { address as toAddress, getAddressEncoder } from "@solana/kit";
import { NONCE_COOKIE, SESSION_COOKIE, SESSION_TTL_S, signToken, verifyToken } from "@/lib/auth/session";

type NonceToken = { address: string; message: string; exp: number };

// Step 2 of Sign-In With Solana. The client sends only the signature; the
// message and address come from the server's own signed nonce cookie, so the
// client cannot swap in a different message.
export async function POST(request: NextRequest) {
  const { signature } = (await request.json().catch(() => ({}))) as { signature?: string };
  const pending = verifyToken<NonceToken>(request.cookies.get(NONCE_COOKIE)?.value);
  if (!pending) {
    return NextResponse.json({ error: "Nonce missing or expired, request a new one" }, { status: 401 });
  }
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const sigBytes = Buffer.from(signature, "base64");
  const publicKey = new Uint8Array(getAddressEncoder().encode(toAddress(pending.address)));
  const ok =
    sigBytes.length === nacl.sign.signatureLength &&
    nacl.sign.detached.verify(new TextEncoder().encode(pending.message), sigBytes, publicKey);

  // The nonce is single use whether or not verification succeeded.
  const res = ok
    ? NextResponse.json({ wallet: pending.address })
    : NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  res.cookies.delete({ name: NONCE_COOKIE, path: "/api/auth" });
  if (ok) {
    res.cookies.set(SESSION_COOKIE, signToken({ wallet: pending.address, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_S }), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_TTL_S,
    });
  }
  return res;
}
