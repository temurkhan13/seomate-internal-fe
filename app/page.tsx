import Link from "next/link";

import { PillarBars, scoreTone } from "@/app/components/PillarBars";
import { getProjects, type Project } from "@/lib/api";
import { formatDate } from "@/lib/format";

// Projects are derived live from stored audits + analyses , never cache.
export const dynamic = "force-dynamic";

export default async function Home() {
  let projects: Project[] = [];
  let error: string | null = null;
  try {
    projects = await getProjects();
  } catch (e) {
    error = String(e);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-600">
          Every site the platform is working on. Each card shows the latest audit
          health, what has been run, and when it last changed. Open a project to
          dig into its audit, strategy, and competitive intelligence.
        </p>
      </div>

      {error && (
        <div className="rounded border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">
          Could not load projects: {error}
        </div>
      )}

      {projects.length === 0 && !error ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center text-sm text-zinc-500">
          No projects yet. Run an audit or a competitive analysis and the site
          will appear here as a project.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.domain} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ p }: { p: Project }) {
  const a = p.latest_audit;
  return (
    <Link
      href={`/project/${encodeURIComponent(p.domain)}`}
      className="group flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-400"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-medium text-zinc-900">{p.name}</div>
          <div className="truncate font-mono text-xs text-zinc-500">{p.domain}</div>
        </div>
        {a && (
          <div className="shrink-0 text-right">
            <div className={`text-2xl font-semibold leading-none ${scoreTone(a.overall_pct)}`}>
              {a.overall_pct == null ? "-" : `${a.overall_pct}%`}
            </div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
              audit health
            </div>
          </div>
        )}
      </div>

      {a ? (
        <PillarBars pillars={a.pillars} />
      ) : (
        <div className="text-xs text-zinc-400">No audit yet</div>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-zinc-100 pt-3 text-[11px] text-zinc-500">
        <span>
          <span className="font-mono text-zinc-700">{p.audit_count}</span> audits
        </span>
        <span>
          <span className="font-mono text-zinc-700">{p.competitive_count}</span> competitive
        </span>
        <span>
          <span className="font-mono text-zinc-700">{p.strategy_count}</span> strategy
        </span>
        {p.last_activity && (
          <span className="ml-auto text-zinc-400">{formatDate(p.last_activity)}</span>
        )}
      </div>
    </Link>
  );
}
