/**
 * Small presentation helpers shared across pages.
 */

export function formatTimestamp(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
    hour12: false,
  }) + " UTC";
}

export function formatGbp(value: string | number | null): string {
  if (value === null || value === undefined) return "—";
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(n);
}

export function formatDuration(startIso: string, endIso: string | null): string {
  if (!endIso) return "—";
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  // Defense in depth: a negative duration (clock skew / inverted timestamps)
  // should never render as "-128 ms". Show a floor instead.
  if (ms < 0) return "< 1 s";
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(2)} s`;
  return `${(ms / 60_000).toFixed(2)} min`;
}

// ─── Tailwind classes for status badges ─────────────────────────────────────

export function captureStatusClasses(status: string): string {
  switch (status) {
    case "passed":
      return "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200";
    case "failed":
      return "bg-rose-100 text-rose-900 ring-1 ring-rose-200";
    case "partial":
      return "bg-amber-100 text-amber-900 ring-1 ring-amber-200";
    case "error":
      return "bg-red-200 text-red-950 ring-1 ring-red-300";
    case "unmeasurable":
      return "bg-zinc-200 text-zinc-700 ring-1 ring-zinc-300";
    case "not_applicable":
      return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
    default:
      return "bg-zinc-100 text-zinc-800 ring-1 ring-zinc-200";
  }
}

export function auditStatusClasses(status: string): string {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200";
    case "completed_with_anomalies":
      return "bg-amber-100 text-amber-900 ring-1 ring-amber-300";
    case "running":
      return "bg-sky-100 text-sky-900 ring-1 ring-sky-200";
    case "partial":
      return "bg-amber-100 text-amber-900 ring-1 ring-amber-200";
    case "failed":
      return "bg-rose-100 text-rose-900 ring-1 ring-rose-200";
    case "cost_capped":
      return "bg-orange-100 text-orange-900 ring-1 ring-orange-200";
    default:
      return "bg-zinc-100 text-zinc-800 ring-1 ring-zinc-200";
  }
}

export function evidenceWeightClasses(weight: string): string {
  switch (weight) {
    case "Consensus":
      return "bg-indigo-50 text-indigo-900 ring-1 ring-indigo-200";
    case "Probable":
      return "bg-sky-50 text-sky-900 ring-1 ring-sky-200";
    case "Contested":
      return "bg-amber-50 text-amber-900 ring-1 ring-amber-200";
    case "Speculative":
      return "bg-zinc-50 text-zinc-700 ring-1 ring-zinc-200";
    default:
      return "bg-zinc-50 text-zinc-700 ring-1 ring-zinc-200";
  }
}
