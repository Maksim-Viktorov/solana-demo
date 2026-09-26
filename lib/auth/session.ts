import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { ALICE } from "@/lib/data/seed";

// Server only. Cookies are "<base64url JSON>.<HMAC>", so the server can
// trust their contents without a session store.

export const SESSION_COOKIE = "session";
export const NONCE_COOKIE = "siws_nonce";
export const SESSION_TTL_S = 7 * 24 * 60 * 60;
export const NONCE_TTL_S = 5 * 60;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET is not set");
  return "dev-only-session-secret";
}

function hmac(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function signToken(data: object): string {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${payload}.${hmac(payload)}`;
}

export function verifyToken<T extends { exp: number }>(token: string | undefined): T | null {
  if (!token) return null;
  const [payload, mac] = token.split(".");
  if (!payload || !mac) return null;
  const expected = Buffer.from(hmac(payload));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as T;
  return data.exp > Date.now() / 1000 ? data : null;
}

export type Session = { wallet: string; exp: number };

export async function getSessionWallet(): Promise<string | null> {
  const store = await cookies();
  return verifyToken<Session>(store.get(SESSION_COOKIE)?.value)?.wallet ?? null;
}

// Mock-only convenience: when nobody is signed in, pages render as a seed
// user so the UI has data to show. Delete DEMO_WALLET when going live.
export const DEMO_WALLET: string | null = ALICE;

export type Viewer = { wallet: string; isDemo: boolean };

export async function getViewer(): Promise<Viewer | null> {
  const wallet = await getSessionWallet();
  if (wallet) return { wallet, isDemo: false };
  return DEMO_WALLET ? { wallet: DEMO_WALLET, isDemo: true } : null;
}
