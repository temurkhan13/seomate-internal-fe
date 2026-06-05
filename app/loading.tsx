/**
 * App-wide loading fallback. This is the root Suspense boundary, shown during
 * navigation to any route that does not declare a closer loading.tsx, so it is
 * deliberately neutral (a heading + a small card grid) rather than shaped like
 * one specific page.
 */
export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-4">
      <span className="sr-only">Loading…</span>
      <div className="h-7 w-56 animate-pulse rounded bg-zinc-200" />
      <div className="h-4 w-80 animate-pulse rounded bg-zinc-100" />
      <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-lg border border-zinc-200 bg-white"
          />
        ))}
      </div>
    </div>
  );
}
