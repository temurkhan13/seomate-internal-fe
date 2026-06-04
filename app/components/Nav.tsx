"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Top-level destinations. Projects is the home (every site with its latest
// state); the others are the cross-site tools. Audits is the diagnostic;
// Strategy unifies the latest audit with competitive standing; Competitive is
// the standalone you-vs-competitors tool. (Fix plans live inside each audit.)
const ITEMS: { href: string; label: string; match: (p: string) => boolean }[] = [
  { href: "/", label: "Projects", match: (p) => p === "/" || p.startsWith("/project") },
  { href: "/audits", label: "Audits", match: (p) => p === "/audits" || p.startsWith("/audits/") },
  { href: "/strategy", label: "Strategy", match: (p) => p === "/strategy" || p.startsWith("/strategy/") },
  { href: "/competitive", label: "Competitive", match: (p) => p === "/competitive" || p.startsWith("/competitive/") },
];

export function Nav() {
  const pathname = usePathname() ?? "";
  return (
    <nav className="flex items-center gap-1 text-sm">
      {ITEMS.map((it) => {
        const active = it.match(pathname);
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
