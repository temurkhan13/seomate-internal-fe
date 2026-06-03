import { redirect } from "next/navigation";

import { ApiError, getAudit } from "@/lib/api";

// The per-audit strategy view was superseded by the top-level, domain-driven
// /strategy surface (positioning drill-down + waves + what-changed + competitive).
// This route now redirects there so old links + bookmarks land on the full page.
export const dynamic = "force-dynamic";

type Params = { auditId: string };

export default async function PerAuditStrategyRedirect({
  params,
}: {
  params: Promise<Params>;
}) {
  const { auditId } = await params;
  let domain: string | null = null;
  try {
    const audit = await getAudit(auditId);
    domain = audit.site_domain;
  } catch (e) {
    if (!(e instanceof ApiError && e.status === 404)) throw e;
  }
  redirect(domain ? `/strategy?target=${encodeURIComponent(domain)}` : "/audits");
}
