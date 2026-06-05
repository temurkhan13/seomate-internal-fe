"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "audit", label: "Audit" },
  { key: "strategy", label: "Strategy" },
  { key: "competitive", label: "Competitive" },
  { key: "trends", label: "Trends" },
];

/**
 * Workspace tab bar with instant pending feedback. Clicking a tab is a server
 * navigation (the tab content is server-rendered), which can take a couple of
 * seconds; without feedback that reads as "frozen". This shows a spinner on the
 * tab being loaded the moment it is clicked, so the switch always feels alive.
 */
export function ProjectTabs({ domain, active }: { domain: string; active: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [target, setTarget] = useState<string | null>(null);
  const base = `/project/${encodeURIComponent(domain)}`;

  const go = (key: string) => {
    if (key === active) return;
    setTarget(key);
    startTransition(() => {
      router.push(key === "overview" ? base : `${base}?tab=${key}`);
    });
  };

  return (
    <nav className="flex gap-1 border-b border-zinc-200 text-sm">
      {TABS.map((t) => {
        const on = active === t.key;
        const loading = isPending && target === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => go(t.key)}
            aria-current={on ? "page" : undefined}
            className={`-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2 font-medium transition-colors ${
              on
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {t.label}
            {loading && (
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
