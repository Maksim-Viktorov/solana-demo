"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRightIcon,
  ClockIcon,
  SearchIcon,
  ShareIcon,
  SparklesIcon,
  UserIcon,
} from "@/components/icons";
import { Avatar, Card, CATEGORY_LABEL, CategoryIcon, SplitBar, StatusDot, TrustBadge } from "@/components/ui";
import { daysLeft, formatDateTime, formatShortDate, formatSol, optionPercents } from "@/lib/format";
import type { Event, EventCategory } from "@/lib/types";

export type ExploreItem = { event: Event; creatorName: string; creatorTrust: number; bettors: number };

const FILTERS: (EventCategory | "all")[] = ["all", "sports", "study", "work", "life"];
const ACTIVE = new Set(["open", "awaiting_evidence", "in_review"]);

function Creator({ item }: { item: ExploreItem }) {
  return (
    <span className="flex items-center gap-1.5 text-sm text-body">
      <Avatar name={item.creatorName} />
      {item.creatorName}
      <TrustBadge value={item.creatorTrust} />
    </span>
  );
}

function OptionButtons({ event, big = false }: { event: Event; big?: boolean }) {
  const pcts = optionPercents(event);
  const size = big ? "py-3 text-base" : "py-2 text-sm";
  return (
    <div className="flex gap-3">
      {event.options.slice(0, 2).map((o, i) => (
        <Link
          key={o.id}
          href={`/events/${event.id}`}
          className={`flex-1 rounded-xl border text-center font-semibold ${size} ${
            i === 0
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
              : "border-rose-500/40 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
          }`}
        >
          {o.label} {pcts[i]}%
        </Link>
      ))}
    </div>
  );
}

function Hero({ item }: { item: ExploreItem }) {
  const { event } = item;
  const pcts = optionPercents(event);
  return (
    <Card className="grid overflow-hidden md:grid-cols-[1.6fr_1fr]">
      <div className="flex flex-col gap-4 p-8">
        <div className="flex items-center gap-2 text-sm text-muted">
          <StatusDot status={event.status} />
          <span>·</span>
          {CATEGORY_LABEL[event.category]}
          <span>·</span>
          Betting closes {formatDateTime(event.deadline)}
        </div>
        <Link href={`/events/${event.id}`}>
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight hover:underline">{event.title}</h2>
        </Link>
        <Creator item={item} />
        <div className="mt-2 flex gap-3">
          <div className="flex-1">
            <OptionButtons event={event} big />
          </div>
          <button
            className="rounded-xl border border-border px-4 text-body hover:bg-white/5"
            title="Copy link"
            onClick={() => navigator.clipboard.writeText(`${location.origin}/events/${event.id}`)}
          >
            <ShareIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-4 border-t border-border bg-gradient-to-br from-[#9945FF]/10 to-transparent p-8 md:border-l md:border-t-0">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Pool</p>
        <p className="text-3xl font-extrabold text-heading">
          {formatSol(event.totalPool)} <span className="text-sm font-normal text-muted">{item.bettors} bettors</span>
        </p>
        <SplitBar yesPct={pcts[0]} />
        <div className="flex justify-between text-sm font-semibold">
          <span className="text-emerald-400">
            {event.options[0].label} {pcts[0]}%
          </span>
          <span className="text-rose-400">
            {event.options[1].label} {pcts[1]}%
          </span>
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-2 text-xs">
          <span className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-heading">
            <SparklesIcon className="h-3.5 w-3.5 text-purple-400" /> AI checker
          </span>
          +
          <span className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-heading">
            <UserIcon className="h-3.5 w-3.5 text-emerald-400" /> Anonymous volunteer
          </span>
        </div>
        <p className="text-xs text-muted">
          Both check the proof on their own. The result stands only if they agree.
        </p>
      </div>
    </Card>
  );
}

function HotCard({ item }: { item: ExploreItem }) {
  const { event } = item;
  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between text-xs text-muted">
        <span className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border">
            <CategoryIcon category={event.category} className="h-4 w-4 text-body" />
          </span>
          {CATEGORY_LABEL[event.category]}
        </span>
        <span className="flex items-center gap-1">
          <ClockIcon className="h-3.5 w-3.5" />
          {formatShortDate(event.deadline)}
        </span>
      </div>
      <Link href={`/events/${event.id}`} className="font-bold leading-snug text-heading hover:underline">
        {event.title}
      </Link>
      <div className="flex items-center justify-between">
        <Creator item={item} />
        <span className="text-xs text-muted">{formatSol(event.totalPool)}</span>
      </div>
      <SplitBar yesPct={optionPercents(event)[0]} />
      <OptionButtons event={event} />
    </Card>
  );
}

function statusSuffix(event: Event): string | undefined {
  if (event.status === "open") return `${daysLeft(event.deadline)} days left`;
  if (event.status === "awaiting_evidence") return `due ${formatShortDate(event.deadline)}`;
  if (event.status === "resolved")
    return `${event.options.find((o) => o.id === event.winningOptionId)?.label ?? ""} won`;
  return undefined;
}

function FeedRow({ item }: { item: ExploreItem }) {
  const { event } = item;
  return (
    <Link
      href={`/events/${event.id}`}
      className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-border px-5 py-4 last:border-b-0 hover:bg-white/[0.02] md:grid-cols-[auto_1.4fr_1fr_auto_auto]"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border">
        <CategoryIcon category={event.category} className="h-4 w-4 text-body" />
      </span>
      <div className="min-w-0">
        <p className="truncate font-semibold text-heading">{event.title}</p>
        <Creator item={item} />
      </div>
      <span className="hidden md:block">
        <StatusDot status={event.status} suffix={statusSuffix(event)} />
      </span>
      <span className="hidden font-semibold text-heading md:block">{formatSol(event.totalPool)}</span>
      {event.status === "open" ? (
        <span className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white">Bet</span>
      ) : (
        <ChevronRightIcon className="h-4 w-4 text-muted" />
      )}
    </Link>
  );
}

export function ExploreView({ items }: { items: ExploreItem[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [showAll, setShowAll] = useState(false);

  const q = query.trim().toLowerCase();
  const visible = items.filter(
    (i) => (filter === "all" || i.event.category === filter) && (!q || i.event.title.toLowerCase().includes(q)),
  );
  const byPool = [...visible].sort((a, b) => Number(b.event.totalPool) - Number(a.event.totalPool));
  const hero = byPool.find((i) => i.event.status === "open");
  const hot = byPool.filter((i) => i !== hero && ACTIVE.has(i.event.status)).slice(0, 3);
  const feed = visible.filter((i) => i !== hero && !hot.includes(i));
  const feedShown = showAll ? feed : feed.slice(0, 6);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <label className="flex items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-3.5 text-muted focus-within:border-white/30">
          <SearchIcon className="h-4 w-4" />
          <input
            className="w-full max-w-md bg-transparent text-center text-heading outline-none placeholder:text-muted"
            placeholder="Search predictions"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm ${
                filter === f ? "border-white bg-white font-semibold text-black" : "border-border text-body hover:bg-white/5"
              }`}
            >
              {f !== "all" ? <CategoryIcon category={f} className="h-4 w-4" /> : null}
              {f === "all" ? "All" : CATEGORY_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      {hero ? (
        <section>
          <h2 className="mb-4 text-xl font-bold">Most relevant</h2>
          <Hero item={hero} />
        </section>
      ) : null}

      {hot.length ? (
        <section>
          <h2 className="mb-4 text-xl font-bold">Hot bets</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {hot.map((i) => (
              <HotCard key={i.event.id} item={i} />
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-4 text-xl font-bold">Feed</h2>
        <Card>
          {feedShown.length ? (
            feedShown.map((i) => <FeedRow key={i.event.id} item={i} />)
          ) : (
            <p className="p-6 text-center text-muted">No predictions match.</p>
          )}
          {feed.length > 6 && !showAll ? (
            <button className="w-full border-t border-border py-3 text-sm text-body" onClick={() => setShowAll(true)}>
              Show more
            </button>
          ) : null}
        </Card>
      </section>
    </div>
  );
}
