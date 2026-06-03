import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError, getAuditStrategy, type AuditStrategy } from "@/lib/api";

export const dynamic = "force-dynamic";

type Params = { auditId: string };

function barColor(pct: number | null): string {
  if (pct === null) return "bg-zinc-300";
  if (pct >= 67) return "bg-emerald-400";
  if (pct >= 34) return "bg-amber-400";
  return "bg-rose-400";
}

export default async function StrategyPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { auditId } = await params;

  let strategy: AuditStrategy;
  try {
    strategy = await getAuditStrategy(auditId);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <Link
          href={`/audits/${auditId}`}
          className="text-xs text-zinc-500 hover:text-zinc-700"
        >
          ← Audit
        </Link>
        <div className="mt-2 flex items-end justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Strategy</h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-600">
              Where {strategy.site_domain} stands, and the work sequenced into
              waves. Derived from the audit. For a specific goal, a session
              re-sequences this into a saved playbook.
            </p>
          </div>
          <div className="text-right">
            <div className="font-mono text-2xl text-zinc-900">
              {strategy.actionable_findings}
            </div>
            <div className="text-xs text-zinc-500">to act on</div>
          </div>
        </div>
      </div>

      {/* Positioning */}
      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 p-5">
          <h2 className="text-sm font-medium text-zinc-800">
            Where the site stands
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Health is passed over graded per pillar. The low bars are where the
            visibility problem is.
          </p>
        </div>
        <div className="divide-y divide-zinc-100">
          {strategy.positioning.map((p) => (
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
              <div className="w-32 shrink-0 text-right font-mono text-[11px] text-zinc-400">
                {p.passed} pass / {p.failed} fail
                {p.partial ? ` / ${p.partial} pt` : ""}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Waves */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium text-zinc-800">
          The plan, in sequence
        </h2>
        {strategy.waves.map((w, i) => (
          <div
            key={w.key}
            className="overflow-hidden rounded-lg border border-zinc-200 bg-white"
          >
            <div className="border-b border-zinc-100 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-800">
                  {i + 1}. {w.title}
                </h3>
                <span className="font-mono text-sm text-zinc-500">
                  {w.count}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">{w.blurb}</p>
            </div>
            {w.items.length > 0 ? (
              <ul className="divide-y divide-zinc-100">
                {w.items.map((it) => (
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
              </ul>
            ) : (
              <p className="p-5 text-xs text-zinc-400">Nothing in this wave.</p>
            )}
          </div>
        ))}
      </section>

      {/* Keyword targeting pointer , lives on the competitive surface (paid) */}
      <Link
        href="/competitive"
        className="flex items-center justify-between rounded-lg border border-sky-200 bg-sky-50 p-5 hover:border-sky-300 hover:bg-sky-100"
      >
        <div>
          <div className="text-sm font-medium text-sky-900">
            Keyword targeting →
          </div>
          <div className="mt-0.5 text-xs text-sky-800">
            Where you rank, who is ahead, and the winnable keywords to go for.
            Live competitive + opportunity analysis.
          </div>
        </div>
      </Link>
    </div>
  );
}
