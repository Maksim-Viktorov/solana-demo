import { APP_NAME, Logo } from "@/components/ui";
import { getSessionWallet } from "@/lib/auth/session";
import { data } from "@/lib/data";
import { OnboardingStepper } from "./stepper";

// No sidebar here: this route group has no app layout.
export default async function OnboardingPage() {
  const wallet = await getSessionWallet();
  const user = wallet ? await data.getUser(wallet) : null;
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      {/* Purple and green glows behind the card, as in the design. */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-[85%] -translate-y-1/2 rounded-full bg-[#9945FF]/25 blur-[120px]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-[15%] -translate-y-1/2 rounded-full bg-[#14F195]/20 blur-[120px]" />
      <div className="relative flex w-full max-w-md flex-col items-center">
        <div className="mb-1 flex items-center gap-2 text-2xl font-bold text-heading">
          <Logo className="h-8 w-8" />
          {APP_NAME}
        </div>
        <p className="mb-6 text-sm text-body">Bet on anything provable. Judged fairly.</p>
        <OnboardingStepper
          sessionWallet={wallet}
          kycVerified={user?.kycVerified ?? false}
          displayName={user?.displayName ?? null}
        />
      </div>
    </main>
  );
}
