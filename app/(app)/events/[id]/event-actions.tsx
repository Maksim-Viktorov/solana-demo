"use client";

import { useState } from "react";
import { UploadIcon } from "@/components/icons";
import { Card, PrimaryButton } from "@/components/ui";
import type { EventOption } from "@/lib/types";

export function StakeForm({ options }: { options: EventOption[] }) {
  const [option, setOption] = useState(options[0]?.id);
  const [amount, setAmount] = useState("0.1");
  const [notice, setNotice] = useState<string | null>(null);
  return (
    <Card className="p-5">
      <h2 className="mb-3 text-lg font-semibold">Place a stake</h2>
      <div className="mb-3 grid grid-cols-2 gap-2">
        {options.map((o, i) => (
          <button
            key={o.id}
            onClick={() => setOption(o.id)}
            className={`rounded-xl border py-2.5 text-sm font-semibold ${
              i === 0 ? "border-emerald-500/40 text-emerald-400" : "border-rose-500/40 text-rose-400"
            } ${option === o.id ? "bg-white/10 ring-2 ring-white/60" : "bg-white/[0.03]"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <label className="mb-1 block text-sm text-body">Amount</label>
      <div className="mb-3 flex items-center rounded-xl border border-border bg-background px-3">
        <input
          className="w-full bg-transparent py-2.5 text-heading outline-none"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <span className="text-sm text-muted">SOL</span>
      </div>
      <PrimaryButton
        className="w-full"
        disabled={!option || !(Number(amount) > 0)}
        onClick={() =>
          // TODO: call placeStake in lib/solana/program.ts with the connected wallet.
          setNotice("Staking needs the deployed program. placeStake in lib/solana/program.ts is still a stub.")
        }
      >
        Place stake
      </PrimaryButton>
      {notice ? <p className="mt-2 text-sm text-amber-300">{notice}</p> : null}
      <p className="mt-3 text-xs text-muted">Your SOL locks in the event&apos;s program vault until it resolves.</p>
    </Card>
  );
}

export function EvidenceUpload({ proofRequirement }: { proofRequirement: string }) {
  const [file, setFile] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  return (
    <Card className="p-5">
      <h2 className="mb-1 text-lg font-semibold">Upload proof</h2>
      <p className="mb-3 text-sm text-muted">{proofRequirement}</p>
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-white/25 p-6 text-center hover:bg-white/[0.03]">
        <UploadIcon className="h-7 w-7 text-body" />
        <span className="text-sm text-heading">{file ?? "Choose a file"}</span>
        <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0]?.name ?? null)} />
      </label>
      <PrimaryButton
        className="mt-3 w-full"
        disabled={!file}
        onClick={() =>
          // TODO: store the file (e.g. object storage), then submitEvidence onchain with its hash.
          setNotice("Uploading needs file storage and submitEvidence in lib/solana/program.ts.")
        }
      >
        Submit proof
      </PrimaryButton>
      {notice ? <p className="mt-2 text-sm text-amber-300">{notice}</p> : null}
    </Card>
  );
}
