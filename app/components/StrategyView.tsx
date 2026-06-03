import type { ReactNode } from "react";

import Link from "next/link";

import { Positioning } from "@/app/components/Positioning";
import type { AuditDiff, AuditStrategy, DiffVar, SiteStrategy } from "@/lib/api";

/**
 * The strategy display , Loop diff + on-site positioning + sequenced waves.
 * Shared by the live Strategy page (which streams the paid competitive half in
 * via ``children``) and the saved-snapshot detail page (which passes a static
 * competitive render in via ``children``). Keeps a revisited snapshot identical
 * to a freshly built one.
 */
export function StrategyView({
  strategy,
  children,
}: {
  strategy: SiteStrategy;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <WhatChanged diff={strategy.diff} />

      {strategy.audit ? (
        <Positioning positioning={strategy.audit.positioning} />
      ) : (
        <NoAudit />
      )}

      {strategy.audit && strategy.audit.waves.length > 0 && (
        <Waves audit={strategy.audit} />
      )}

      {children}
    </div>
  );
}

export function WhatChanged({ diff }: { diff: AuditDiff | null }) {
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
            <li key={v.variable_id} className="flex items-center gap-2 text-xs">
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
