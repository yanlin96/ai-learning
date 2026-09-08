/**
 * Shared vocabulary for the Quality & Fix Report.
 *
 * Every finding must carry enough context that a content author can act on it
 * without re-investigating: what the element is, the observed evidence, why it
 * matters, and the concrete fix. Confidence is tracked separately from severity
 * so low-certainty contextual findings can be surfaced without inflating the
 * remediation queue.
 */

export type Severity = "critical" | "high" | "medium" | "low";
export type Confidence = "high" | "medium" | "low";

export type FindingCategory =
  | "broken-link"
  | "accessibility"
  | "expired-content"
  | "content-quality"
  | "seo"
  | "ai-visibility";

export type FindingOwner = "Content" | "Design/Accessibility" | "Web Publishing" | "Engineering";

export type QualityFinding = {
  category: FindingCategory;
  severity: Severity;
  confidence: Confidence;
  /** The part of the page at fault, e.g. "Promotional banner" or "Navigation link". */
  element: string;
  /** Observed fact, quoted from the page wherever possible. */
  evidence: string;
  /** Why it matters to a member or to compliance. */
  impact: string;
  /** The specific remediation step. */
  fix: string;
  owner: FindingOwner;
  /** Selector, URL, or text anchor that locates the issue on the page. */
  location?: string;
  /** Set when an exclusion rule downgraded rather than removed the finding. */
  note?: string;
};

export const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low"];
export const CONFIDENCE_ORDER: Confidence[] = ["high", "medium", "low"];

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const CATEGORY_LABEL: Record<FindingCategory, string> = {
  "broken-link": "Broken link",
  accessibility: "Accessibility",
  "expired-content": "Expired content",
  "content-quality": "Content quality",
  seo: "SEO / page health",
  "ai-visibility": "AI crawler access",
};

export type SeverityCounts = Record<Severity, number>;

export function countBySeverity(findings: QualityFinding[]): SeverityCounts {
  const counts: SeverityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const finding of findings) counts[finding.severity] += 1;
  return counts;
}

/** Highest severity first, then highest confidence, so the queue is remediation-ordered. */
export function sortFindings(findings: QualityFinding[]): QualityFinding[] {
  return [...findings].sort((a, b) => {
    const bySeverity = SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity);
    if (bySeverity !== 0) return bySeverity;
    return CONFIDENCE_ORDER.indexOf(a.confidence) - CONFIDENCE_ORDER.indexOf(b.confidence);
  });
}

/**
 * Model output is never trusted above deterministic checks: an LLM-sourced
 * finding is capped at medium severity and medium confidence.
 */
export function capContextualFinding(finding: QualityFinding): QualityFinding {
  const severity: Severity = finding.severity === "critical" || finding.severity === "high"
    ? "medium"
    : finding.severity;
  const confidence: Confidence = finding.confidence === "high" ? "medium" : finding.confidence;
  return { ...finding, severity, confidence };
}

/** Fixes that are cheap, unambiguous, and safe to hand straight to an author. */
export function quickWins(findings: QualityFinding[]): string[] {
  return findings
    .filter((finding) => finding.confidence === "high" && finding.severity !== "critical")
    .filter((finding) => finding.category !== "ai-visibility")
    .slice(0, 6)
    .map((finding) => finding.fix);
}

/** The three highest-value actions, deduplicated by category. */
export function firstActions(findings: QualityFinding[]): string[] {
  const seen = new Set<FindingCategory>();
  const actions: string[] = [];
  for (const finding of sortFindings(findings)) {
    if (seen.has(finding.category)) continue;
    seen.add(finding.category);
    actions.push(`${finding.element}: ${finding.fix}`);
    if (actions.length === 3) break;
  }
  return actions;
}

export function retestChecklist(findings: QualityFinding[]): string[] {
  const byCategory = new Map<FindingCategory, number>();
  for (const finding of findings) {
    byCategory.set(finding.category, (byCategory.get(finding.category) || 0) + 1);
  }
  const checklist: string[] = [];
  if (byCategory.get("broken-link")) checklist.push("All reported broken links resolve or have been removed.");
  if (byCategory.get("accessibility")) checklist.push("Alt text, link labels, and heading hierarchy re-validated.");
  if (byCategory.get("expired-content")) checklist.push("Expired dates and campaign banners removed or rescheduled.");
  if (byCategory.get("content-quality")) checklist.push("Flagged copy, CTA labels, and claims reviewed by the content owner.");
  if (byCategory.get("seo")) checklist.push("Title, meta description, canonical, and indexability confirmed.");
  if (byCategory.get("ai-visibility")) checklist.push("Crawler access re-checked after robots.txt or rendering changes.");
  checklist.push("Full page re-audited and severity counts compared against this run.");
  return checklist;
}
