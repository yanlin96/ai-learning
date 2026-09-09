import type { SmokeTestReport } from "@/lib/smoke-test";
import type { SmokeStatus } from "@/lib/smoke-rules";

const STORAGE_KEY = "smoke-test-history-v1";
export const MAX_SMOKE_DOMAINS = 10;
export const MAX_RUNS_PER_DOMAIN = 10;

export type SmokeHistoryRun = {
  id: string;
  checkedAt: string;
  result: SmokeStatus;
  checked: number;
  skipped: number;
  requestedLimit: number;
  browserChecked: number;
  counts: Record<SmokeStatus, number>;
  issueSamples: Array<{ url: string; status: SmokeStatus; issues: string[] }>;
};

export type SmokeDomainHistory = {
  domain: string;
  lastRunAt: string;
  runs: SmokeHistoryRun[];
};

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function summariseSmokeRun(report: SmokeTestReport): SmokeHistoryRun {
  return {
    id: newId(),
    checkedAt: report.checkedAt,
    result: report.result,
    checked: report.checked,
    skipped: report.skipped,
    requestedLimit: report.requestedLimit,
    browserChecked: report.browserChecked,
    counts: report.counts,
    issueSamples: report.pages
      .filter((page) => page.status !== "pass")
      .slice(0, 10)
      .map((page) => ({ url: page.url, status: page.status, issues: [...page.issues, ...page.browserIssues].slice(0, 4) })),
  };
}

export function mergeSmokeHistory(
  current: SmokeDomainHistory[],
  domain: string,
  run: SmokeHistoryRun,
): SmokeDomainHistory[] {
  const normalized = domain.toLowerCase();
  const existing = current.find((group) => group.domain.toLowerCase() === normalized);
  const group: SmokeDomainHistory = {
    domain: normalized,
    lastRunAt: run.checkedAt,
    runs: [run, ...(existing?.runs || [])].slice(0, MAX_RUNS_PER_DOMAIN),
  };
  return [group, ...current.filter((item) => item.domain.toLowerCase() !== normalized)]
    .sort((a, b) => Date.parse(b.lastRunAt) - Date.parse(a.lastRunAt))
    .slice(0, MAX_SMOKE_DOMAINS);
}

export function readSmokeHistory(): SmokeDomainHistory[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed as SmokeDomainHistory[] : [];
  } catch {
    return [];
  }
}

export function recordSmokeRun(report: SmokeTestReport) {
  try {
    const domain = new URL(report.baseUrl).hostname;
    const next = mergeSmokeHistory(readSmokeHistory(), domain, summariseSmokeRun(report));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    return readSmokeHistory();
  }
}

export function removeSmokeDomain(domain: string) {
  try {
    const next = readSmokeHistory().filter((group) => group.domain !== domain);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    return readSmokeHistory();
  }
}

export function clearSmokeHistory() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}
