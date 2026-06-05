/**
 * Audit detail loading skeleton: breadcrumb, title, the stat row, then the
 * findings block, matching the real page so the content swap is smooth.
 */
export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-6">
      <span className="sr-only">Loading audit…</span>

      <div className="flex flex-col gap-2">
        <div className="h-3 w-24 animate-pulse rounded bg-zinc-100" />
        <div className="h-7 w-72 animate-pulse rounded bg-zinc-200" />
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-5">
            <div className="h-3 w-20 animate-pulse rounded bg-zinc-100" />
            <div className="mt-2 h-6 w-12 animate-pulse rounded bg-zinc-200" />
          </div>
        ))}
      </div>

      <div className="h-64 animate-pulse rounded-lg border border-zinc-200 bg-white" />
    </div>
  );
}
