import type { AccessibilityEstimateReport } from "@/lib/accessibility-estimate";
import type { SmokeTestReport } from "@/lib/smoke-test";
import type { WebsiteAudit } from "@/lib/website-audit";

export type AssistantReportKind = "website_audit" | "accessibility_audit" | "smoke_test";

export type StoredAssistantReport =
  | { version: 1; id: string; kind: "website_audit"; targetUrl: string; createdAt: string; report: WebsiteAudit }
  | { version: 1; id: string; kind: "accessibility_audit"; targetUrl: string; createdAt: string; report: AccessibilityEstimateReport }
  | { version: 1; id: string; kind: "smoke_test"; targetUrl: string; createdAt: string; report: SmokeTestReport };

const INDEX_KEY = "cpa-tools-assistant-report-index-v1";
const REPORT_PREFIX = "cpa-tools-assistant-report-v1:";
const MAX_REPORTS = 5;

function readIndex() {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(INDEX_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}

function removeReport(id: string) {
  try { sessionStorage.removeItem(`${REPORT_PREFIX}${id}`); } catch {}
}

export function saveAssistantReport(report: Omit<StoredAssistantReport, "version" | "id" | "createdAt">) {
  const id = crypto.randomUUID();
  const stored = { ...report, version: 1 as const, id, createdAt: new Date().toISOString() } as StoredAssistantReport;
  const previous = readIndex().filter((value) => value !== id);
  const retained = previous.slice(0, MAX_REPORTS - 1);
  for (const expired of previous.slice(MAX_REPORTS - 1)) removeReport(expired);

  try {
    sessionStorage.setItem(`${REPORT_PREFIX}${id}`, JSON.stringify(stored));
    sessionStorage.setItem(INDEX_KEY, JSON.stringify([id, ...retained]));
    return id;
  } catch {
    for (const oldId of retained.reverse()) {
      removeReport(oldId);
      try {
        sessionStorage.setItem(`${REPORT_PREFIX}${id}`, JSON.stringify(stored));
        sessionStorage.setItem(INDEX_KEY, JSON.stringify([id]));
        return id;
      } catch {}
    }
    throw new Error("This browser could not save the completed report. Storage may be full or disabled.");
  }
}

export function readAssistantReport(id: string): StoredAssistantReport | null {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(`${REPORT_PREFIX}${id}`) || "null");
    if (!parsed || typeof parsed !== "object") return null;
    const candidate = parsed as Partial<StoredAssistantReport>;
    if (candidate.version !== 1 || candidate.id !== id || !candidate.report) return null;
    if (!["website_audit", "accessibility_audit", "smoke_test"].includes(candidate.kind || "")) return null;
    return candidate as StoredAssistantReport;
  } catch {
    return null;
  }
}
