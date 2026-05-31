import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SEOMATE",
  description: "SEO/GEO data capture and analysis platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900">
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link
              href="/audits"
              className="font-semibold tracking-tight text-zinc-900"
            >
              SEOMATE
            </Link>
            <nav className="flex items-center gap-5 text-sm text-zinc-600">
              <Link href="/audits" className="hover:text-zinc-900">
                Audits
              </Link>
              <span className="text-zinc-300">|</span>
              <span className="font-mono text-xs text-zinc-400">
                H1 — Site Auditor
              </span>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
          {children}
        </main>
        <footer className="border-t border-zinc-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-3 text-xs text-zinc-400">
            Pixelette Technologies — SEOMATE
          </div>
        </footer>
      </body>
    </html>
  );
}
