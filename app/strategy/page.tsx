import { Suspense } from "react";

import Link from "next/link";

import { Positioning } from "@/app/components/Positioning";
import {
  ApiError,
  getCompetitive,
  getSiteStrategy,
  type AuditDiff,
  type AuditStrategy,
  type CompetitiveReport,
  type DiffVar,
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

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Strategy</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-600">
          One view of a site: where it stands (latest audit), what moved since
          last time, the fixes sequenced into waves, and , on demand , the
          competitors and keywords to target. The audit view is free; the
          competitive analysis is a paid DataForSEO query you run explicitly.
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
        <div className="flex flex-col gap-6">
          <WhatChanged diff={report.diff} />

          {report.audit ? (
            <Positioning positioning={report.audit.positioning} />
          ) : (
            <NoAudit />
          )}

          {report.audit && report.audit.waves.length > 0 && (
            <Waves audit={report.audit} />
          )}

          {compete ? (
            <Suspense fallback={<CompetitiveSkeleton />}>
              <CompetitiveSection
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
        </div>
      )}
    </div>
  );
}

function WhatChanged({ diff }: { diff: AuditDiff | null }) {
  if (!diff || !diff.has_diff) return null;
  const moved = diff.pillars.filter((p) => p.delta !== null && p.delta !== 0);
  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 p-5">
        <h2 className="text-sm font-medium text-zinc-800">
          What changed since the last audit
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Pillar health deltas, and the variables that flipped, vs the previous
          audit
          {diff.previous_started_at
            ? ` (${diff.previous_started_at.slice(0, 10)})`
            : ""}
          .
        </p>
        {diff.rerun_warning && (
          <p className="mt-2 rounded bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900">
            No older audit to compare against , this is a same-period re-run, so
            treat these deltas as measurement variance, not real change.
          </p>
        )}
      </div>
      <div className="p-5">
        <div className="flex flex-wrap gap-2">
          {moved.length === 0 ? (
            <span className="text-xs text-zinc-400">No pillar health change.</span>
          ) : (
            moved.map((p) => (
              <span
                key={p.pillar}
                className={`rounded px-2 py-1 text-xs font-medium ${
                  p.delta! > 0
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-rose-50 text-rose-800"
                }`}
              >
                {p.label} {p.delta! > 0 ? "+" : ""}
                {p.delta}% ({p.prev_pct ?? "n/a"}% to {p.cur_pct ?? "n/a"}%)
              </span>
            ))
          )}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <DiffList
            title={`Newly passing (${diff.newly_passed.length})`}
            vars={diff.newly_passed}
            tone="emerald"
          />
          <DiffList
            title={`Newly failing (${diff.newly_failed.length})`}
            vars={diff.newly_failed}
            tone="rose"
          />
        </div>
      </div>
    </section>
  );
}

function DiffList({
  title,
  vars,
  tone,
}: {
  title: string;
  vars: DiffVar[];
  tone: "emerald" | "rose";
}) {
  return (
    <div>
      <h3
        className={`text-xs font-medium ${tone === "emerald" ? "text-emerald-700" : "text-rose-700"}`}
      >
        {title}
      </h3>
      {vars.length === 0 ? (
        <p className="mt-1 text-xs text-zinc-400">none</p>
      ) : (
        <ul className="mt-1 space-y-1">
          {vars.map((v) => (
            <li
              key={v.variable_id}
              className="flex items-center gap-2 text-xs"
            >
              <span className="shrink-0 font-mono text-zinc-500">
                {v.variable_id}
              </span>
              <span className="truncate text-zinc-700">{v.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Waves({ audit }: { audit: AuditStrategy }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-sm font-medium text-zinc-800">The plan, in sequence</h2>
      {audit.waves.map((w, i) => (
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
              {w.items.slice(0, 8).map((it) => (
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
              {w.items.length > 8 && (
                <li className="p-3 text-xs text-zinc-400">
                  + {w.items.length - 8} more , see the full fix plan
                </li>
              )}
            </ul>
          )}
        </div>
      ))}
      <Link
        href={`/audits/${audit.audit_id}/plan`}
        className="text-xs text-zinc-500 hover:text-zinc-700"
      >
        Full fix plan →
      </Link>
    </section>
  );
}

function NoAudit() {
  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 p-5">
        <h2 className="text-sm font-medium text-zinc-800">
          Where the site stands
        </h2>
        <p className="mt-1 text-xs text-zinc-500">No audit yet for this domain.</p>
      </div>
      <div className="p-5 text-sm text-zinc-600">
        Run an audit to get on-site positioning and the sequenced fix plan.{" "}
        <Link href="/audits" className="text-zinc-900 underline">
          Audits →
        </Link>
      </div>
    </section>
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
    <form
      method="GET"
      className="rounded-lg border border-sky-200 bg-sky-50 p-5"
    >
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
            for. Nothing is spent until you click.
          </div>
        </div>
        <button
          type="submit"
          className="shrink-0 rounded bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800"
        >
          Run competitive analysis
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
          keyword opportunities. This takes 30 to 60 seconds.
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

async function CompetitiveSection({
  target,
  competitors,
}: {
  target: string;
  competitors: string;
}) {
  let comp: CompetitiveReport;
  try {
    comp = await getCompetitive(target, competitors || undefined);
  } catch (e) {
    return (
      <div className="rounded border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">
        Competitive analysis failed ,{" "}
        {e instanceof ApiError ? `${e.status} ${e.body || e.message}` : String(e)}
      </div>
    );
  }
  const fmt = (n: number) => n.toLocaleString();
  return (
    <div className="flex flex-col gap-6">
      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 p-5">
          <h2 className="text-sm font-medium text-zinc-800">
            Competitive standing
          </h2>
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
              {comp.visibility.map((v) => (
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

      {comp.opportunities && comp.opportunities.length > 0 && (
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
                {comp.opportunities.map((o) => (
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

      <Link
        href={`/competitive?target=${encodeURIComponent(target)}`}
        className="text-xs text-zinc-500 hover:text-zinc-700"
      >
        Full competitive analysis (keyword gaps per competitor) →
      </Link>
    </div>
  );
}
