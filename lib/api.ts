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

export async function getTaxonomyVersion(): Promise<{
  version: string;
  source_path: string;
}> {
  return api(`/api/taxonomy/version`);
}
