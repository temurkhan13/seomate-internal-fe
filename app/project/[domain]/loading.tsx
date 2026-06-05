/**
 * Workspace loading skeleton, shown while the project page server-renders (e.g.
 * opening a project from the dashboard). It mirrors the real layout: title +
 * pillar strip, the tab bar, then a few content cards, so the switch from
 * skeleton to content does not jump.
 */
export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-6">
      <span className="sr-only">Loading project…</span>

      <div className="flex flex-col gap-3">
        <div className="h-7 w-64 animate-pulse rounded bg-zinc-200" />
        <div className="h-12 w-80 animate-pulse rounded bg-zinc-100" />
        <div className="h-3 w-40 animate-pulse rounded bg-zinc-100" />
      </div>

      <div className="flex gap-1 border-b border-zinc-200">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-9 w-24 animate-pulse rounded-t bg-zinc-100"
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-lg border border-zinc-200 bg-white"
          />
        ))}
      </div>
    </div>
  );
}
