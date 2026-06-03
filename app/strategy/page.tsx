import { Suspense } from "react";

import Link from "next/link";

import { CompetitiveReportView } from "@/app/components/CompetitiveReportView";
import { SavedRunsList } from "@/app/components/SavedRunsList";
import { StrategyView } from "@/app/components/StrategyView";
import {
  ApiError,
  getSavedAnalyses,
  getSiteStrategy,
  getStrategyRun,
  type SavedAnalysisSummary,
  type SiteStrategy,
} from "@/lib/api";

// The audit half is free (DB); the competitive half is a live, paid DataForSEO
// query run only on explicit action. Never statically cache.
export const dynamic = "force-dynamic";

type SP = { target?: string; competitors?: string; compete?: string };

export default async function StrategyPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const target = (sp.target ?? "").trim();
  const competitors = (sp.competitors ?? "").trim();
  const compete = sp.compete === "1";

  let report: SiteStrategy | null = null;
  let error: string | null = null;
  if (target) {
    try {
      report = await getSiteStrategy(target);
    } catch (e) {
      error =
        e instanceof ApiError ? `${e.status} ${e.body || e.message}` : String(e);
    }
  }

  // History is best-effort , never block the page on it.
  let history: SavedAnalysisSummary[] = [];
  try {
    history = await getSavedAnalyses("strategy", target || undefined);
  } catch {
    history = [];
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Strategy</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-600">
          One view of a site: where it stands (latest audit), what moved since
          last time, the fixes sequenced into waves, and , on demand , the
          competitors and keywords to target. The audit view is free; running the
          competitive analysis is a paid DataForSEO query and saves the whole
          strategy as a snapshot you can revisit for free.
        </p>
      </div>

      <form
        method="GET"
        className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-5 sm:flex-row sm:items-end"
      >
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-xs font-medium text-zinc-600">Site domain</span>
          <input
            name="target"
            defaultValue={target}
            placeholder="example.com"
            required
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-[2] flex-col gap-1">
          <span className="text-xs font-medium text-zinc-600">
            Competitors (optional, used when you run competitive)
          </span>
          <input
            name="competitors"
            defaultValue={competitors}
            placeholder="competitor1.com, competitor2.com"
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Build strategy
        </button>
      </form>

      {error && (
        <div className="rounded border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">
          Strategy failed , {error}
        </div>
      )}

      {report && (
        <StrategyView strategy={report}>
          {compete ? (
            <Suspense fallback={<CompetitiveSkeleton />}>
              <CompetitiveSnapshot
                target={report.target}
                competitors={competitors}
              />
            </Suspense>
          ) : (
            <RunCompetitivePrompt
              target={report.target}
              competitors={competitors}
            />
          )}
        </StrategyView>
      )}

      <SavedRunsList
        kind="strategy"
        items={history}
        title={
          target ? `Past strategy snapshots for ${target}` : "Past strategy snapshots"
        }
      />
    </div>
  );
}

function RunCompetitivePrompt({
  target,
  competitors,
}: {
  target: string;
  competitors: string;
}) {
  return (
    <form method="GET" className="rounded-lg border border-sky-200 bg-sky-50 p-5">
      <input type="hidden" name="target" value={target} />
      <input type="hidden" name="competitors" value={competitors} />
      <input type="hidden" name="compete" value="1" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-sky-900">
            Competitors to watch + keywords to target
          </div>
          <div className="mt-0.5 max-w-xl text-xs text-sky-800">
            Run a live competitive analysis (a paid DataForSEO query) to get the
            competitors showing up for this site and the winnable keywords to go
            for. This also saves the whole strategy as a snapshot. Nothing is
            spent until you click.
          </div>
        </div>
        <button
          type="submit"
          className="shrink-0 rounded bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800"
        >
          Run + save strategy
        </button>
      </div>
    </form>
  );
}

function CompetitiveSkeleton() {
  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 p-5">
        <h2 className="text-sm font-medium text-zinc-800">Competitive analysis</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Running a live DataForSEO query , finding competitors, visibility, and
          keyword opportunities, then saving the snapshot. This takes 30 to 60
          seconds.
        </p>
      </div>
      <div className="space-y-2 p-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-6 animate-pulse rounded bg-zinc-100" />
        ))}
      </div>
    </section>
  );
}

// Runs the paid competitive half AND persists the full strategy snapshot
// (audit + diff + competitive) via /api/strategy/run, then renders the
// competitive part. The saved snapshot appears in the history list on reload.
async function CompetitiveSnapshot({
  target,
  competitors,
}: {
  target: string;
  competitors: string;
}) {
  try {
    const run = await getStrategyRun(target, competitors || undefined);
    return (
      <div className="flex flex-col gap-6">
        <CompetitiveReportView report={run.competitive} />
        <Link
          href={`/competitive?target=${encodeURIComponent(target)}`}
          className="text-xs text-zinc-500 hover:text-zinc-700"
        >
          Competitive analysis on its own →
        </Link>
      </div>
    );
  } catch (e) {
    return (
      <div className="rounded border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">
        Competitive analysis failed ,{" "}
        {e instanceof ApiError ? `${e.status} ${e.body || e.message}` : String(e)}
      </div>
    );
  }
}
