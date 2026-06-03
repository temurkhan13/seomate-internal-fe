"use client";

import { useState } from "react";

import type { PillarHealth } from "@/lib/api";

function barColor(pct: number | null): string {
  if (pct === null) return "bg-zinc-300";
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

export function Positioning({ positioning }: { positioning: PillarHealth[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 p-5">
        <h2 className="text-sm font-medium text-zinc-800">
          Where the site stands
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Pillar health from the latest audit (passed over graded). Click a
          pillar to see why it scores that, and how each finding gets fixed.
        </p>
      </div>
      <div className="divide-y divide-zinc-100">
        {positioning.map((p) => {
          const isOpen = open === p.pillar;
          const n = p.findings?.length ?? 0;
          const graded = p.passed + p.failed + p.partial;
          return (
            <div key={p.pillar}>
              <button
                type="button"
                onClick={() => n > 0 && setOpen(isOpen ? null : p.pillar)}
                className={`flex w-full items-center gap-4 p-4 text-left ${
                  n > 0 ? "hover:bg-zinc-50" : "cursor-default"
                }`}
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
                    className={`h-full ${barColor(p.health_pct)}`}
                    style={{ width: `${p.health_pct ?? 0}%` }}
                  />
                </div>
                <div className="w-12 shrink-0 text-right font-mono text-xs text-zinc-600">
                  {p.health_pct === null ? "n/a" : `${p.health_pct}%`}
                </div>
                <div className="w-28 shrink-0 text-right font-mono text-[11px] text-zinc-400">
                  {p.passed} pass / {p.failed} fail
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
