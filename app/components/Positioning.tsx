"use client";

import { useMemo, useState } from "react";

import type { PillarHealth } from "@/lib/api";

function barColor(pct: number | null, muted = false): string {
  if (muted || pct === null) return "bg-zinc-300";
  if (pct >= 67) return "bg-emerald-400";
  if (pct >= 34) return "bg-amber-400";
  return "bg-rose-400";
}

function fixClassClasses(fc: string): string {
  switch (fc) {
    case "session":
      return "bg-emerald-100 text-emerald-800";
    case "human":
      return "bg-amber-100 text-amber-800";
    case "owner":
      return "bg-sky-100 text-sky-800";
    case "budget":
      return "bg-violet-100 text-violet-800";
    default:
      return "bg-zinc-100 text-zinc-700"; // offsite
  }
}

function statusClasses(s: string): string {
  return s === "partial"
    ? "bg-amber-100 text-amber-800"
    : "bg-rose-100 text-rose-800";
}

// Objective lens , which pillars to prioritise for a given goal. The deep,
// fully objective-driven playbook is still a session's job; this is a quick focus
// that reorders the pillars (priority ones first) so you see where to act for the
// goal you pick.
const OBJECTIVES: Record<string, { label: string; pillars: string[] }> = {
  organic: { label: "Grow organic traffic", pillars: ["P1", "P4", "P0"] },
  geo: { label: "Win AI search / GEO", pillars: ["P6", "P4", "P0"] },
  technical: { label: "Technical health", pillars: ["P2", "P1"] },
  local: { label: "Local visibility", pillars: ["P5", "P0"] },
};

export function Positioning({ positioning }: { positioning: PillarHealth[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [objective, setObjective] = useState<string>("organic");

  const prio = OBJECTIVES[objective].pillars;
  const ordered = useMemo(() => {
    const rank = (p: string) => {
      const i = prio.indexOf(p);
      return i === -1 ? prio.length + 1 : i;
    };
    return [...positioning].sort((a, b) => rank(a.pillar) - rank(b.pillar));
  }, [positioning, prio]);

  const focus = positioning
    .filter((p) => prio.includes(p.pillar))
    .sort((a, b) => prio.indexOf(a.pillar) - prio.indexOf(b.pillar));

  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-zinc-800">
            Where the site stands
          </h2>
          <label className="flex items-center gap-2 text-xs text-zinc-500">
            Objective
            <select
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-800"
            >
              {Object.entries(OBJECTIVES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          Pillar health from the latest audit (passed over graded). Click a pillar
          to see why it scores that, and how each finding gets fixed.
        </p>
        <p className="mt-2 rounded bg-sky-50 px-2.5 py-1.5 text-xs text-sky-900">
          For <span className="font-medium">{OBJECTIVES[objective].label}</span>,
          prioritise:{" "}
          {focus.map((p, i) => (
            <span key={p.pillar}>
              {i > 0 ? ", " : ""}
              {p.label} ({p.health_pct === null ? "n/a" : `${p.health_pct}%`})
            </span>
          ))}
          . Those pillars are pulled to the top.
        </p>
      </div>
      <div className="divide-y divide-zinc-100">
        {ordered.map((p) => {
          const isOpen = open === p.pillar;
          const n = p.findings?.length ?? 0;
          const graded = p.passed + p.failed + p.partial;
          const mostlyUnmeasured = p.unmeasured > p.graded;
          const isPrio = prio.includes(p.pillar);
          return (
            <div key={p.pillar}>
              <button
                type="button"
                onClick={() => n > 0 && setOpen(isOpen ? null : p.pillar)}
                className={`flex w-full items-center gap-4 p-4 text-left ${
                  n > 0 ? "hover:bg-zinc-50" : "cursor-default"
                } ${isPrio ? "bg-sky-50/40" : ""}`}
              >
                <span className="w-4 shrink-0 text-zinc-400">
                  {n > 0 ? (isOpen ? "▾" : "▸") : ""}
                </span>
                <div className="w-44 shrink-0">
                  <span className="font-mono text-xs text-zinc-400">
                    {p.pillar}
                  </span>
                  <span className="ml-2 text-sm text-zinc-800">{p.label}</span>
                </div>
                <div className="h-2 flex-1 overflow-hidden rounded bg-zinc-100">
                  <div
                    className={`h-full ${barColor(p.health_pct, mostlyUnmeasured)}`}
                    style={{ width: `${p.health_pct ?? 0}%` }}
                  />
                </div>
                <div className="w-12 shrink-0 text-right font-mono text-xs text-zinc-600">
                  {p.health_pct === null ? "n/a" : `${p.health_pct}%`}
                </div>
                <div className="w-40 shrink-0 text-right font-mono text-[11px] text-zinc-400">
                  {p.passed}/{p.graded} pass
                  {p.unmeasured > 0 ? ` · ${p.unmeasured} unmeasured` : ""}
                </div>
              </button>
              {isOpen && n > 0 && (
                <div className="border-t border-zinc-100 bg-zinc-50 px-5 py-4">
                  <p className="mb-3 text-xs text-zinc-500">
                    Why {p.health_pct}%: {p.failed} failed
                    {p.partial ? ` + ${p.partial} partial` : ""} of {graded}{" "}
                    graded. Each finding below is actioned as part of the plan
                    waves.
                  </p>
                  <ul className="space-y-2">
                    {p.findings.map((f) => (
                      <li
                        key={f.variable_id}
                        className="rounded border border-zinc-200 bg-white p-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-zinc-500">
                            {f.variable_id}
                          </span>
                          <span className="text-xs font-medium text-zinc-800">
                            {f.name}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${statusClasses(f.status)}`}
                          >
                            {f.status}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${fixClassClasses(f.fix_class)}`}
                          >
                            {f.fix_class}
                          </span>
                        </div>
                        {f.evidence && (
                          <p className="mt-1.5 text-xs text-zinc-500">
                            <span className="font-medium text-zinc-600">
                              Why:{" "}
                            </span>
                            {f.evidence}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-zinc-700">
                          <span className="font-medium">Fix: </span>
                          {f.concrete_change}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
