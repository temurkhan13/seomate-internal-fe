import Link from "next/link";

import { ApiError, getCompetitive, type CompetitiveReport } from "@/lib/api";

// Each run is a live, paid DataForSEO query — never statically cache it.
export const dynamic = "force-dynamic";

type SP = { target?: string; competitors?: string };

export default async function CompetitivePage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const target = (sp.target ?? "").trim();
  const competitors = (sp.competitors ?? "").trim();

  let report: CompetitiveReport | null = null;
  let error: string | null = null;
  if (target) {
    try {
      report = await getCompetitive(target, competitors || undefined);
    } catch (e) {
      error =
        e instanceof ApiError ? `${e.status} ${e.body || e.message}` : String(e);
    }
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
          positioning. Leave competitors blank and the platform finds them itself:
          the domains that recur in search results for the keywords this site
          already ranks for, with aggregators and directories filtered out. Or
          enter your own comma-separated list. Each run is a live, paid DataForSEO
          query.
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
            defaultValue={target}
            placeholder="example.com"
            required
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-[2] flex-col gap-1">
          <span className="text-xs font-medium text-zinc-600">
            Competitors (comma-separated, optional)
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
          Run analysis
        </button>
      </form>

      {error && (
        <div className="rounded border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">
          Analysis failed , {error}
        </div>
      )}

      {report && <Report report={report} />}
    </div>
  );
}

function Report({ report }: { report: CompetitiveReport }) {
  const fmt = (n: number) => n.toLocaleString();
  return (
    <div className="flex flex-col gap-6">
      {report.auto_discovered && (
        <div className="rounded border border-sky-300 bg-sky-50 p-3 text-xs text-sky-900">
          Competitors were auto-discovered: the domains that most often rank
          alongside this site for its own keywords, with aggregators and
          directories filtered out. Pass your own comma-separated list above to
          compare against specific competitors.
        </div>
      )}

      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 p-5">
          <h2 className="text-sm font-medium text-zinc-800">Visibility</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-zinc-500">
              <th className="p-3 font-medium">Domain</th>
              <th className="p-3 font-medium">Organic keywords</th>
              <th className="p-3 font-medium">Est. traffic</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {report.visibility.map((v) => (
              <tr key={v.domain} className={v.is_target ? "bg-emerald-50" : ""}>
                <td className="p-3 font-mono text-xs">
                  {v.domain}
                  {v.is_target && (
                    <span className="ml-2 rounded bg-emerald-200 px-1.5 py-0.5 text-[10px] text-emerald-900">
                      you
                    </span>
                  )}
                </td>
                <td className="p-3 font-mono">{fmt(v.organic_keywords)}</td>
                <td className="p-3 font-mono">{fmt(v.organic_traffic)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {report.opportunities && report.opportunities.length > 0 && (
        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 p-5">
            <h2 className="text-sm font-medium text-zinc-800">
              Keyword opportunities
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-zinc-500">
              Winnable keywords in this niche the site is not yet ranking for,
              found by expanding the competitors&apos; keywords and scored by
              search volume against ranking difficulty (lower difficulty ranks
              higher). Relevance to your business is your call; these are sorted
              by opportunity.
            </p>
          </div>
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-zinc-500">
                <th className="p-3 font-medium">Keyword</th>
                <th className="p-3 font-medium">Volume</th>
                <th className="p-3 font-medium">Difficulty</th>
                <th className="p-3 font-medium">Opportunity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {report.opportunities.map((o) => (
                <tr key={o.keyword}>
                  <td className="p-3">{o.keyword}</td>
                  <td className="p-3 font-mono">{o.volume.toLocaleString()}</td>
                  <td className="p-3 font-mono">{o.difficulty ?? "-"}</td>
                  <td className="p-3 font-mono">
                    {o.opportunity_score.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </section>
      )}

      {report.per_competitor.map((c) => (
        <section
          key={c.domain}
          className="rounded-lg border border-zinc-200 bg-white"
        >
          <div className="border-b border-zinc-100 p-5">
            <h2 className="text-sm font-medium text-zinc-800">vs {c.domain}</h2>
            <p className="mt-1 text-xs text-zinc-500">
              {fmt(c.gap_count)} keyword gaps · {fmt(c.shared_count)} shared (you
              win {c.we_win_shared}, they win {c.they_win_shared})
            </p>
          </div>
          <div className="grid gap-0 divide-zinc-100 sm:grid-cols-2 sm:divide-x">
            <KeywordList
              title="Keyword gaps (they rank, you don't)"
              rows={c.top_keyword_gaps.map((g) => ({
                keyword: g.keyword,
                volume: g.volume,
                a: g.their_position,
              }))}
              aLabel="pos"
            />
            <KeywordList
              title="Shared , they out-rank you"
              rows={c.top_losing_keywords.map((g) => ({
                keyword: g.keyword,
                volume: g.volume,
                a: g.our_position,
                b: g.their_position,
              }))}
              aLabel="you"
              bLabel="them"
            />
          </div>
        </section>
      ))}
    </div>
  );
}

function KeywordList({
  title,
  rows,
  aLabel,
  bLabel,
}: {
  title: string;
  rows: { keyword: string; volume: number; a: number | null; b?: number | null }[];
  aLabel: string;
  bLabel?: string;
}) {
  return (
    <div className="p-5">
      <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className="mt-2 text-xs text-zinc-400">none</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {rows.map((r, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-2 text-xs"
            >
              <span className="truncate text-zinc-800">{r.keyword}</span>
              <span className="flex shrink-0 items-center gap-2 font-mono text-zinc-500">
                <span>{r.volume.toLocaleString()}</span>
                <span className="text-zinc-400">
                  {aLabel} {r.a ?? "-"}
                  {bLabel ? ` / ${bLabel} ${r.b ?? "-"}` : ""}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
