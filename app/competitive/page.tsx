import Link from "next/link";

import { CompetitiveReportView } from "@/app/components/CompetitiveReportView";
import { SavedRunsList } from "@/app/components/SavedRunsList";
import {
  ApiError,
  getCompetitive,
  getSavedAnalyses,
  type CompetitiveReport,
  type SavedAnalysisSummary,
} from "@/lib/api";

// Each run is a live, paid DataForSEO query; never statically cache it.
export const dynamic = "force-dynamic";

type SP = { target?: string; competitors?: string; focus?: string };

export default async function CompetitivePage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const target = (sp.target ?? "").trim();
  const competitors = (sp.competitors ?? "").trim();
  const focus = (sp.focus ?? "").trim();

  let report: CompetitiveReport | null = null;
  let error: string | null = null;
  if (target) {
    try {
      // Runs the paid query and persists it as a saved competitive analysis.
      report = await getCompetitive(
        target,
        competitors || undefined,
        focus || undefined,
      );
    } catch (e) {
      error =
        e instanceof ApiError ? `${e.status} ${e.body || e.message}` : String(e);
    }
  }

  // History is best-effort , never block the page on it.
  let history: SavedAnalysisSummary[] = [];
  try {
    history = await getSavedAnalyses("competitive", target || undefined);
  } catch {
    history = [];
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href="/audits"
          className="text-xs text-zinc-500 hover:text-zinc-700"
        >
          ← Audits
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Competitive analysis
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-600">
          Compare a site against competitors across visibility, keyword gaps, and
          positioning. Best results: name your <strong>focus keywords</strong>{" "}
          (the heads you want to win, e.g. AI and blockchain) and the platform
          finds competitors by who actually ranks for them (the right method for
          a low-footprint site). Or pass your own competitor list. Leave both blank
          and it falls back to a weaker homepage-based guess. Each run is a live,
          paid DataForSEO query, saved so you can revisit it for free.
        </p>
      </div>

      <form
        method="GET"
        className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-5 sm:flex-row sm:items-end"
      >
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-xs font-medium text-zinc-600">Your domain</span>
          <input
            name="target"
            type="text"
            inputMode="url"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            defaultValue={target}
            placeholder="example.com"
            required
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-xs font-medium text-zinc-600">
            Competitors (optional)
          </span>
          <input
            name="competitors"
            type="text"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            defaultValue={competitors}
            placeholder="competitor1.com, competitor2.com"
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-[1.5] flex-col gap-1">
          <span className="text-xs font-medium text-zinc-600">
            Focus keywords (recommended if no competitors)
          </span>
          <input
            name="focus"
            type="text"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            defaultValue={focus}
            placeholder="ai development company, blockchain development, smart contract"
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Run analysis
        </button>
      </form>

      {error && (
        <div className="rounded border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">
          Analysis failed: {error}
        </div>
      )}

      {report && <CompetitiveReportView report={report} />}

      <SavedRunsList
        kind="competitive"
        items={history}
        title={target ? `Past runs for ${target}` : "Past competitive runs"}
      />
    </div>
  );
}
