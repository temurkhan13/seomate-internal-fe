import type { CompetitiveReport } from "@/lib/api";

/**
 * Full competitive-report render , visibility, keyword opportunities, and
 * per-competitor gaps. Shared by the live Competitive page, the saved
 * competitive detail page, and the saved strategy detail page so the same run
 * looks identical whether it was just run or is being revisited from history.
 */
export function CompetitiveReportView({ report }: { report: CompetitiveReport }) {
  const fmt = (n: number) => n.toLocaleString();
  return (
    <div className="flex flex-col gap-6">
      {report.auto_discovered && (
        <div className="rounded border border-sky-300 bg-sky-50 p-3 text-xs text-sky-900">
          Competitors were auto-discovered: the domains that most often rank
          alongside this site for its own keywords, with aggregators and
          directories filtered out. Pass your own comma-separated list to compare
          against specific competitors.
        </div>
      )}

      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 p-5">
          <h2 className="text-sm font-medium text-zinc-800">Visibility</h2>
        </div>
        <div className="overflow-x-auto">
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
        </div>
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
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
            </table>
          </div>
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
