import type {
  CompetitiveAnalysis,
  CompetitiveReport,
  CompetitorComparison,
  CompetitorProfile,
  DomainVisibility,
  MoneyGap,
  SelfAudit,
} from "@/lib/api";

/**
 * Decision-grade competitor intelligence. Renders, top to bottom: the
 * strategist read (when a session has written one), the head-to-head
 * visibility gap, the self-gap (what the target ranks for vs what it should),
 * the per-competitor keyword gaps, and a full intelligence profile per domain
 * (traffic, keywords, backlinks, GEO). Null-safe so older saved runs that
 * predate the richer shape still render what they have.
 */
export function CompetitiveReportView({ report }: { report: CompetitiveReport }) {
  const profiles = report.profiles ?? [];
  const target = profiles.find((p) => p.is_target) ?? null;
  const competitors = profiles.filter((p) => !p.is_target);

  return (
    <div className="flex flex-col gap-6">
      {report.auto_discovered && (
        <DiscoveryNote method={report.discovery_method} />
      )}
      {report.analysis && <StrategicRead analysis={report.analysis} />}
      <VisibilitySection rows={report.visibility ?? []} />
      {report.self_audit && (
        <SelfGapSection self={report.self_audit} target={report.target} />
      )}
      <CompetitorGapsSection rows={report.per_competitor ?? []} />
      {profiles.length > 0 && (
        <ProfilesSection target={target} competitors={competitors} />
      )}
      {!report.analysis && <AnalysisPending />}
    </div>
  );
}

const fmt = (n: number | null | undefined) => (n ?? 0).toLocaleString();
const posLabel = (p: number | null | undefined) => (p == null ? "-" : `#${p}`);
const posTone = (p: number | null | undefined): string => {
  if (p == null) return "text-zinc-400";
  if (p <= 10) return "text-emerald-600"; // page 1
  if (p <= 20) return "text-amber-600"; // page 2
  return "text-rose-500"; // deeper
};

// ─── strategist read (session-authored) ─────────────────────────────────────
function StrategicRead({ analysis }: { analysis: CompetitiveAnalysis }) {
  return (
    <section className="rounded-lg border border-indigo-200 bg-indigo-50 p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
        Strategist read
      </div>
      <p className="mt-2 text-sm font-medium leading-relaxed text-indigo-950">
        {analysis.headline}
      </p>
      {analysis.the_gaps && analysis.the_gaps.length > 0 && (
        <Bullets title="The gaps that matter" items={analysis.the_gaps} />
      )}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <Bullets title="What to do" items={analysis.recommendations} />
      )}
      {analysis.self_gap && (
        <div className="mt-3">
          <div className="text-xs font-semibold text-indigo-700">
            Fix what you rank for
          </div>
          <p className="mt-1 text-sm leading-relaxed text-indigo-900">
            {analysis.self_gap}
          </p>
        </div>
      )}
      {analysis.competitor_take && analysis.competitor_take.length > 0 && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {analysis.competitor_take.map((c) => (
            <div key={c.domain} className="rounded border border-indigo-200 bg-white p-3">
              <div className="font-mono text-xs text-indigo-700">{c.domain}</div>
              <p className="mt-1 text-xs leading-relaxed text-zinc-700">{c.take}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Bullets({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-3">
      <div className="text-xs font-semibold text-indigo-700">{title}</div>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-relaxed text-indigo-900">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

function AnalysisPending() {
  return (
    <div className="rounded border border-dashed border-zinc-300 bg-zinc-50 p-4 text-xs text-zinc-500">
      Strategist read pending. The numbers above are the platform&apos;s; a
      strategist session reviews them and writes the &quot;so what&quot; , what
      each competitor is doing, which gaps to close first, and how to fix the
      keywords you rank for.
    </div>
  );
}

function DiscoveryNote({ method }: { method?: string }) {
  if (method === "priority_keywords") {
    return (
      <div className="rounded border border-sky-300 bg-sky-50 p-3 text-xs text-sky-900">
        Competitors were found by <strong>who ranks for your focus keywords</strong>{" "}
        , the firms actually competing for the terms you want to win (aggregators
        and directories filtered out). Pass an explicit competitor list to override.
      </div>
    );
  }
  return (
    <div className="rounded border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
      Competitors were auto-discovered from homepage content , a weak guess for a
      low-footprint site. For a meaningful comparison, add{" "}
      <strong>focus keywords</strong> (the heads you want to win) or pass your own
      competitor list.
    </div>
  );
}

// ─── head-to-head visibility ────────────────────────────────────────────────
function VisibilitySection({ rows }: { rows: DomainVisibility[] }) {
  if (rows.length === 0) return null;
  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 p-5">
        <h2 className="text-sm font-medium text-zinc-800">Head-to-head visibility</h2>
        <p className="mt-1 text-xs text-zinc-500">
          The size of the gap, at a glance: organic footprint, authority, and
          whether each domain is a recognised entity.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-zinc-500">
              <th className="p-3 font-medium">Domain</th>
              <th className="p-3 font-medium">Organic keywords</th>
              <th className="p-3 font-medium">Est. traffic</th>
              <th className="p-3 font-medium">Authority</th>
              <th className="p-3 font-medium">Ref. domains</th>
              <th className="p-3 font-medium">Entity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((v) => (
              <tr key={v.domain} className={v.is_target ? "bg-emerald-50" : ""}>
                <td className="p-3 font-mono text-xs">
                  {v.domain}
                  {v.is_target && (
                    <span className="ml-2 rounded bg-emerald-200 px-1.5 py-0.5 text-[10px] text-emerald-900">
                      you
                    </span>
                  )}
                </td>
                <td className="p-3 font-mono">{fmt(v.organic_keywords)}</td>
                <td className="p-3 font-mono">{fmt(v.organic_traffic)}</td>
                <td className="p-3 font-mono">{v.backlink_rank ?? "-"}</td>
                <td className="p-3 font-mono">
                  {v.referring_domains == null ? "-" : fmt(v.referring_domains)}
                </td>
                <td className="p-3">
                  {v.entity_recognized ? (
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-800">
                      recognised
                    </span>
                  ) : (
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500">
                      no
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── self-gap: what you rank for vs what you should ─────────────────────────
function SelfGapSection({ self, target }: { self: SelfAudit; target: string }) {
  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 p-5">
        <h2 className="text-sm font-medium text-zinc-800">
          Your keyword reality , {target}
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          What you actually rank for, and the buyer-intent keywords you are
          missing. This is the self-gap: are you visible for the right things?
        </p>
      </div>
      <div className="grid grid-cols-2 gap-px bg-zinc-100 sm:grid-cols-4">
        <Stat label="Keywords ranked" value={fmt(self.total_ranked)} />
        <Stat
          label="On Google page 1"
          value={fmt(self.page1_keywords)}
          tone={self.page1_keywords === 0 ? "bad" : "good"}
        />
        <Stat
          label="Money keywords (page 1)"
          value={fmt(self.money_keywords_owned)}
          tone={self.money_keywords_owned === 0 ? "bad" : "good"}
        />
        <Stat label="Informational" value={fmt(self.informational)} />
      </div>
      {self.page1_keywords === 0 && self.total_ranked > 0 && (
        <div className="border-t border-zinc-100 bg-rose-50 px-5 py-3 text-xs text-rose-900">
          You rank on page 1 of Google for <strong>nothing</strong>. All{" "}
          {fmt(self.total_ranked)} keywords you rank for sit on page 2 or deeper,
          where they earn almost no clicks , which is why your estimated traffic
          is near zero despite having a live, indexed site.
        </div>
      )}

      {self.ranked_keywords.length > 0 && (
        <details className="border-t border-zinc-100 px-5 py-3">
          <summary className="cursor-pointer text-xs font-medium text-zinc-600 hover:text-zinc-900">
            What you actually rank for , every keyword and where it sits ({fmt(self.total_ranked)})
          </summary>
          <ul className="mt-3 space-y-1">
            {self.ranked_keywords.map((r) => (
              <li
                key={r.keyword}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span className="truncate text-zinc-800">
                  {r.keyword}
                  {r.branded && (
                    <span className="ml-1.5 text-[10px] text-zinc-400">brand</span>
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-2 font-mono text-zinc-500">
                  <span>{fmt(r.volume)}</span>
                  {r.cpc > 0 && (
                    <span className="text-emerald-600">${r.cpc.toFixed(2)}</span>
                  )}
                  <span className="text-zinc-400">{r.intent ?? "-"}</span>
                  <span className={posTone(r.position)}>{posLabel(r.position)}</span>
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {self.off_profile_keywords.length > 0 && (
        <div className="border-t border-zinc-100 p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-rose-600">
            Ranking for the wrong things
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Brand-adjacent keywords with no buyer intent , you own them, but they
            sell nothing and can crowd out the brand you want to be known for.
          </p>
          <ul className="mt-2 space-y-1">
            {self.off_profile_keywords.map((r) => (
              <li
                key={r.keyword}
                className="flex items-center justify-between gap-2 rounded bg-rose-50 px-3 py-1.5 text-xs"
              >
                <span className="truncate font-medium text-rose-900">{r.keyword}</span>
                <span className="flex shrink-0 items-center gap-2 font-mono text-rose-500">
                  <span>{posLabel(r.position)}</span>
                  <span className="text-rose-400">{r.intent ?? "no intent"}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="border-t border-zinc-100 p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-sky-600">
          Money keywords you are missing
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          Commercial, page-1/2 keywords competitors win that you do not rank for
          at all. This is the target list.
        </p>
        <KeywordGapList gaps={self.missing_money_keywords} empty="No clean commercial gaps surfaced from this competitor set." />
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad";
}) {
  const color =
    tone === "bad" ? "text-rose-600" : tone === "good" ? "text-emerald-600" : "text-zinc-900";
  return (
    <div className="bg-white p-4">
      <div className={`text-xl font-semibold ${color}`}>{value}</div>
      <div className="mt-0.5 text-[11px] text-zinc-500">{label}</div>
    </div>
  );
}

// ─── per-competitor keyword gaps ────────────────────────────────────────────
function CompetitorGapsSection({ rows }: { rows: CompetitorComparison[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="flex flex-col gap-4">
      {rows.map((c) => (
        <section key={c.domain} className="rounded-lg border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 p-5">
            <h2 className="text-sm font-medium text-zinc-800">vs {c.domain}</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Ranks for {fmt(c.gap_count_raw)} keywords you don&apos;t.{" "}
              <span className="font-medium text-zinc-700">
                {fmt(c.gap_count_clean)} are commercial page-1/2 keywords
              </span>{" "}
              worth targeting. Shares {fmt(c.shared_count)} with you (you win{" "}
              {c.we_win_shared}, they win {c.they_win_shared}).
            </p>
          </div>
          <div className="grid gap-0 divide-zinc-100 sm:grid-cols-2 sm:divide-x">
            <div className="p-5">
              <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Money keyword gaps
              </h3>
              <KeywordGapList
                gaps={c.money_gaps ?? []}
                empty="No commercial page-1/2 keyword they win cleanly , their footprint is informational/long-tail, not money keywords."
              />
            </div>
            <div className="p-5">
              <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Shared , they out-rank you
              </h3>
              {(c.top_losing_keywords ?? []).length === 0 ? (
                <p className="mt-2 text-xs text-zinc-400">none</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {c.top_losing_keywords.map((g) => (
                    <li
                      key={g.keyword}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="truncate text-zinc-800">{g.keyword}</span>
                      <span className="flex shrink-0 items-center gap-2 font-mono text-zinc-500">
                        <span>{fmt(g.volume)}</span>
                        <span className="text-zinc-400">
                          you {posLabel(g.our_position)} / them {posLabel(g.their_position)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

function KeywordGapList({ gaps, empty }: { gaps: MoneyGap[]; empty: string }) {
  if (!gaps || gaps.length === 0) {
    return <p className="mt-2 text-xs text-zinc-400">{empty}</p>;
  }
  return (
    <ul className="mt-2 space-y-1">
      {gaps.map((g) => (
        <li
          key={g.keyword}
          className="flex items-center justify-between gap-2 text-xs"
        >
          <span className="truncate text-zinc-800">
            {g.keyword}
            {g.intent && (
              <span className="ml-1.5 text-[10px] text-zinc-400">{g.intent}</span>
            )}
          </span>
          <span className="flex shrink-0 items-center gap-2 font-mono text-zinc-500">
            <span>{fmt(g.volume)}</span>
            {g.cpc > 0 && <span className="text-emerald-600">${g.cpc.toFixed(2)}</span>}
            <span className="text-zinc-400">{posLabel(g.their_position)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

// ─── full intelligence profiles ─────────────────────────────────────────────
function ProfilesSection({
  target,
  competitors,
}: {
  target: CompetitorProfile | null;
  competitors: CompetitorProfile[];
}) {
  const ordered = [target, ...competitors].filter(Boolean) as CompetitorProfile[];
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-medium text-zinc-800">Competitor intelligence</h2>
        <p className="mt-1 text-xs text-zinc-500">
          The full profile per domain: what they sell, traffic, keyword mix,
          backlink authority, and GEO/entity presence.
        </p>
      </div>
      {ordered.map((p) => (
        <ProfileCard key={p.domain} p={p} />
      ))}
    </section>
  );
}

function ProfileCard({ p }: { p: CompetitorProfile }) {
  const kp = p.keyword_profile;
  const bl = p.backlinks;
  return (
    <div
      className={`overflow-hidden rounded-lg border bg-white ${
        p.is_target ? "border-emerald-300" : "border-zinc-200"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 p-4">
        <div className="font-mono text-sm text-zinc-800">
          {p.domain}
          {p.is_target && (
            <span className="ml-2 rounded bg-emerald-200 px-1.5 py-0.5 text-[10px] text-emerald-900">
              you
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
          <span>
            <span className="font-mono text-zinc-800">{fmt(p.traffic.organic_keywords)}</span> keywords
          </span>
          <span>
            <span className="font-mono text-zinc-800">{fmt(p.traffic.organic_traffic)}</span> est. traffic
          </span>
          {p.traffic.paid_keywords > 0 && (
            <span>
              <span className="font-mono text-zinc-800">{fmt(p.traffic.paid_keywords)}</span> paid
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-px bg-zinc-100 md:grid-cols-2">
        {/* what they sell + top pages */}
        <div className="bg-white p-4">
          <Label>What they sell</Label>
          {p.site.offerings.length === 0 ? (
            <p className="mt-1 text-xs text-zinc-400">not detected from homepage</p>
          ) : (
            <div className="mt-1 flex flex-wrap gap-1">
              {p.site.offerings.map((o) => (
                <span key={o} className="rounded bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-700">
                  {o}
                </span>
              ))}
            </div>
          )}
          <Label className="mt-3">Top pages</Label>
          <ul className="mt-1 space-y-0.5">
            {p.site.top_pages.slice(0, 4).map((tp) => (
              <li key={tp.url} className="flex justify-between gap-2 text-[11px]">
                <span className="truncate font-mono text-zinc-600">{tp.url}</span>
                <span className="shrink-0 font-mono text-zinc-400">{fmt(tp.volume)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* keyword profile */}
        <div className="bg-white p-4">
          <Label>Keyword mix</Label>
          <div className="mt-1 text-xs text-zinc-600">
            <span className="font-mono text-zinc-800">{fmt(kp.commercial)}</span> commercial ·{" "}
            <span className="font-mono text-zinc-800">{fmt(kp.branded)}</span> branded ·{" "}
            <span className="font-mono text-zinc-800">{fmt(kp.informational)}</span> informational
          </div>
          <div className="mt-2 flex gap-1 text-[10px] text-zinc-500">
            <Bucket label="top 3" value={kp.position_buckets.top3} />
            <Bucket label="4-10" value={kp.position_buckets.pos_4_10} />
            <Bucket label="11-20" value={kp.position_buckets.pos_11_20} />
            <Bucket label="21+" value={kp.position_buckets.pos_21_plus} />
          </div>
          {kp.top_commercial_keywords.length > 0 && (
            <>
              <Label className="mt-3">Top money keywords</Label>
              <ul className="mt-1 space-y-0.5">
                {kp.top_commercial_keywords.slice(0, 5).map((k) => (
                  <li key={k.keyword} className="flex justify-between gap-2 text-[11px]">
                    <span className="truncate text-zinc-700">{k.keyword}</span>
                    <span className="shrink-0 font-mono text-zinc-400">
                      {fmt(k.volume)} · {posLabel(k.position)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* backlinks */}
        <div className="bg-white p-4">
          <Label>Backlink authority</Label>
          {!bl ? (
            <p className="mt-1 text-xs text-zinc-400">not measured</p>
          ) : (
            <>
              <div className="mt-1 text-xs text-zinc-600">
                Authority <span className="font-mono text-zinc-800">{bl.rank ?? "-"}</span> ·{" "}
                <span className="font-mono text-zinc-800">{fmt(bl.referring_domains)}</span> ref domains ·{" "}
                <span className="font-mono text-zinc-800">{fmt(bl.backlinks)}</span> links
                {bl.spam_score != null && (
                  <>
                    {" "}· spam{" "}
                    <span
                      className={`font-mono ${
                        bl.spam_score >= 30 ? "text-rose-600" : "text-zinc-800"
                      }`}
                    >
                      {bl.spam_score}%
                    </span>
                  </>
                )}
              </div>
              {bl.top_referring_domains.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {bl.top_referring_domains.slice(0, 4).map((d) => (
                    <li key={d.domain} className="flex justify-between gap-2 text-[11px]">
                      <span className="truncate font-mono text-zinc-600">{d.domain}</span>
                      <span className="shrink-0 font-mono text-zinc-400">auth {d.rank ?? "-"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        {/* GEO */}
        <div className="bg-white p-4">
          <Label>GEO / entity presence</Label>
          <div className="mt-1 text-xs text-zinc-600">
            {p.geo.entity_recognized ? (
              <span>
                Recognised entity:{" "}
                <span className="text-zinc-800">{p.geo.entity_name}</span>
                {p.geo.entity_types.length > 0 && (
                  <span className="text-zinc-400"> ({p.geo.entity_types.join(", ")})</span>
                )}
              </span>
            ) : (
              <span className="text-zinc-500">Not a recognised entity in the Knowledge Graph</span>
            )}
          </div>
          <div className="mt-1 text-xs">
            Structured data:{" "}
            {p.geo.has_structured_data ? (
              <span className="text-emerald-600">present</span>
            ) : (
              <span className="text-rose-500">none on homepage</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`text-[10px] font-semibold uppercase tracking-wide text-zinc-400 ${className}`}>
      {children}
    </div>
  );
}

function Bucket({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded bg-zinc-100 px-1.5 py-0.5">
      {label} <span className="font-mono text-zinc-700">{value}</span>
    </span>
  );
}
