import Link from "next/link";

import type { SavedAnalysisSummary } from "@/lib/api";
import { formatTimestamp } from "@/lib/format";

/**
 * History list for a saved-analysis surface (competitive or strategy). Each row
 * links to the free detail view (``/{kind}/{id}``) , so past runs are browsable
 * like audits and revisiting one never re-spends DataForSEO budget.
 */
export function SavedRunsList({
  kind,
  items,
  title,
}: {
  kind: "competitive" | "strategy";
  items: SavedAnalysisSummary[];
  title: string;
}) {
  if (items.length === 0) return null;
  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 p-5">
        <h2 className="text-sm font-medium text-zinc-800">{title}</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Past runs, newest first. Open one to revisit it for free, no new
          DataForSEO query.
        </p>
      </div>
      <ul className="divide-y divide-zinc-100">
        {items.map((it) => (
          <li key={it.analysis_id}>
            <Link
              href={`/${kind}/${it.analysis_id}`}
              className="flex items-center justify-between gap-3 p-4 text-sm hover:bg-zinc-50"
            >
              <span className="font-mono text-xs text-zinc-800">{it.target}</span>
              <span className="flex shrink-0 items-center gap-3 text-xs text-zinc-500">
                {it.created_at && (
                  <span className="font-mono">
                    {formatTimestamp(it.created_at)}
                  </span>
                )}
                <span className="text-zinc-400">view →</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
