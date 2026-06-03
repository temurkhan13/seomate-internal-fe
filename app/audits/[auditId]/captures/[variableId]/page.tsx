import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ApiError,
  getAuditPlan,
  getCapture,
  getVariable,
  type CaptureDetail,
  type RemediationSpec,
  type Variable,
} from "@/lib/api";
import {
  captureStatusClasses,
  evidenceWeightClasses,
  formatGbp,
  formatTimestamp,
} from "@/lib/format";

type Params = { auditId: string; variableId: string };

export default async function CaptureDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { auditId, variableId } = await params;

  let capture: CaptureDetail;
  let variable: Variable | null = null;
  try {
    capture = await getCapture(auditId, variableId);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  // Variable definition is best-effort; if the taxonomy lookup fails
  // (taxonomy file missing, e.g.) we still render the capture itself.
  try {
    variable = await getVariable(variableId);
  } catch {
    variable = null;
  }

  // How-to-fix , best-effort: pull this variable's remediation from the audit's
  // fix plan (present for failed/partial findings; passed captures need no fix).
  let fix: RemediationSpec | null = null;
  try {
    const plan = await getAuditPlan(auditId);
    fix =
      plan.work_orders.find((w) => w.variable_id === variableId)?.remediation ??
      null;
  } catch {
    fix = null;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumbs */}
      <div className="text-xs text-zinc-500">
        <Link href="/audits" className="hover:text-zinc-700">
          Audits
        </Link>
        <span className="mx-1.5 text-zinc-300">/</span>
        <Link
          href={`/audits/${auditId}`}
          className="hover:text-zinc-700"
        >
          {auditId.slice(0, 8)}…
        </Link>
        <span className="mx-1.5 text-zinc-300">/</span>
        <span className="font-mono text-zinc-700">{variableId}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-zinc-500">
              {capture.variable_id}
            </span>
            <span className="font-mono text-xs text-zinc-400">
              {capture.pillar}
            </span>
          </div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">
            {variable?.name ?? capture.variable_id}
          </h1>
          {variable?.definition && (
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-600">
              {variable.definition}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span
            className={`inline-flex items-center rounded px-2.5 py-1 text-xs font-medium ${captureStatusClasses(capture.status)}`}
          >
            {capture.status}
          </span>
          <span
            className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${evidenceWeightClasses(capture.evidence_weight)}`}
          >
            {capture.evidence_weight}
          </span>
        </div>
      </div>

      {/* Metadata strip */}
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Subject" value={`${capture.subject_type}: ${capture.subject_id}`} />
        <Stat label="Captured" value={formatTimestamp(capture.captured_at)} />
        <Stat label="Cost" value={formatGbp(capture.cost_incurred_gbp)} mono />
        <Stat
          label="Staleness"
          value={
            capture.staleness_seconds === null
              ? "real-time"
              : `${capture.staleness_seconds}s`
          }
          mono
        />
      </dl>

      {/* Rules */}
      {capture.rules && capture.rules.length > 0 && (
        <section className="rounded-lg border border-zinc-200 bg-white">
          <header className="border-b border-zinc-100 p-5">
            <h2 className="text-sm font-medium text-zinc-700">
              Step 1.5 evaluation rules
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              {capture.rules.filter((r) => r.passed).length} of{" "}
              {capture.rules.length} rules passed.
            </p>
          </header>
          <ul className="divide-y divide-zinc-100">
            {capture.rules.map((rule) => (
              <li key={rule.rule_id} className="p-5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 font-mono text-xs text-zinc-400">
                    #{rule.rule_id}
                  </span>
                  <span
                    className={`inline-flex shrink-0 items-center rounded px-2 py-0.5 text-xs font-medium ${rule.passed ? "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200" : "bg-rose-100 text-rose-900 ring-1 ring-rose-200"}`}
                  >
                    {rule.passed ? "passed" : "failed"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-zinc-900">{rule.rule_text}</div>
                    {rule.notes && (
                      <div className="mt-1 text-xs text-zinc-500">
                        {rule.notes}
                      </div>
                    )}
                    {Object.keys(rule.evidence ?? {}).length > 0 && (
                      <details className="mt-2" open={!rule.passed}>
                        <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-700">
                          Evidence
                        </summary>
                        <pre className="mt-2 overflow-x-auto rounded bg-zinc-50 p-3 text-xs text-zinc-700">
                          {JSON.stringify(rule.evidence, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* How to fix , from the remediation plan */}
      {fix && (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50">
          <header className="border-b border-emerald-100 p-5">
            <h2 className="text-sm font-medium text-emerald-900">How to fix</h2>
            <p className="mt-1 text-xs text-emerald-800">
              From the remediation plan. Who can action it:{" "}
              <span className="font-medium">{fix.fix_class}</span>.
            </p>
          </header>
          <div className="space-y-2 p-5 text-sm text-emerald-900">
            <p>{fix.concrete_change}</p>
            <p className="text-xs text-emerald-800">
              <span className="font-medium">Where: </span>
              {fix.target}
            </p>
            {fix.required_inputs.length > 0 && (
              <p className="text-xs text-emerald-800">
                <span className="font-medium">Needs: </span>
                {fix.required_inputs.join("; ")}
              </p>
            )}
            <p className="text-xs text-emerald-800">
              <span className="font-medium">Verify: </span>
              {fix.verify}
            </p>
          </div>
        </section>
      )}

      {/* Raw value */}
      <section className="rounded-lg border border-zinc-200 bg-white">
        <header className="border-b border-zinc-100 p-5">
          <h2 className="text-sm font-medium text-zinc-700">Captured value</h2>
        </header>
        <div className="p-5">
          {capture.value === null ? (
            <p className="text-sm text-zinc-500">No value (status-only capture).</p>
          ) : (
            <pre className="overflow-x-auto rounded bg-zinc-50 p-4 text-xs text-zinc-700">
              {JSON.stringify(capture.value, null, 2)}
            </pre>
          )}
        </div>
      </section>

      {/* Errors */}
      {capture.errors && capture.errors.length > 0 && (
        <section className="rounded-lg border border-rose-200 bg-rose-50">
          <header className="border-b border-rose-200 p-5">
            <h2 className="text-sm font-medium text-rose-900">
              Errors ({capture.errors.length})
            </h2>
          </header>
          <ul className="divide-y divide-rose-100">
            {capture.errors.map((err, i) => (
              <li key={i} className="p-5">
                <pre className="whitespace-pre-wrap text-xs text-rose-900">
                  {err}
                </pre>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Data sources */}
      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-medium text-zinc-700">Data sources used</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {capture.data_sources_used.map((s) => (
            <li
              key={s}
              className="rounded bg-zinc-100 px-2 py-1 font-mono text-xs text-zinc-700"
            >
              {s}
            </li>
          ))}
          {capture.data_sources_used.length === 0 && (
            <li className="text-xs text-zinc-500">none recorded</li>
          )}
        </ul>
      </section>

      {/* Citations from taxonomy */}
      {variable && variable.citations.length > 0 && (
        <section className="rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-medium text-zinc-700">
            Source citations (from taxonomy)
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-zinc-700">
            {variable.citations.map((c, i) => (
              <li key={i}>
                <span className="font-medium">{c.label}</span>
                {c.url && (
                  <>
                    {" "}
                    <a
                      href={c.url}
                      className="text-indigo-700 underline hover:text-indigo-900"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      ({new URL(c.url).hostname})
                    </a>
                  </>
                )}
                {c.description && (
                  <p className="mt-0.5 text-xs text-zinc-500">{c.description}</p>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
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
        className={`mt-1 text-sm break-words text-zinc-900 ${mono ? "font-mono" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
