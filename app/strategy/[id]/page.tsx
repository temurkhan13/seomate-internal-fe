import Link from "next/link";
import { notFound } from "next/navigation";

import { CompetitiveReportView } from "@/app/components/CompetitiveReportView";
import { StrategyView } from "@/app/components/StrategyView";
import {
  ApiError,
  getSavedAnalysis,
  type SavedAnalysisDetail,
  type SiteStrategy,
  type StrategyRun,
} from "@/lib/api";
import { formatTimestamp } from "@/lib/format";

// Saved snapshot is read-only from the DB , no DataForSEO call, but keep it
// fresh against the live table rather than statically cached.
export const dynamic = "force-dynamic";

export default async function StrategyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let saved: SavedAnalysisDetail;
  try {
    saved = await getSavedAnalysis(id);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
  if (saved.kind !== "strategy") notFound();

  const bundle = saved.payload as StrategyRun;
  const strategy: SiteStrategy = {
    target: bundle.target,
    has_audit: bundle.has_audit,
    audit: bundle.audit,
    diff: bundle.diff,
  };
  const when = saved.created_at ? formatTimestamp(saved.created_at) : null;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href={`/strategy?target=${encodeURIComponent(saved.target)}`}
          className="text-xs text-zinc-500 hover:text-zinc-700"
        >
          ← Strategy
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Strategy snapshot: {saved.target}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Saved snapshot{when ? ` from ${when}` : ""}. Revisited for free, no new
          DataForSEO query.
        </p>
      </div>

      <StrategyView strategy={strategy}>
        {bundle.competitive && (
          <CompetitiveReportView report={bundle.competitive} />
        )}
      </StrategyView>
    </div>
  );
}
