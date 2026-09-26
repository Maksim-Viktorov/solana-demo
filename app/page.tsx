import { SendForm } from "./send-form";
import { WalletPanel } from "./wallet-panel";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-xl flex-col gap-8 px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Solana devnet demo</h1>
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-medium">Wallet</h2>
          <WalletPanel />
        </section>
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-medium">Send SOL</h2>
          <SendForm />
        </section>
      </main>
    </div>
  );
}
