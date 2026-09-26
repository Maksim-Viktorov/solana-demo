import Link from "next/link";
import { getSessionWallet, getViewer } from "@/lib/auth/session";
import { data } from "@/lib/data";
import { PlusIcon } from "./icons";
import { WalletButton } from "./wallet-button";

export async function TopBar() {
  const sessionWallet = await getSessionWallet();
  const viewer = await getViewer();
  const user = viewer ? await data.getUser(viewer.wallet) : null;

  return (
    <header className="flex h-20 items-center justify-end gap-3 px-8">
      {viewer?.isDemo ? (
        <span className="mr-auto rounded-full border border-border px-3 py-1 text-xs text-muted">
          Demo mode: viewing as {user?.displayName ?? "seed user"} until you sign in
        </span>
      ) : null}
      <Link
        href="/events/new"
        className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white"
      >
        <PlusIcon className="h-4 w-4" />
        New prediction
      </Link>
      <WalletButton sessionWallet={sessionWallet} kycVerified={!viewer?.isDemo && !!user?.kycVerified} />
    </header>
  );
}
