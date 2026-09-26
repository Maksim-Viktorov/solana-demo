// Grey stand-in for a section of the real UI. Replace each one with the
// designed component; the label says what goes there.
export function Placeholder({
  label,
  children,
  className = "",
}: {
  label: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-card border border-dashed border-border bg-card p-4 ${className}`}>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      {children ? <div className="flex flex-col gap-2 text-sm">{children}</div> : <div className="h-16" />}
    </section>
  );
}

export function PageTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="mb-6 text-2xl font-semibold">{children}</h1>;
}
