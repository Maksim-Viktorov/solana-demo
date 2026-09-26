import { getSessionWallet } from "@/lib/auth/session";
import { data } from "@/lib/data";
import { OnboardingStepper } from "./stepper";

// No sidebar here: this route group has no app layout.
export default async function OnboardingPage() {
  const wallet = await getSessionWallet();
  const user = wallet ? await data.getUser(wallet) : null;
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">Welcome to [AppName]</h1>
      <OnboardingStepper sessionWallet={wallet} kycVerified={user?.kycVerified ?? false} />
    </main>
  );
}
