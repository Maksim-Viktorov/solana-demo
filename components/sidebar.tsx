"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/explore", label: "Explore" },
  { href: "/my-bets", label: "My Bets" },
  { href: "/events/new", label: "Create" },
  { href: "/volunteer", label: "Volunteer" },
  { href: "/profile", label: "Profile" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <nav className="flex w-56 shrink-0 flex-col gap-1 border-r border-border p-4">
      <Link href="/explore" className="mb-6 px-3 text-lg font-semibold text-accent">
        [AppName]
      </Link>
      {NAV.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-lg px-3 py-2 ${active ? "bg-card text-heading" : "text-body hover:bg-card"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
