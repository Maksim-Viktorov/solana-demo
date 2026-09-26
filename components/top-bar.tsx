import { getSessionWallet, getViewer } from "@/lib/auth/session";
import { data } from "@/lib/data";
import { WalletButton } from "./wallet-button";

export async function TopBar() {
  const sessionWallet = await getSessionWallet();
  const viewer = await getViewer();
  const user = viewer ? await data.getUser(viewer.wallet) : null;

  return (
    <header className="flex h-16 items-center justify-end gap-4 border-b border-border px-6">
      {viewer?.isDemo ? (
        <span className="text-xs text-muted">Demo: viewing as {user?.displayName ?? "seed user"} until you sign in</span>
      ) : null}
      {user?.kycVerified ? (
        <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-black">KYC verified</span>
      ) : null}
      <WalletButton sessionWallet={sessionWallet} />
    </header>
  );
}
