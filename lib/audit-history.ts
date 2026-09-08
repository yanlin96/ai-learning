import type { SeverityCounts } from "@/lib/audit-findings";
import type { WebsiteAudit } from "@/lib/website-audit";

/**
 * Per-tab record of what has been audited.
 *
 * Session storage only: nothing reaches a server, and closing the tab discards it.
 * Only a summary of each run is kept — enough to see what was checked and how it
 * scored, without holding whole reports in a 5 MB quota.
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
  };
}

/** Newest first; returns the updated list so callers can render without re-reading. */
export function recordAuditRun(report: WebsiteAudit): AuditHistoryEntry[] {
  const next = [summariseRun(report), ...readAuditHistory()].slice(0, MAX_ENTRIES);
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Over quota or storage disabled: the run still displays, it just is not remembered.
  }
  return next;
}

export function clearAuditHistory() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
}
