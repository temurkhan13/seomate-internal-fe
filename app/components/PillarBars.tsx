import type { ProjectPillar } from "@/lib/api";

export function scoreTone(pct: number | null | undefined): string {
  if (pct == null) return "text-zinc-400";
  if (pct >= 70) return "text-emerald-600";
  if (pct >= 40) return "text-amber-600";
  return "text-rose-600";
}

function barColor(pct: number | null): string {
  if (pct == null) return "bg-zinc-200";
  if (pct >= 70) return "bg-emerald-400";
  if (pct >= 40) return "bg-amber-400";
  return "bg-rose-400";
}

/**
 * The 7-pillar (P0-P6) health sparkline. `withLabels` adds the % under each bar
 * (used in the project header / audit tab); the compact form (cards) shows just
 * the pillar letter.
 */
export function PillarBars({
  pillars,
  height = "h-12",
  withLabels = false,
}: {
  pillars: ProjectPillar[];
  height?: string;
  withLabels?: boolean;
}) {
  return (
    <div className="flex items-end gap-1.5">
      {pillars.map((p) => (
        <div key={p.pillar} className="flex flex-1 flex-col items-center gap-1">
          {withLabels && (
            <div className={`text-[10px] font-medium ${scoreTone(p.health_pct)}`}>
              {p.health_pct == null ? "-" : `${p.health_pct}%`}
            </div>
          )}
          <div
            className={`flex ${height} w-full items-end overflow-hidden rounded-sm bg-zinc-100`}
            title={`${p.pillar} ${p.label}: ${
              p.health_pct == null ? "not measured" : `${p.health_pct}%`
            }`}
          >
            <div
              className={`w-full ${barColor(p.health_pct)}`}
              style={{ height: `${p.health_pct ?? 4}%` }}
            />
          </div>
          <div className="text-[9px] font-medium text-zinc-400">{p.pillar}</div>
        </div>
      ))}
    </div>
  );
}
