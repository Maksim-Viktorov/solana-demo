import type { EventCategory, EventStatus } from "@/lib/types";
import { BriefcaseIcon, GraduationIcon, HeartIcon, RunIcon, ShieldCheckIcon } from "./icons";

export const APP_NAME = "Predict IRL";

export function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id="logo-g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#9945FF" />
          <stop offset="1" stopColor="#14F195" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="15" fill="url(#logo-g)" />
      <path d="M11 22V10h6a4 4 0 0 1 0 8h-6" fill="none" stroke="#0B0B10" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Brand() {
  return (
    <span className="flex items-center gap-2 text-lg font-bold text-heading">
      <Logo />
      {APP_NAME}
    </span>
  );
}

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-card border border-border bg-card ${className}`}>{children}</div>;
}

// Card with the purple-to-green gradient border from the designs.
export function GradientCard({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-card bg-accent p-[1.5px]">
      <div className={`rounded-[14.5px] bg-card ${className}`}>{children}</div>
    </div>
  );
}

export function PrimaryButton({
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`rounded-xl bg-accent px-5 py-2.5 font-semibold text-white shadow-lg shadow-purple-900/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      {...props}
    />
  );
}

export function SecondaryButton({
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`rounded-xl border border-border bg-white/5 px-5 py-2.5 font-medium text-heading transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      {...props}
    />
  );
}

export function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
      <ShieldCheckIcon className="h-3.5 w-3.5" />
      Verified
    </span>
  );
}

export function TrustBadge({ value }: { value: number }) {
  const color = value >= 3 ? "text-emerald-400 border-emerald-500/30" : value >= 1.5 ? "text-amber-400 border-amber-500/30" : "text-muted border-border";
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium ${color}`}>
      <ShieldCheckIcon className="h-3 w-3" />
      {value.toFixed(1)}
    </span>
  );
}

const AVATAR_GRADIENTS = [
  "from-fuchsia-500 to-purple-600",
  "from-sky-400 to-indigo-600",
  "from-emerald-400 to-teal-600",
  "from-orange-400 to-rose-500",
  "from-amber-300 to-orange-500",
];

export function Avatar({ name, className = "h-5 w-5 text-[10px]" }: { name: string; className?: string }) {
  const g = AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length];
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white ${g} ${className}`}>
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export const CATEGORY_LABEL: Record<EventCategory, string> = {
  sports: "Sports",
  study: "Study",
  work: "Work",
  life: "Life",
};

export function CategoryIcon({ category, className }: { category: EventCategory; className?: string }) {
  const I = { sports: RunIcon, study: GraduationIcon, work: BriefcaseIcon, life: HeartIcon }[category];
  return <I className={className} />;
}

const STATUS: Record<EventStatus, { label: string; dot: string }> = {
  open: { label: "Live", dot: "bg-emerald-400" },
  awaiting_evidence: { label: "Awaiting proof", dot: "bg-amber-400" },
  in_review: { label: "Verifying · AI + volunteer", dot: "bg-sky-400" },
  resolved: { label: "Resolved", dot: "bg-emerald-400" },
  invalid: { label: "Invalid · refunded", dot: "bg-rose-400" },
  rejected: { label: "Rejected by AI", dot: "bg-rose-400" },
};

export function StatusDot({ status, suffix }: { status: EventStatus; suffix?: string }) {
  const s = STATUS[status];
  return (
    <span className="inline-flex items-center gap-2 text-sm text-body">
      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
      {s.label}
      {suffix ? ` · ${suffix}` : ""}
    </span>
  );
}

type PillTone = "green" | "red" | "amber" | "blue" | "grey";
const PILL: Record<PillTone, string> = {
  green: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  red: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  blue: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  grey: "bg-white/5 text-body border-border",
};

export function Pill({ tone, children }: { tone: PillTone; children: React.ReactNode }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${PILL[tone]}`}>{children}</span>;
}

// Yes/No split bar, green then red.
export function SplitBar({ yesPct }: { yesPct: number }) {
  return (
    <div className="flex h-1.5 overflow-hidden rounded-full bg-rose-500/70">
      <div className="bg-emerald-400" style={{ width: `${yesPct}%` }} />
    </div>
  );
}

export function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card className="px-5 py-4 text-lg text-body">
      {label} · <span className="font-bold text-heading">{value}</span>
    </Card>
  );
}

export function PageTitle({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold tracking-tight">{children}</h1>
      {subtitle ? <p className="mt-1 text-muted">{subtitle}</p> : null}
    </div>
  );
}
