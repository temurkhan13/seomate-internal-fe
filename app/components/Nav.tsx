"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Top-level destinations. Audits is the diagnostic; Strategy is the
// domain-driven view that unifies the latest audit with competitive standing +
// keyword gaps; Competitive is the standalone you-vs-competitors tool.
// (Fix plans live inside each audit, so they aren't a top-level nav item.)
const ITEMS: { href: string; label: string }[] = [
  { href: "/audits", label: "Audits" },
  { href: "/strategy", label: "Strategy" },
  { href: "/competitive", label: "Competitive" },
];

export function Nav() {
  const pathname = usePathname() ?? "";
  return (
    <nav className="flex items-center gap-1 text-sm">
      {ITEMS.map((it) => {
        const active =
          pathname === it.href || pathname.startsWith(`${it.href}/`);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              active
                ? "bg-zinc-900 text-white"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            }`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
