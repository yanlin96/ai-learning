import type { QualityFinding, SeverityCounts } from "@/lib/audit-findings";
import type { WebsiteAudit } from "@/lib/website-audit";

/**
 * Per-tab record of what has been audited.
 *
 * Session storage only: nothing reaches a server, and closing the tab discards it.
 * Compact snapshots preserve scores, actionable findings and coverage, not page
 * response bodies or the full crawl report. Quota failures preserve prior history.
 */

const STORAGE_KEY = "audit-history";
const MAX_ENTRIES = 50;

export type AuditHistoryEntry = {
  id: string;
  url: string;
  title: string;
  ranAt: string;
  seoScore: number;
  aiScore: number;
  brokenLinks: number;
  linksChecked: number;
  linksDiscovered: number;
  findingsTotal: number;
  severityCounts: SeverityCounts;
  contextual: boolean;
  /** Optional for records saved before detailed history was introduced. */
  findings?: QualityFinding[];
  firstActions?: string[];
  notVerified?: string[];
  coverage?: { rendering: string; seoConfidence: string; aiConfidence: string; inconclusive: number; unchecked: number };
};

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function readAuditHistory(): AuditHistoryEntry[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AuditHistoryEntry[]) : [];
  } catch {
    // Private mode, blocked storage, or corrupted JSON — an empty history is fine.
    return [];
  }
}

export function summariseRun(report: WebsiteAudit): AuditHistoryEntry {
  return {
    id: newId(),
    url: report.finalUrl,
    title: report.page.title,
    ranAt: report.checkedAt,
    seoScore: report.seo.score,
    aiScore: report.aiVisibility.score,
    brokenLinks: report.links.broken.length,
    linksChecked: report.links.checked,
    linksDiscovered: report.links.discovered,
    findingsTotal: report.qualityReport.findings.length,
    severityCounts: report.qualityReport.severityCounts,
    contextual: report.qualityReport.contextualAnalysis === "complete",
    findings: report.qualityReport.findings.map((finding) => ({ ...finding })),
    firstActions: [...report.qualityReport.firstActions],
    notVerified: [...report.qualityReport.notVerified],
    coverage: {
      rendering: report.page.rendering,
      seoConfidence: report.seo.confidence,
      aiConfidence: report.aiVisibility.confidence,
      inconclusive: report.links.inconclusive.length,
      unchecked: report.links.unchecked,
    },
  };
}

/** Newest first; returns the updated list so callers can render without re-reading. */
export function recordAuditRun(report: WebsiteAudit): AuditHistoryEntry[] {
  const next = [summariseRun(report), ...readAuditHistory()].slice(0, MAX_ENTRIES);
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Over quota or storage disabled: the run still displays, it just is not remembered.
    return readAuditHistory();
  }
  return next;
}

export function clearAuditHistory() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
}
