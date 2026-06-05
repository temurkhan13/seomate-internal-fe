import Link from "next/link";
import { notFound } from "next/navigation";

import { CompetitiveReportView } from "@/app/components/CompetitiveReportView";
import {
  ApiError,
  getSavedAnalysis,
  type CompetitiveReport,
  type SavedAnalysisDetail,
} from "@/lib/api";
import { formatTimestamp } from "@/lib/format";

// Saved detail is read-only from the DB , no DataForSEO call, but keep it fresh
// against the live table rather than statically cached.
export const dynamic = "force-dynamic";

export default async function CompetitiveDetailPage({
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
  if (saved.kind !== "competitive") notFound();

  const report = saved.payload as CompetitiveReport;
  const when = saved.created_at ? formatTimestamp(saved.created_at) : null;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href={`/competitive?target=${encodeURIComponent(saved.target)}`}
          className="text-xs text-zinc-500 hover:text-zinc-700"
        >
          ← Competitive
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Competitive analysis: {saved.target}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Saved run{when ? ` from ${when}` : ""}. Revisited for free, no new
          DataForSEO query.
        </p>
      </div>

      <CompetitiveReportView report={report} />
    </div>
  );
}
