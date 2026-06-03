import Link from "next/link";

import { ApiError, getSiteStrategy, type SiteStrategy } from "@/lib/api";

// The competitive half is a live, paid DataForSEO query , never statically cache.
export const dynamic = "force-dynamic";

type SP = { target?: string; competitors?: string };

function barColor(pct: number | null): string {
  if (pct === null) return "bg-zinc-300";
  if (pct >= 67) return "bg-emerald-400";
  if (pct >= 34) return "bg-amber-400";
  return "bg-rose-400";
}

export default async function StrategyPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const target = (sp.target ?? "").trim();
  const competitors = (sp.competitors ?? "").trim();

  let report: SiteStrategy | null = null;
  let error: string | null = null;
  if (target) {
    try {
      report = await getSiteStrategy(target, competitors || undefined);
    } catch (e) {
      error =
        e instanceof ApiError ? `${e.status} ${e.body || e.message}` : String(e);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Strategy</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-600">
          One view of a site: where it stands (from its latest audit), the fixes
          sequenced into waves, and the keywords to go for (live competitive +
          opportunity analysis). The competitive half is a paid DataForSEO query.
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
          Build strategy
        </button>
      </form>

      {error && (
        <div className="rounded border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">
          Strategy failed , {error}
        </div>
      )}

      {report && <Report report={report} />}
    </div>
  );
}

function Report({ report }: { report: SiteStrategy }) {
  const fmt = (n: number) => n.toLocaleString();
  const a = report.audit;
  const c = report.competitive;
  return (
    <div className="flex flex-col gap-6">
      {/* Positioning */}
      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 p-5">
          <h2 className="text-sm font-medium text-zinc-800">
            Where the site stands
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            {a
              ? "Pillar health from the latest audit. The low bars are where the visibility problem is."
              : "No audit yet for this domain."}
          </p>
        </div>
        {a ? (
          <div className="divide-y divide-zinc-100">
            {a.positioning.map((p) => (
              <div key={p.pillar} className="flex items-center gap-4 p-4">
                <div className="w-48 shrink-0">
                  <span className="font-mono text-xs text-zinc-400">
                    {p.pillar}
                  </span>
                  <span className="ml-2 text-sm text-zinc-800">{p.label}</span>
                </div>
                <div className="h-2 flex-1 overflow-hidden rounded bg-zinc-100">
                  <div
                    className={`h-full ${barColor(p.health_pct)}`}
                    style={{ width: `${p.health_pct ?? 0}%` }}
                  />
                </div>
                <div className="w-12 shrink-0 text-right font-mono text-xs text-zinc-600">
                  {p.health_pct === null ? "n/a" : `${p.health_pct}%`}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5 text-sm text-zinc-600">
            Run an audit to get on-site positioning and the sequenced fix plan.{" "}
            <Link href="/audits" className="text-zinc-900 underline">
              Audits →
            </Link>
          </div>
        )}
      </section>

      {/* Waves */}
      {a && a.waves.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-zinc-800">
            The plan, in sequence
          </h2>
          {a.waves.map((w, i) => (
            <div
              key={w.key}
              className="overflow-hidden rounded-lg border border-zinc-200 bg-white"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 p-5">
                <div>
                  <h3 className="text-sm font-medium text-zinc-800">
                    {i + 1}. {w.title}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500">{w.blurb}</p>
                </div>
                <span className="font-mono text-sm text-zinc-500">{w.count}</span>
              </div>
              {w.items.length > 0 && (
                <ul className="divide-y divide-zinc-100">
                  {w.items.slice(0, 6).map((it) => (
                    <li
                      key={it.variable_id}
                      className="flex items-start gap-3 p-3 text-xs"
                    >
                      <span className="shrink-0 font-mono text-zinc-400">
                        {it.variable_id}
                      </span>
                      <span className="leading-relaxed text-zinc-700">
                        {it.concrete_change}
                      </span>
                    </li>
                  ))}
                  {w.items.length > 6 && (
                    <li className="p-3 text-xs text-zinc-400">
                      + {w.items.length - 6} more
                    </li>
                  )}
                </ul>
              )}
            </div>
          ))}
          {a.audit_id && (
            <Link
              href={`/audits/${a.audit_id}/plan`}
              className="text-xs text-zinc-500 hover:text-zinc-700"
            >
              Full fix plan →
            </Link>
          )}
        </section>
      )}

      {/* Competitive standing */}
      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 p-5">
          <h2 className="text-sm font-medium text-zinc-800">
            Competitive standing
          </h2>
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
            {c.visibility.map((v) => (
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

      {/* Keyword opportunities */}
      {c.opportunities && c.opportunities.length > 0 && (
        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 p-5">
            <h2 className="text-sm font-medium text-zinc-800">
              Keyword opportunities
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Winnable keywords to target, scored by volume against difficulty.
              Relevance to your business is your call.
            </p>
          </div>
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
              {c.opportunities.map((o) => (
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
        </section>
      )}

      <Link
        href={`/competitive?target=${encodeURIComponent(report.target)}`}
        className="text-xs text-zinc-500 hover:text-zinc-700"
      >
        Full competitive analysis (keyword gaps per competitor) →
      </Link>
    </div>
  );
}
