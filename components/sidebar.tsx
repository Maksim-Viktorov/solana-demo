"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CompassIcon, PlusIcon, UserIcon, UsersIcon, WalletIcon } from "./icons";
import { Brand } from "./ui";

const NAV = [
  { href: "/explore", label: "Explore", Icon: CompassIcon },
  { href: "/my-bets", label: "My Bets", Icon: WalletIcon },
  { href: "/events/new", label: "Create", Icon: PlusIcon },
  { href: "/volunteer", label: "Volunteer", Icon: UsersIcon },
  { href: "/profile", label: "Profile", Icon: UserIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 flex h-screen w-60 shrink-0 flex-col gap-1 border-r border-border bg-[#0E0E14] px-4 py-6">
      <Link href="/explore" className="mb-8 px-3">
        <Brand />
      </Link>
      {NAV.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] transition ${
              active ? "bg-accent font-semibold text-white" : "text-body hover:bg-white/5 hover:text-heading"
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
      <p className="mt-auto px-3 text-xs text-muted">Solana devnet</p>
    </nav>
  );
}
