"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "@/components/icons";

export function CopyAddress({ wallet, label }: { wallet: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="flex items-center gap-1.5 hover:text-heading"
      title="Copy address"
      onClick={async () => {
        await navigator.clipboard.writeText(wallet);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {label}
      {copied ? <CheckIcon className="h-4 w-4 text-emerald-400" /> : <CopyIcon className="h-4 w-4" />}
    </button>
  );
}
