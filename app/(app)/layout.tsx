import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-8 pb-16">{children}</main>
        <footer className="flex items-center justify-center gap-2 py-6 text-xs text-muted">
          Every result is checked by an AI and an anonymous volunteer, independently. · Solana devnet
        </footer>
      </div>
    </div>
  );
}
