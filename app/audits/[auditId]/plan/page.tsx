import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError, getAuditPlan, type FixClass, type WorkOrder } from "@/lib/api";

// Display order = remediation priority (do-it-yourself first, spend/offsite last).
const FIX_CLASS_ORDER: FixClass[] = ["session", "human", "owner", "budget", "offsite"];

const FIX_CLASS_META: Record<
  FixClass,
  { label: string; blurb: string; classes: string }
> = {
  session: {
    label: "Session",
    blurb: "A Claude session can do these end-to-end with repo / CMS access (it drafts, you approve the PR).",
    classes: "bg-emerald-50 text-emerald-900 border-emerald-200",
  },
  human: {
    label: "Human",
    blurb: "Needs a person: editorial, design, or ops judgment.",
    classes: "bg-amber-50 text-amber-900 border-amber-200",
  },
  owner: {
    label: "Owner access",
    blurb: "Needs an account owner's access (e.g. Google Business Profile).",
    classes: "bg-sky-50 text-sky-900 border-sky-200",
  },
  budget: {
    label: "Budget",
    blurb: "Needs spend: a subscription or paid placement.",
    classes: "bg-violet-50 text-violet-900 border-violet-200",
  },
  offsite: {
    label: "Off-site",
    blurb: "Off the site: PR, outreach, third-party platforms.",
    classes: "bg-zinc-50 text-zinc-700 border-zinc-200",
  },
};

type Params = { auditId: string };

export default async function FixPlanPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { auditId } = await params;

  let plan;
  try {
    plan = await getAuditPlan(auditId);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const byClass = new Map<FixClass, WorkOrder[]>();
  for (const w of plan.work_orders) {
    const fc = w.remediation.fix_class;
    const list = byClass.get(fc) ?? [];
    list.push(w);
    byClass.set(fc, list);
  }
  const autoCount = plan.session_automatable.length;

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
            <h1 className="text-2xl font-semibold tracking-tight">Fix plan</h1>
            <div className="mt-1 text-sm text-zinc-500">{plan.site_domain}</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-3xl text-zinc-900">
              {plan.actionable_findings}
            </div>
            <div className="text-xs text-zinc-500">things to fix</div>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
          Every failed or partial finding from the audit, joined with how to fix
          it and who can action it. {autoCount} are auto-generatable by a session
          right now; the rest are routed to the person or resource that can do
          them.
        </p>
      </div>

      {!plan.is_latest_audit && (
        <div className="rounded border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          This is not the latest audit for {plan.site_domain}. The live site may
          have changed; re-plan against the latest audit before shipping fixes.
        </div>
      )}

      {/* fix-class summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {FIX_CLASS_ORDER.map((fc) => (
          <div key={fc} className={`rounded border p-3 ${FIX_CLASS_META[fc].classes}`}>
            <div className="text-xs font-medium opacity-70">
              {FIX_CLASS_META[fc].label}
            </div>
            <div className="mt-0.5 font-mono text-xl">
              {plan.by_fix_class[fc] ?? 0}
            </div>
          </div>
        ))}
      </div>

      {/* grouped work orders */}
      {FIX_CLASS_ORDER.map((fc) => {
        const items = byClass.get(fc) ?? [];
        if (items.length === 0) return null;
        const meta = FIX_CLASS_META[fc];
        return (
          <section key={fc} className="rounded-lg border border-zinc-200 bg-white">
            <div className="border-b border-zinc-100 p-5">
              <h2 className="text-sm font-medium text-zinc-800">
                {meta.label}{" "}
                <span className="text-zinc-400">({items.length})</span>
              </h2>
              <p className="mt-1 text-xs text-zinc-500">{meta.blurb}</p>
            </div>
            <ul className="divide-y divide-zinc-100">
              {items.map((w) => (
                <WorkOrderRow key={w.variable_id} w={w} auditId={auditId} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function WorkOrderRow({ w, auditId }: { w: WorkOrder; auditId: string }) {
  const r = w.remediation;
  return (
    <li className="p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/audits/${auditId}/captures/${w.variable_id}`}
          className="font-mono text-xs text-zinc-600 hover:text-zinc-900 hover:underline"
        >
          {w.variable_id}
        </Link>
        <span className="font-mono text-[10px] text-zinc-400">{w.pillar}</span>
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
            w.diagnostic_status === "failed"
              ? "bg-rose-50 text-rose-800"
              : "bg-amber-50 text-amber-800"
          }`}
        >
          {w.diagnostic_status}
        </span>
        {r.automatable && (
          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-900">
            auto-generatable
          </span>
        )}
        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600">
          {r.fix_type}
        </span>
        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600">
          risk: {r.risk}
        </span>
        {!w.has_authored_spec && (
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500">
            generic spec
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-zinc-900">{r.concrete_change}</p>
      <dl className="mt-2 grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-2">
        <Field label="Where" value={r.target} />
        <Field label="Verify" value={r.verify} />
        {r.required_inputs.length > 0 && (
          <Field label="Needs" value={r.required_inputs.join(", ")} />
        )}
        {w.failing_rules.length > 0 && (
          <Field label="Failing rules" value={w.failing_rules.join("; ")} />
        )}
      </dl>
      {r.notes && (
        <p className="mt-1.5 text-xs italic text-zinc-500">{r.notes}</p>
      )}
    </li>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="font-medium text-zinc-500">{label}: </span>
      <span className="text-zinc-700">{value}</span>
    </div>
  );
}
