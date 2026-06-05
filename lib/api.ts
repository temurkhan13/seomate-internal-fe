/**
 * Typed client for the SEOMATE FastAPI service.
 *
 * Server Components fetch directly from this module. We avoid TanStack
 * Query and openapi-typescript at this stage — hand-written types match
 * `api/seomate_api/schemas/` exactly and the surface is small enough to
 * audit by eye. Types here are the contract; if the API evolves, both
 * sides change in the same PR.
 */

const API_BASE_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:8000";

// Optional HTTP Basic auth credentials in "user:password" format. Read from a
// server-side env var so the credential never reaches the browser. Mirrors
// BASIC_AUTH_USER + BASIC_AUTH_PASSWORD on seomate-be. Leave unset for local
// dev. SET on Vercel when seomate-be has the matching gate enabled.
const API_BASIC_AUTH = process.env.API_BASIC_AUTH ?? "";

function authHeaders(): Record<string, string> {
  if (!API_BASIC_AUTH) return {};
  return { Authorization: `Basic ${Buffer.from(API_BASIC_AUTH).toString("base64")}` };
}

// ─── Types matching api/seomate_api/schemas/*.py ────────────────────────────

export type AuditStatus =
  | "running"
  | "completed"
  | "completed_with_anomalies"
  | "partial"
  | "failed"
  | "cost_capped";

export type CaptureStatus =
  | "passed"
  | "failed"
  | "partial"
  | "not_applicable"
  | "error"
  | "unmeasurable";

export type EvidenceWeight = "Consensus" | "Probable" | "Contested" | "Speculative";

export type AuditSummary = {
  audit_id: string;
  site_domain: string;
  started_at: string;
  completed_at: string | null;
  status: AuditStatus;
  taxonomy_version: string;
  total_cost_gbp: string | null;
  variables_attempted: number;
  variables_passed: number;
  variables_failed: number;
  variables_partial: number;
  variables_errored: number;
  variables_unmeasurable: number;
  variables_deferred: number;
  variables_not_applicable: number;
  anomaly_count: number;
  consistency_violation_count: number;
};

export type AuditAnomaly = {
  check: string;
  severity: string;
  // Free-form check-specific evidence fields
  [key: string]: unknown;
};

export type AuditDetail = AuditSummary & {
  config_snapshot: Record<string, unknown>;
  anomalies: AuditAnomaly[];
  consistency_violations: AuditAnomaly[];
};

export type CaptureSummary = {
  capture_id: string;
  variable_id: string;
  variable_name: string;
  pillar: string;
  captured_at: string;
  subject_type: string;
  subject_id: string;
  status: CaptureStatus;
  evidence_weight: EvidenceWeight;
  cost_incurred_gbp: string;
  rules_total: number;
  rules_passed: number;
  rules_failed: number;
};

export type RuleResult = {
  rule_id: number;
  rule_text: string;
  passed: boolean;
  evidence: Record<string, unknown>;
  notes: string | null;
};

export type CaptureDetail = {
  capture_id: string;
  audit_id: string;
  variable_id: string;
  pillar: string;
  captured_at: string;
  taxonomy_version: string;
  subject_type: string;
  subject_id: string;
  status: CaptureStatus;
  value: unknown;
  rules: RuleResult[] | null;
  evidence_weight: EvidenceWeight;
  data_sources_used: string[];
  cost_incurred_gbp: string;
  staleness_seconds: number | null;
  errors: string[] | null;
};

export type RuleSummary = {
  rule_id: number;
  title: string;
  text: string;
};

export type Citation = {
  label: string;
  url: string | null;
  description: string | null;
};

export type Dependency = {
  target_id: string;
  kind: string;
  note: string | null;
};

export type Variable = {
  variable_id: string;
  pillar: string;
  name: string;
  evidence_weight: EvidenceWeight | null;
  definition: string;
  rules: RuleSummary[];
  citations: Citation[];
  weight_rationale: string;
  data_sources: string[];
  verification: string;
  cost: string;
  dependencies: Dependency[];
  has_step_1_5: boolean;
  removed: boolean;
  removed_into: string | null;
};

// ─── Remediation plan (the FIX layer) , matches seomate.agent.plan_fixes ─────

export type FixClass = "session" | "human" | "budget" | "owner" | "offsite";

export type RemediationSpec = {
  variable_id: string;
  fix_class: FixClass;
  fix_type: string;
  target: string;
  concrete_change: string;
  required_inputs: string[];
  verify: string;
  automatable: boolean;
  risk: string;
  depends_on: string[];
  effort: string;
  notes: string;
};

export type WorkOrder = {
  variable_id: string;
  pillar: string;
  diagnostic_status: string;
  evidence: string;
  failing_rules: string[];
  has_authored_spec: boolean;
  remediation: RemediationSpec;
};

export type FixPlan = {
  audit_id: string;
  site_domain: string;
  audit_started_at: string | null;
  is_latest_audit: boolean;
  latest_audit_id: string | null;
  actionable_findings: number;
  by_fix_class: Record<string, number>;
  session_automatable: string[];
  needs_remediation_authoring: string[];
  work_orders: WorkOrder[];
};

// ─── Strategy (the STRATEGIST surface) , matches seomate.agent.build_strategy ──

export type PillarFinding = {
  variable_id: string;
  name: string;
  status: string;
  evidence: string;
  fix_class: string;
  concrete_change: string;
};

export type PillarHealth = {
  pillar: string;
  label: string;
  passed: number;
  failed: number;
  partial: number;
  graded: number;
  unmeasured: number;
  health_pct: number | null;
  findings: PillarFinding[];
};

export type StrategyWaveItem = {
  variable_id: string;
  pillar: string;
  fix_class: string;
  concrete_change: string;
};

export type StrategyWave = {
  key: string;
  title: string;
  blurb: string;
  count: number;
  items: StrategyWaveItem[];
};

export type AuditStrategy = {
  audit_id: string;
  site_domain: string;
  audit_started_at: string | null;
  is_latest_audit: boolean;
  actionable_findings: number;
  by_fix_class: Record<string, number>;
  positioning: PillarHealth[];
  waves: StrategyWave[];
};

export type PillarDelta = {
  pillar: string;
  label: string;
  prev_pct: number | null;
  cur_pct: number | null;
  delta: number | null;
};

export type DiffVar = { variable_id: string; name: string; pillar: string };

export type AuditDiff = {
  has_diff: boolean;
  rerun_warning: boolean;
  current_started_at: string | null;
  previous_started_at: string | null;
  pillars: PillarDelta[];
  newly_passed: DiffVar[];
  newly_failed: DiffVar[];
};

// The domain-driven strategy surface , FREE (audit half + Loop diff). The paid
// competitive half is fetched separately (getCompetitive) on an explicit action,
// so opening the strategy view never silently spends DataForSEO budget.
export type SiteStrategy = {
  target: string;
  has_audit: boolean;
  audit: AuditStrategy | null;
  diff: AuditDiff | null;
};

// ─── Projects (the top-level workspace) , matches seomate_api projects route ──

export type ProjectPillar = {
  pillar: string;
  label: string;
  health_pct: number | null;
};

export type ProjectAuditSummary = {
  audit_id: string;
  status: AuditStatus;
  completed_at: string | null;
  started_at: string | null;
  overall_pct: number | null;
  variables_attempted: number;
  pillars: ProjectPillar[];
};

export type ProjectAnalysisRef = {
  analysis_id: string;
  created_at: string | null;
};

export type Project = {
  domain: string;
  name: string;
  latest_audit: ProjectAuditSummary | null;
  audit_count: number;
  latest_competitive: ProjectAnalysisRef | null;
  competitive_count: number;
  latest_strategy: ProjectAnalysisRef | null;
  strategy_count: number;
  last_activity: string | null;
};

export type AuditTrendPoint = {
  audit_id: string;
  at: string;
  overall_pct: number | null;
  pillars: Record<string, number | null>;
};

export type CompetitiveTrendPoint = {
  at: string;
  organic_keywords: number | null;
  organic_traffic: number | null;
};

export type ProjectTrend = {
  domain: string;
  pillar_labels: Record<string, string>;
  audit_trend: AuditTrendPoint[];
  competitive_trend: CompetitiveTrendPoint[];
};

// ─── Competitive intelligence (the COMPETE layer) , matches seomate.competitive ──

export type RankedKeyword = {
  keyword: string;
  volume: number;
  cpc: number;
  difficulty: number | null;
  intent: string | null;
  position: number | null;
  url?: string | null;
};

export type PositionBuckets = {
  top3: number;
  pos_4_10: number;
  pos_11_20: number;
  pos_21_plus: number;
};

export type KeywordProfile = {
  total: number;
  branded: number;
  commercial: number;
  informational: number;
  position_buckets: PositionBuckets;
  top_commercial_keywords: RankedKeyword[];
};

export type BacklinkProfile = {
  rank: number | null;
  backlinks: number;
  referring_domains: number;
  referring_main_domains: number;
  dofollow: number;
  dofollow_ratio: number | null;
  broken: number;
  spam_score: number | null;
  top_referring_domains: { domain: string; rank: number | null; backlinks: number | null }[];
  top_anchors: { anchor: string; backlinks: number | null; referring_domains: number | null }[];
};

export type GeoSignal = {
  entity_recognized: boolean;
  entity_name: string | null;
  entity_types: string[];
  entity_description: string | null;
  entity_score: number | null;
  has_structured_data: boolean;
};

export type TopPage = { url: string; keywords: number; volume: number };

export type CompetitorProfile = {
  domain: string;
  is_target: boolean;
  traffic: {
    organic_keywords: number;
    organic_traffic: number;
    paid_keywords: number;
    paid_traffic: number;
    domain_rank: number | null;
  };
  position_distribution: PositionBuckets;
  keyword_profile: KeywordProfile;
  backlinks: BacklinkProfile | null;
  geo: GeoSignal;
  site: { offerings: string[]; top_pages: TopPage[] };
};

export type DomainVisibility = {
  domain: string;
  is_target: boolean;
  organic_keywords: number;
  organic_traffic: number;
  domain_rank: number | null;
  backlink_rank: number | null;
  referring_domains: number | null;
  entity_recognized: boolean;
};

// A clean competitor gap , a commercial, page-1/2 keyword they win and you don't.
export type MoneyGap = {
  keyword: string;
  volume: number;
  cpc: number;
  difficulty: number | null;
  intent: string | null;
  their_position: number | null;
  their_url: string | null;
};

export type LosingKeyword = {
  keyword: string;
  volume: number;
  our_position: number | null;
  their_position: number | null;
};

export type CompetitorComparison = {
  domain: string;
  gap_count_raw: number;
  gap_count_clean: number;
  shared_count: number;
  we_win_shared: number;
  they_win_shared: number;
  money_gaps: MoneyGap[];
  top_losing_keywords: LosingKeyword[];
};

export type SelfAuditRow = {
  keyword: string;
  volume: number;
  position: number | null;
  intent: string | null;
  cpc: number;
  branded: boolean;
  commercial: boolean;
};

// The self-gap , what the target actually ranks for vs what it should.
export type SelfAudit = {
  total_ranked: number;
  money_keywords_owned: number;
  page1_keywords: number;
  branded: number;
  informational: number;
  ranked_keywords: SelfAuditRow[];
  off_profile_keywords: SelfAuditRow[];
  missing_money_keywords: MoneyGap[];
};

// Session-authored strategic read, attached to a saved run. Null until a Claude
// session reviews the deterministic data and writes the judgment.
export type CompetitiveAnalysis = {
  headline: string;
  competitor_take?: { domain: string; take: string }[];
  the_gaps?: string[];
  recommendations?: string[];
  self_gap?: string;
};

export type CompetitiveReport = {
  target: string;
  competitors: string[];
  auto_discovered: boolean;
  discovery_method?: string;
  location_code: number;
  language_code: string;
  profiles: CompetitorProfile[];
  visibility: DomainVisibility[];
  per_competitor: CompetitorComparison[];
  self_audit: SelfAudit | null;
  analysis: CompetitiveAnalysis | null;
  analysis_id?: string;
};

// The full strategy SNAPSHOT (/api/strategy/run) , the free audit half + Loop
// diff bundled with one paid competitive run, persisted as a saved analysis so
// it can be revisited for free, exactly like an audit.
export type StrategyRun = SiteStrategy & {
  competitive: CompetitiveReport;
  analysis_id?: string;
};

// ─── Saved analyses (history for the Competitive + Strategy surfaces) ────────

export type SavedAnalysisSummary = {
  analysis_id: string;
  kind: "competitive" | "strategy";
  target: string;
  created_at: string | null;
  cost_gbp: number | null;
};

export type SavedAnalysisDetail = SavedAnalysisSummary & {
  // Competitive rows carry a CompetitiveReport; strategy rows a StrategyRun.
  payload: CompetitiveReport | StrategyRun;
};

// ─── Fetch helpers ──────────────────────────────────────────────────────────

/**
 * Fetch JSON from the SEOMATE API.
 *
 * `cache: "no-store"` keeps every page render fresh against the live DB —
 * this is dogfood scale, not a CDN-served public site, so we always want
 * the latest captures. Switch to revalidate-based caching when the audit
 * surface stops changing minute-to-minute.
 */
async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...authHeaders(),
      ...init.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(res.status, `${res.status} ${res.statusText} on ${path}`, body);
  }
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Typed endpoint functions ───────────────────────────────────────────────

export async function listAudits(params: {
  siteDomain?: string;
  limit?: number;
} = {}): Promise<AuditSummary[]> {
  const query = new URLSearchParams();
  if (params.siteDomain) query.set("site_domain", params.siteDomain);
  if (params.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return api<AuditSummary[]>(`/api/audits${qs ? `?${qs}` : ""}`);
}

export async function getAudit(auditId: string): Promise<AuditDetail> {
  return api<AuditDetail>(`/api/audits/${auditId}`);
}

export async function listCaptures(
  auditId: string,
  filters: {
    pillar?: string;
    status?: CaptureStatus;
    evidenceWeight?: EvidenceWeight;
    subjectType?: string;
  } = {},
): Promise<CaptureSummary[]> {
  const query = new URLSearchParams();
  if (filters.pillar) query.set("pillar", filters.pillar);
  if (filters.status) query.set("status", filters.status);
  if (filters.evidenceWeight) query.set("evidence_weight", filters.evidenceWeight);
  if (filters.subjectType) query.set("subject_type", filters.subjectType);
  const qs = query.toString();
  return api<CaptureSummary[]>(
    `/api/audits/${auditId}/captures${qs ? `?${qs}` : ""}`,
  );
}

export async function getCapture(
  auditId: string,
  variableId: string,
): Promise<CaptureDetail> {
  return api<CaptureDetail>(`/api/audits/${auditId}/captures/${variableId}`);
}

export async function getVariable(variableId: string): Promise<Variable> {
  return api<Variable>(`/api/taxonomy/variables/${variableId}`);
}

export async function getAuditPlan(auditId: string): Promise<FixPlan> {
  return api<FixPlan>(`/api/audits/${auditId}/plan`);
}

export async function getAuditStrategy(auditId: string): Promise<AuditStrategy> {
  return api<AuditStrategy>(`/api/audits/${auditId}/strategy`);
}

// Every project (site) the platform has worked on, newest activity first.
export async function getProjects(): Promise<Project[]> {
  return api<Project[]>(`/api/projects`);
}

// Improvement-over-time for one project (audit health + competitive footprint).
export async function getProjectTrend(domain: string): Promise<ProjectTrend> {
  return api<ProjectTrend>(`/api/projects/${encodeURIComponent(domain)}/trend`);
}

export async function getCompetitive(
  target: string,
  competitors?: string,
  focus?: string,
  keywordLimit = 100,
): Promise<CompetitiveReport> {
  const q = new URLSearchParams({ target });
  if (competitors) q.set("competitors", competitors);
  if (focus) q.set("focus", focus);
  q.set("keyword_limit", String(keywordLimit));
  return api<CompetitiveReport>(`/api/competitive?${q.toString()}`);
}

export async function getSiteStrategy(target: string): Promise<SiteStrategy> {
  const q = new URLSearchParams({ target });
  return api<SiteStrategy>(`/api/strategy?${q.toString()}`);
}

// Build + persist a full strategy snapshot. PAID (runs competitive). Returns the
// bundle with analysis_id; the snapshot then appears in the Strategy history.
export async function getStrategyRun(
  target: string,
  competitors?: string,
  focus?: string,
  keywordLimit = 100,
): Promise<StrategyRun> {
  const q = new URLSearchParams({ target });
  if (competitors) q.set("competitors", competitors);
  if (focus) q.set("focus", focus);
  q.set("keyword_limit", String(keywordLimit));
  return api<StrategyRun>(`/api/strategy/run?${q.toString()}`);
}

// History for the Competitive + Strategy surfaces (summaries, newest first).
export async function getSavedAnalyses(
  kind: "competitive" | "strategy",
  target?: string,
): Promise<SavedAnalysisSummary[]> {
  const q = new URLSearchParams({ kind });
  if (target) q.set("target", target);
  return api<SavedAnalysisSummary[]>(`/api/saved?${q.toString()}`);
}

// One saved analysis with its full payload , free, no DataForSEO call.
export async function getSavedAnalysis(id: string): Promise<SavedAnalysisDetail> {
  return api<SavedAnalysisDetail>(`/api/saved/${id}`);
}

export async function getTaxonomyVersion(): Promise<{
  version: string;
  source_path: string;
}> {
  return api(`/api/taxonomy/version`);
}
