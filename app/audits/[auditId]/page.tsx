import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ApiError,
  getAudit,
  listCaptures,
  type AuditAnomaly,
  type CaptureSummary,
} from "@/lib/api";
import {
  auditStatusClasses,
  captureStatusClasses,
  evidenceWeightClasses,
  formatDuration,
  formatGbp,
  formatTimestamp,
} from "@/lib/format";

const PILLARS: Array<{ id: string; name: string }> = [
  { id: "P0", name: "Strategic Foundation" },
  { id: "P1", name: "On-Page SEO" },
  { id: "P2", name: "Technical SEO" },
  { id: "P3", name: "Off-Page Authority" },
  { id: "P4", name: "Content Operations" },
  { id: "P5", name: "Local SEO" },
  { id: "P6", name: "AI Search / GEO" },
];

type Params = { auditId: string };

export default async function AuditDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { auditId } = await params;

  let audit, captures: CaptureSummary[];
  try {
    [audit, captures] = await Promise.all([
      getAudit(auditId),
      listCaptures(auditId),
    ]);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const byPillar = new Map<string, CaptureSummary[]>();
  for (const c of captures) {
    const list = byPillar.get(c.pillar) ?? [];
    list.push(c);
    byPillar.set(c.pillar, list);
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <Link
          href="/audits"
          className="text-xs text-zinc-500 hover:text-zinc-700"
        >
          ← Audits
        </Link>
        <div className="mt-2 flex items-end justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {audit.site_domain}
            </h1>
            <div className="mt-1 font-mono text-xs text-zinc-500">
              {audit.audit_id}
            </div>
          </div>
          <span
            className={`inline-flex items-center rounded px-2.5 py-1 text-xs font-medium ${auditStatusClasses(audit.status)}`}
          >
            {audit.status}
          </span>
        </div>
      </div>

      {/* Top-level stats grid */}
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Started" value={formatTimestamp(audit.started_at)} />
        <Stat
          label="Duration"
          value={formatDuration(audit.started_at, audit.completed_at)}
        />
        <Stat label="Total cost" value={formatGbp(audit.total_cost_gbp)} mono />
        <Stat
          label="Taxonomy"
          value={audit.taxonomy_version}
          mono
        />
      </dl>

      {/* Outcome counts. Unmeasurable is split into genuine vs deferred-by-choice
          (e.g. a paid source not activated) so the headline isn't misread. */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-medium text-zinc-700">Outcomes</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          <OutcomeCount
            label="Attempted"
            count={audit.variables_attempted}
            classes="bg-zinc-50 text-zinc-700"
          />
          <OutcomeCount
            label="Passed"
            count={audit.variables_passed}
            classes="bg-emerald-50 text-emerald-900"
          />
          <OutcomeCount
            label="Failed"
            count={audit.variables_failed}
            classes="bg-rose-50 text-rose-900"
          />
          <OutcomeCount
            label="Partial"
            count={audit.variables_partial}
            classes="bg-amber-50 text-amber-900"
          />
          <OutcomeCount
            label="Error"
            count={audit.variables_errored}
            classes="bg-red-100 text-red-900"
          />
          <OutcomeCount
            label="Unmeasurable"
            count={Math.max(0, audit.variables_unmeasurable - (audit.variables_deferred ?? 0))}
            classes="bg-zinc-100 text-zinc-700"
          />
          <OutcomeCount
            label="Deferred"
            count={audit.variables_deferred ?? 0}
            classes="bg-sky-50 text-sky-900"
          />
          <OutcomeCount
            label="Not applicable"
            count={audit.variables_not_applicable ?? 0}
            classes="bg-indigo-50 text-indigo-900"
          />
        </div>
      </div>

      {/* Fix plan CTA — the bridge from diagnosis to remediation */}
      <Link
        href={`/audits/${audit.audit_id}/plan`}
        className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-5 hover:border-emerald-300 hover:bg-emerald-100"
      >
        <div>
          <div className="text-sm font-medium text-emerald-900">
            View fix plan →
          </div>
          <div className="mt-0.5 text-xs text-emerald-800">
            How to fix every failed / partial finding, grouped by who can action it.
          </div>
        </div>
        <span className="font-mono text-2xl text-emerald-900">
          {audit.variables_failed + audit.variables_partial}
        </span>
      </Link>

      {/* Strategy CTA — positioning + the fixes sequenced into waves */}
      <Link
        href={`/audits/${audit.audit_id}/strategy`}
        className="flex items-center justify-between rounded-lg border border-sky-200 bg-sky-50 p-5 hover:border-sky-300 hover:bg-sky-100"
      >
        <div>
          <div className="text-sm font-medium text-sky-900">View strategy →</div>
          <div className="mt-0.5 text-xs text-sky-800">
            Where the site stands by pillar, and the fixes sequenced into waves
            (plus keyword targeting).
          </div>
        </div>
      </Link>

      {/* Anomalies + consistency violations (reliability gates) */}
      {(audit.anomalies.length > 0 || audit.consistency_violations.length > 0) && (
        <section className="rounded-lg border border-amber-300 bg-amber-50 p-5">
          <h2 className="text-sm font-medium text-amber-900">
            Reliability gate flags
          </h2>
          <p className="mt-1 text-xs text-amber-800">
            Detected at audit close by the completeness checks and cross-extractor
            consistency rules. Treat as inspection prompts, not extractor errors.
          </p>
          {audit.anomalies.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-medium uppercase tracking-wide text-amber-900">
                Completeness anomalies ({audit.anomalies.length})
              </div>
              <ul className="mt-2 space-y-2">
                {audit.anomalies.map((a, i) => (
                  <AnomalyRow key={`anom-${i}`} a={a} />
                ))}
              </ul>
            </div>
          )}
          {audit.consistency_violations.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-medium uppercase tracking-wide text-amber-900">
                Consistency violations ({audit.consistency_violations.length})
              </div>
              <ul className="mt-2 space-y-2">
                {audit.consistency_violations.map((v, i) => (
                  <AnomalyRow key={`vio-${i}`} a={v} />
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Per-pillar breakdown */}
      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-100 p-5">
          <h2 className="text-sm font-medium text-zinc-700">
            Captures by pillar
          </h2>
          <span className="text-xs text-zinc-500">{captures.length} total</span>
        </div>
        <div className="divide-y divide-zinc-100">
          {PILLARS.map((p) => {
            const items = byPillar.get(p.id) ?? [];
            return (
              <PillarRow
                key={p.id}
                pillarId={p.id}
                pillarName={p.name}
                captures={items}
                auditId={audit.audit_id}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AnomalyRow({ a }: { a: AuditAnomaly }) {
  const { check, severity, explanation, ...rest } = a;
  const sevClasses =
    severity === "critical"
      ? "bg-rose-100 text-rose-900 ring-1 ring-rose-200"
      : "bg-amber-100 text-amber-900 ring-1 ring-amber-200";
  return (
    <li className="rounded border border-amber-200 bg-white p-3">
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-zinc-700">{check}</span>
        <span
          className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${sevClasses}`}
        >
          {severity}
        </span>
      </div>
      {typeof explanation === "string" && (
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-700">
          {explanation}
        </p>
      )}
      {Object.keys(rest).length > 0 && (
        <details className="mt-1.5">
          <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-700">
            Evidence
          </summary>
          <pre className="mt-1.5 overflow-x-auto rounded bg-zinc-50 p-2 text-[10px] text-zinc-700">
            {JSON.stringify(rest, null, 2)}
          </pre>
        </details>
      )}
    </li>
  );
}

function Stat({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </dt>
      <dd
        className={`mt-1 text-sm text-zinc-900 ${mono ? "font-mono" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

function OutcomeCount({
  label,
  count,
  classes,
}: {
  label: string;
  count: number;
  classes: string;
}) {
  return (
    <div className={`rounded p-3 ${classes}`}>
      <div className="text-xs font-medium opacity-70">{label}</div>
      <div className="mt-0.5 font-mono text-xl">{count}</div>
    </div>
  );
}

function PillarRow({
  pillarId,
  pillarName,
  captures,
  auditId,
}: {
  pillarId: string;
  pillarName: string;
  captures: CaptureSummary[];
  auditId: string;
}) {
  const counts = {
    passed: captures.filter((c) => c.status === "passed").length,
    failed: captures.filter((c) => c.status === "failed").length,
    partial: captures.filter((c) => c.status === "partial").length,
    error: captures.filter((c) => c.status === "error").length,
    unmeasurable: captures.filter((c) => c.status === "unmeasurable").length,
  };

  return (
    <div className="p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs text-zinc-400">{pillarId}</span>
          <span className="ml-2 font-medium text-zinc-900">{pillarName}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {captures.length === 0 ? (
            <span className="text-zinc-400">no captures</span>
          ) : (
            <>
              {counts.passed > 0 && (
                <span className="font-mono text-emerald-700">
                  {counts.passed} passed
                </span>
              )}
              {counts.failed > 0 && (
                <span className="font-mono text-rose-700">
                  {counts.failed} failed
                </span>
              )}
              {counts.partial > 0 && (
                <span className="font-mono text-amber-700">
                  {counts.partial} partial
                </span>
              )}
              {counts.error > 0 && (
                <span className="font-mono text-red-800">
                  {counts.error} error
                </span>
              )}
              {counts.unmeasurable > 0 && (
                <span className="font-mono text-zinc-500">
                  {counts.unmeasurable} unmeasurable
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {captures.length > 0 && (
        <ul className="mt-3 grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
          {captures.map((c) => (
            <li key={c.capture_id}>
              <Link
                href={`/audits/${auditId}/captures/${c.variable_id}`}
                className="flex items-center gap-2 rounded border border-zinc-200 bg-white px-2.5 py-1.5 text-xs hover:border-zinc-300 hover:bg-zinc-50"
              >
                <span className="shrink-0 font-mono text-zinc-500">
                  {c.variable_id}
                </span>
                {c.variable_name && (
                  <span className="truncate font-medium text-zinc-800" title={c.variable_name}>
                    {c.variable_name}
                  </span>
                )}
                <span
                  className={`ml-auto inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${captureStatusClasses(c.status)}`}
                >
                  {c.status}
                </span>
                <span
                  className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${evidenceWeightClasses(c.evidence_weight)}`}
                >
                  {c.evidence_weight}
                </span>
                {c.rules_total > 0 && (
                  <span className="shrink-0 font-mono text-[10px] text-zinc-500">
                    {c.rules_passed}/{c.rules_total} rules
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
