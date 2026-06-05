// Dependency-free SVG line chart for trend/history views. Server-rendered
// (static SVG, no client JS). Scales a series of labelled points into a
// responsive line with dots and a labelled latest value; breaks the line on
// null gaps so missing measurements do not draw a false straight line.

export type TrendPoint = { label: string; value: number | null };

export function bandColor(pct: number | null | undefined): string {
  if (pct == null) return "#a1a1aa"; // zinc-400
  if (pct >= 70) return "#10b981"; // emerald-500
  if (pct >= 40) return "#f59e0b"; // amber-500
  return "#f43f5e"; // rose-500
}

export function TrendChart({
  points,
  color = "#6366f1",
  domainMax,
  unit = "",
  vbHeight = 70,
}: {
  points: TrendPoint[];
  color?: string;
  domainMax?: number; // fixed top of scale (e.g. 100 for %); omit to auto-scale
  unit?: string;
  vbHeight?: number;
}) {
  const present = points.filter((p): p is { label: string; value: number } => p.value != null);
  if (present.length === 0) {
    return <div className="py-3 text-[11px] text-zinc-400">no data yet</div>;
  }

  const W = 320;
  const H = vbHeight;
  const padX = 12;
  const padTop = 14;
  const padBot = 10;
  const maxY = domainMax ?? Math.max(...present.map((p) => p.value), 1);
  const minY = 0;
  const n = points.length;

  const X = (i: number) => (n <= 1 ? W / 2 : padX + (i * (W - 2 * padX)) / (n - 1));
  const Y = (v: number) =>
    padTop + (1 - (v - minY) / (maxY - minY || 1)) * (H - padTop - padBot);

  // Build polyline segments, breaking on nulls.
  const segs: string[] = [];
  let run: string[] = [];
  points.forEach((p, i) => {
    if (p.value == null) {
      if (run.length) {
        segs.push(run.join(" "));
        run = [];
      }
    } else {
      run.push(`${X(i).toFixed(1)},${Y(p.value).toFixed(1)}`);
    }
  });
  if (run.length) segs.push(run.join(" "));

  let lastI = -1;
  points.forEach((p, i) => {
    if (p.value != null) lastI = i;
  });
  const lastV = lastI >= 0 ? points[lastI].value! : null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="trend chart">
      <line
        x1={padX}
        y1={H - padBot}
        x2={W - padX}
        y2={H - padBot}
        stroke="#e4e4e7"
        strokeWidth="1"
      />
      {segs.map((s, i) => (
        <polyline
          key={i}
          points={s}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
      {points.map((p, i) =>
        p.value == null ? null : (
          <circle key={i} cx={X(i)} cy={Y(p.value)} r={i === lastI ? 3 : 2} fill={color} />
        ),
      )}
      {lastV != null && (
        <text
          x={W - padX}
          y={Math.max(Y(lastV) - 5, 10)}
          textAnchor="end"
          fontSize="11"
          fontWeight="600"
          fill={color}
        >
          {lastV.toLocaleString()}
          {unit}
        </text>
      )}
    </svg>
  );
}
