import Link from "next/link";

import {
  ApiError,
  listAudits,
  type AuditSummary,
} from "@/lib/api";
import {
  auditStatusClasses,
  formatDuration,
  formatGbp,
  formatTimestamp,
} from "@/lib/format";

export default async function AuditsPage() {
  let audits: AuditSummary[] = [];
  let error: string | null = null;

  try {
    audits = await listAudits({ limit: 100 });
  } catch (e) {
    error =
      e instanceof ApiError
        ? `${e.message}\n${e.body}`
        : (e as Error).message;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audits</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Captures persisted by the SEOMATE auditor, most recent first.
          </p>
        </div>
        <span className="font-mono text-xs text-zinc-400">
          {audits.length} {audits.length === 1 ? "audit" : "audits"}
        </span>
      </div>

      {error && (
        <pre className="rounded border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900 whitespace-pre-wrap">
          {error}
        </pre>
      )}

      {audits.length === 0 && !error && (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
          No audits yet. Run{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs">
            seomate audit --config=configs/pixelette.yml
          </code>{" "}
          to create one.
        </div>
      )}

      {audits.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Site</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Started</th>
                <th className="px-4 py-3 text-left font-medium">Duration</th>
                <th className="px-4 py-3 text-right font-medium">Cost</th>
                <th className="px-4 py-3 text-right font-medium">Captures</th>
                <th className="px-4 py-3 text-left font-medium">Outcomes</th>
              </tr>
            </thead>
            <tbody>
              {audits.map((a) => (
                <tr
                  key={a.audit_id}
                  className="border-t border-zinc-100 hover:bg-zinc-50/60"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/audits/${a.audit_id}`}
                      className="font-medium text-zinc-900 hover:underline"
                    >
                      {a.site_domain}
                    </Link>
                    <div className="font-mono text-xs text-zinc-400">
                      {a.audit_id.slice(0, 8)}…
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${auditStatusClasses(a.status)}`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {formatTimestamp(a.started_at)}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {formatDuration(a.started_at, a.completed_at)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-700">
                    {formatGbp(a.total_cost_gbp)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-700">
                    {a.variables_attempted}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <Outcomes audit={a} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Outcomes({ audit }: { audit: AuditSummary }) {
  const items = [
    { label: "passed", count: audit.variables_passed, classes: "text-emerald-700" },
    { label: "failed", count: audit.variables_failed, classes: "text-rose-700" },
    { label: "partial", count: audit.variables_partial, classes: "text-amber-700" },
    { label: "error", count: audit.variables_errored, classes: "text-red-800" },
    { label: "unmeasurable", count: audit.variables_unmeasurable, classes: "text-zinc-500" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      {items.map(
        (i) =>
          i.count > 0 && (
            <span key={i.label} className={`font-mono ${i.classes}`}>
              {i.count} {i.label}
            </span>
          ),
      )}
    </div>
  );
}
