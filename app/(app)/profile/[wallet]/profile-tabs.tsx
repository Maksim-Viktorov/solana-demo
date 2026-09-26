"use client";

import { useState } from "react";

export function ProfileTabs({ bettor, volunteer }: { bettor: React.ReactNode; volunteer: React.ReactNode }) {
  const [tab, setTab] = useState<"bettor" | "volunteer">("bettor");
  return (
    <>
      <div className="mb-5 flex gap-6 border-b border-border">
        {(["bettor", "volunteer"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative px-4 pb-3 text-lg ${tab === t ? "text-heading" : "text-muted hover:text-body"}`}
          >
            {t === "bettor" ? "As a Bettor" : "As a Volunteer"}
            {tab === t ? <span className="absolute inset-x-0 -bottom-px h-0.5 bg-accent" /> : null}
          </button>
        ))}
      </div>
      {tab === "bettor" ? bettor : volunteer}
    </>
  );
}
