import Link from "next/link";
import { notFound } from "next/navigation";

import { CompetitiveReportView } from "@/app/components/CompetitiveReportView";
import { PillarBars, scoreTone } from "@/app/components/PillarBars";
import { Positioning } from "@/app/components/Positioning";
import { SavedRunsList } from "@/app/components/SavedRunsList";
import { StrategyView } from "@/app/components/StrategyView";
import { bandColor, TrendChart } from "@/app/components/TrendChart";
import {
  getAuditStrategy,
  getProjects,
  getProjectTrend,
  getSavedAnalyses,
  getSavedAnalysis,
  getSiteStrategy,
  type CompetitiveReport,
  type Project,
  type SavedAnalysisSummary,
  type SiteStrategy,
} from "@/lib/api";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "audit", label: "Audit" },
  { key: "strategy", label: "Strategy" },
  { key: "competitive", label: "Competitive" },
  { key: "trends", label: "Trends" },
];

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ domain: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const dom = decodeURIComponent((await params).domain);
  const tab = (await searchParams).tab ?? "overview";

  const projects = await getProjects().catch(() => [] as Project[]);
  const project = projects.find((p) => p.domain === dom) ?? null;
  if (!project) notFound();

  return (
    <div className="flex flex-col gap-6">
      <ProjectHeader project={project} />
      <TabBar domain={dom} active={tab} />
      {tab === "overview" && <OverviewTab project={project} />}
      {tab === "audit" && <AuditTab project={project} />}
      {tab === "strategy" && <StrategyTab domain={dom} />}
      {tab === "competitive" && <CompetitiveTab project={project} />}
      {tab === "trends" && <TrendsTab domain={dom} />}
    </div>
  );
}

function ProjectHeader({ project }: { project: Project }) {
  const a = project.latest_audit;
  return (
    <div>
      <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-700">
        ← Projects
      </Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          <div className="font-mono text-xs text-zinc-500">{project.domain}</div>
        </div>
        {a && (
          <div className="flex items-end gap-6">
            <div className="text-right">
              <div className={`text-3xl font-semibold leading-none ${scoreTone(a.overall_pct)}`}>
                {a.overall_pct == null ? "-" : `${a.overall_pct}%`}
              </div>
              <div className="mt-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
                audit health
              </div>
            </div>
            <div className="w-72">
              <PillarBars pillars={a.pillars} height="h-10" withLabels />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TabBar({ domain, active }: { domain: string; active: string }) {
  const base = `/project/${encodeURIComponent(domain)}`;
  return (
    <nav className="flex gap-1 border-b border-zinc-200 text-sm">
      {TABS.map((t) => {
        const on = active === t.key;
        return (
          <Link
            key={t.key}
            href={t.key === "overview" ? base : `${base}?tab=${t.key}`}
            className={`-mb-px border-b-2 px-4 py-2 font-medium transition-colors ${
              on
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center text-sm text-zinc-500">
      {msg}
    </div>
  );
}

// ─── Overview ───────────────────────────────────────────────────────────────
async function OverviewTab({ project }: { project: Project }) {
  let headline: string | null = null;
  if (project.latest_competitive) {
    try {
      const detail = await getSavedAnalysis(project.latest_competitive.analysis_id);
      headline = (detail.payload as CompetitiveReport)?.analysis?.headline ?? null;
    } catch {
      headline = null;
    }
  }
  const a = project.latest_audit;
  const dom = encodeURIComponent(project.domain);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-800">Where it stands</h2>
          <Link href={`/project/${dom}?tab=audit`} className="text-xs text-zinc-500 hover:text-zinc-700">
            audit →
          </Link>
        </div>
        {a ? (
          <div className="mt-3">
            <PillarBars pillars={a.pillars} height="h-14" withLabels />
            <p className="mt-3 text-xs text-zinc-500">
              {a.variables_attempted} variables measured · overall health{" "}
              <span className={scoreTone(a.overall_pct)}>
                {a.overall_pct == null ? "-" : `${a.overall_pct}%`}
              </span>
            </p>
          </div>
        ) : (
          <p className="mt-3 text-xs text-zinc-400">No audit yet.</p>
        )}
      </section>

      <section className="rounded-lg border border-indigo-200 bg-indigo-50 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-indigo-900">Strategist read</h2>
          <Link href={`/project/${dom}?tab=competitive`} className="text-xs text-indigo-600 hover:text-indigo-800">
            competitive →
          </Link>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-indigo-950">
          {headline
            ? headline
            : project.latest_competitive
              ? "The latest competitive run has the full data, but no strategist read is attached to it yet. Open the Competitive tab for the numbers."
              : "No competitive analysis run yet , run one to get the read."}
        </p>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 lg:col-span-2">
        <h2 className="text-sm font-medium text-zinc-800">What has been done</h2>
        <div className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded border border-zinc-100 bg-zinc-100 text-center">
          <Stat label="Audits" value={project.audit_count} />
          <Stat label="Competitive runs" value={project.competitive_count} />
          <Stat label="Strategy snapshots" value={project.strategy_count} />
        </div>
        {project.last_activity && (
          <p className="mt-3 text-xs text-zinc-400">
            Last activity {project.last_activity.slice(0, 16).replace("T", " ")}
          </p>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white p-4">
      <div className="text-xl font-semibold text-zinc-900">{value}</div>
      <div className="mt-0.5 text-[11px] text-zinc-500">{label}</div>
    </div>
  );
}

// ─── Audit (latest) ─────────────────────────────────────────────────────────
async function AuditTab({ project }: { project: Project }) {
  const a = project.latest_audit;
  if (!a) return <Empty msg="No audit has been run for this site yet." />;
  let positioning = null;
  try {
    positioning = (await getAuditStrategy(a.audit_id)).positioning;
  } catch {
    positioning = null;
  }
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-medium text-zinc-800">Latest audit</h2>
            <p className="text-xs text-zinc-500">
              {a.completed_at?.slice(0, 16).replace("T", " ")} · {a.status} ·{" "}
              {a.variables_attempted} variables
            </p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-semibold leading-none ${scoreTone(a.overall_pct)}`}>
              {a.overall_pct == null ? "-" : `${a.overall_pct}%`}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-zinc-400">health</div>
          </div>
        </div>
        <div className="mt-4">
          <PillarBars pillars={a.pillars} height="h-16" withLabels />
        </div>
        <div className="mt-4 flex gap-3">
          <Link
            href={`/audits/${a.audit_id}`}
            className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Open full audit
          </Link>
          <Link
            href={`/audits/${a.audit_id}/plan`}
            className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Fix plan
          </Link>
        </div>
      </section>
      {positioning && <Positioning positioning={positioning} />}
      <Link href="/audits" className="text-xs text-zinc-500 hover:text-zinc-700">
        View all {project.audit_count} audits for this and other sites →
      </Link>
    </div>
  );
}

// ─── Strategy (latest) ──────────────────────────────────────────────────────
async function StrategyTab({ domain }: { domain: string }) {
  let strategy: SiteStrategy | null = null;
  try {
    strategy = await getSiteStrategy(domain);
  } catch {
    strategy = null;
  }
  if (!strategy || !strategy.has_audit) {
    return <Empty msg="Strategy needs an audit first. Run one, then come back." />;
  }
  const dom = encodeURIComponent(domain);
  return (
    <StrategyView strategy={strategy}>
      <Link
        href={`/strategy?target=${dom}&compete=1`}
        className="block rounded-lg border border-sky-200 bg-sky-50 p-5 text-sm font-medium text-sky-900 hover:bg-sky-100"
      >
        Run a fresh strategy snapshot (audit + competitive) →
      </Link>
    </StrategyView>
  );
}

// ─── Competitive (latest) ───────────────────────────────────────────────────
async function CompetitiveTab({ project }: { project: Project }) {
  let history: SavedAnalysisSummary[] = [];
  try {
    history = await getSavedAnalyses("competitive", project.domain);
  } catch {
    history = [];
  }

  let report: CompetitiveReport | null = null;
  if (project.latest_competitive) {
    try {
      const detail = await getSavedAnalysis(project.latest_competitive.analysis_id);
      report = detail.payload as CompetitiveReport;
    } catch {
      report = null;
    }
  }

  const dom = encodeURIComponent(project.domain);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {report
            ? `Latest competitive analysis · ${project.latest_competitive?.created_at?.slice(0, 10)}`
            : "No competitive analysis yet."}
        </p>
        <Link
          href={`/competitive?target=${dom}`}
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Run new analysis
        </Link>
      </div>
      {report ? (
        <CompetitiveReportView report={report} />
      ) : (
        <Empty msg="Run a competitive analysis (name your focus keywords, e.g. AI and blockchain) and the latest will show here." />
      )}
      {history.length > 1 && (
        <SavedRunsList kind="competitive" items={history} title="Past competitive runs" />
      )}
    </div>
  );
}

// ─── Trends (improvement over time) ─────────────────────────────────────────
async function TrendsTab({ domain }: { domain: string }) {
  let trend = null;
  try {
    trend = await getProjectTrend(domain);
  } catch {
    trend = null;
  }
  if (!trend || trend.audit_trend.length === 0) {
    return (
      <Empty msg="No audit history yet. The trajectory appears once there is more than one audit to compare." />
    );
  }
  const at = trend.audit_trend;
  const overall = at.map((p) => ({ label: p.at, value: p.overall_pct }));
  const first = at[0].overall_pct;
  const last = at[at.length - 1].overall_pct;
  const delta = first != null && last != null ? last - first : null;
  const pillars = Object.keys(trend.pillar_labels).sort();
  const ct = trend.competitive_trend;

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-medium text-zinc-800">Audit health over time</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              {at.length} {at.length === 1 ? "audit" : "audits"} from {at[0].at} to{" "}
              {at[at.length - 1].at}. One point per day.
            </p>
          </div>
          {delta != null && (
            <span
              className={`rounded px-2 py-1 text-xs font-medium ${
                delta > 0
                  ? "bg-emerald-50 text-emerald-800"
                  : delta < 0
                    ? "bg-rose-50 text-rose-800"
                    : "bg-zinc-100 text-zinc-600"
              }`}
            >
              {delta > 0 ? "+" : ""}
              {delta}% overall since first audit
            </span>
          )}
        </div>
        <div className="mt-3">
          <TrendChart points={overall} domainMax={100} unit="%" vbHeight={90} color="#6366f1" />
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-medium text-zinc-800">Pillar trajectories</h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          Each pillar&apos;s health across the same audits. Line colour reflects the
          latest band.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
          {pillars.map((p) => {
            const series = at.map((a) => ({ label: a.at, value: a.pillars[p] ?? null }));
            const latest = [...series].reverse().find((s) => s.value != null)?.value ?? null;
            return (
              <div key={p}>
                <div className="flex items-baseline justify-between text-xs">
                  <span>
                    <span className="font-mono text-zinc-400">{p}</span>{" "}
                    <span className="text-zinc-700">{trend.pillar_labels[p]}</span>
                  </span>
                  <span className={scoreTone(latest)}>
                    {latest == null ? "-" : `${latest}%`}
                  </span>
                </div>
                <TrendChart
                  points={series}
                  domainMax={100}
                  unit="%"
                  vbHeight={48}
                  color={bandColor(latest)}
                />
              </div>
            );
          })}
        </div>
      </section>

      {ct.length > 0 && (
        <section className="rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-medium text-zinc-800">Search footprint over time</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            The site&apos;s own organic visibility across competitive runs (one point
            per day).
          </p>
          <div className="mt-3 grid gap-6 sm:grid-cols-2">
            <div>
              <div className="text-xs text-zinc-500">Organic keywords</div>
              <TrendChart
                points={ct.map((c) => ({ label: c.at, value: c.organic_keywords }))}
                vbHeight={70}
                color="#0ea5e9"
              />
            </div>
            <div>
              <div className="text-xs text-zinc-500">Est. monthly traffic</div>
              <TrendChart
                points={ct.map((c) => ({ label: c.at, value: c.organic_traffic }))}
                vbHeight={70}
                color="#0ea5e9"
              />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
