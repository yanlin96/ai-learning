import assert from "node:assert/strict";
import test from "node:test";
import { summariseRun, readAuditHistory, recordAuditRun } from "../lib/audit-history.ts";

const finding = { category: "seo", severity: "high", confidence: "high", element: "Page title", evidence: "Title is missing", impact: "Unclear search result", fix: "Add a descriptive title", owner: "Web Publishing" };
const report = {
  finalUrl: "https://example.com/contact", checkedAt: "2026-09-15T00:00:00Z",
  page: { title: "Contact", rendering: "unavailable" },
  seo: { score: 60, confidence: "low" }, aiVisibility: { score: 80, confidence: "medium" },
  links: { checked: 80, discovered: 100, unchecked: 20, broken: [], inconclusive: [{}] },
  qualityReport: { findings: [finding], severityCounts: { critical: 0, high: 1, medium: 0, low: 0 }, firstActions: ["Add a title"], notVerified: ["Browser unavailable"], contextualAnalysis: "unavailable" },
};

test("audit history captures evidence, fixes, priority actions and incomplete coverage", () => {
  const summary = summariseRun(report);
  assert.deepEqual(summary.findings, [finding]);
  assert.notEqual(summary.findings[0], finding);
  assert.deepEqual(summary.firstActions, ["Add a title"]);
  assert.deepEqual(summary.notVerified, ["Browser unavailable"]);
  assert.equal(summary.coverage.unchecked, 20);
  assert.equal(summary.coverage.inconclusive, 1);
  assert.equal(summary.coverage.rendering, "unavailable");
});

test("legacy scores remain readable and saving failure preserves existing history", () => {
  const legacy = [{ id: "old", url: report.finalUrl, ranAt: "2026-09-14T00:00:00Z" }];
  globalThis.sessionStorage = { getItem: () => JSON.stringify(legacy), setItem: () => { throw new Error("Quota exceeded"); } };
  try {
    assert.equal(readAuditHistory()[0].findings, undefined);
    assert.deepEqual(recordAuditRun(report), legacy);
  } finally { delete globalThis.sessionStorage; }
});
