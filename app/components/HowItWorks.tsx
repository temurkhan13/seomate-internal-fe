/**
 * Onboarding panel shown at the top of the audits dashboard. The point: a
 * colleague's Claude session (or the colleague) who opens SEOMATE for the first
 * time sees HOW to run an audit without hunting through repo docs. Collapsible
 * so it stays out of the way once the flow is known.
 */
export function HowItWorks() {
  return (
    <details className="group rounded-lg border border-indigo-200 bg-indigo-50/50 px-4 py-3 text-sm">
      <summary className="cursor-pointer select-none font-medium text-indigo-900 marker:text-indigo-400">
        How to run an audit (for a Claude session)
        <span className="ml-2 font-normal text-indigo-500 group-open:hidden">
          , click to expand
        </span>
      </summary>

      <div className="mt-3 flex flex-col gap-3 text-zinc-700">
        <p>
          SEOMATE is the diagnostic infrastructure: it supplies the taxonomy, the
          data plumbing, the storage, and this dashboard. A Claude session is the
          auditor , it gathers data, applies judgment per variable, and writes the
          result back here. To audit a new site:
        </p>

        <ol className="flex flex-col gap-2 pl-1">
          <li>
            <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">1</span>
            <span className="font-medium">Get the brief.</span>{" "}
            <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs text-indigo-900">
              seomate export-brief --out brief.json
            </code>{" "}
            , all 232 variables, their rules, and which data source answers each.
          </li>
          <li>
            <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">2</span>
            <span className="font-medium">Gather every reachable source.</span>{" "}
            <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs text-indigo-900">
              seomate gather --domain abcd.com --out audit-cache
            </code>{" "}
            , crawl + link graph, robots, PageSpeed, CrUX, Wayback, Knowledge
            Graph, DataForSEO SERP/Labs/Business/LLM-citations, Search Console.
            Auto-derives keywords + market. Read{" "}
            <code className="rounded bg-white px-1 py-0.5 font-mono text-xs">
              audit-cache/manifest.json
            </code>{" "}
            for what is available vs unavailable.
          </li>
          <li>
            <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">3</span>
            <span className="font-medium">Evaluate each variable from the cache.</span>{" "}
            This is the only part needing judgment. Apply each variable&apos;s
            rules against the gathered data. For any source the manifest marks
            unavailable, the dependent variables are{" "}
            <span className="font-medium">unmeasurable</span> , never guessed.
          </li>
          <li>
            <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">4</span>
            <span className="font-medium">Write it back.</span>{" "}
            <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs text-indigo-900">
              seomate ingest --file audit.json
            </code>{" "}
            , validates against the contract and lands the audit on this
            dashboard. It then appears in the list below.
          </li>
        </ol>

        <p className="text-xs text-zinc-500">
          Full method (source , capability matrix):{" "}
          <span className="font-mono">docs/agent-audit-runbook.md</span>. Keys a
          session needs: <span className="font-mono">docs/agent-credentials.md</span>.
          Discipline: evidence must be real and gathered this run; never fabricate
          a pass/fail; verify against this dashboard after ingesting.
        </p>
      </div>
    </details>
  );
}
