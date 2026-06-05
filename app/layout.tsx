import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/app/components/Nav";

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

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
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
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-zinc-900 focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Skip to content
        </a>
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="font-semibold tracking-tight text-zinc-900"
              >
                SEOMATE
              </Link>
              <span className="hidden font-mono text-[10px] uppercase tracking-wide text-zinc-400 sm:inline">
                SEO / GEO platform
              </span>
            </div>
            <Nav />
          </div>
        </header>
        <main
          id="main-content"
          className="mx-auto w-full max-w-7xl flex-1 px-6 py-8"
        >
          {children}
        </main>
        <footer className="border-t border-zinc-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-3 text-xs text-zinc-400">
            Pixelette Technologies · SEOMATE
          </div>
        </footer>
      </body>
    </html>
  );
}
