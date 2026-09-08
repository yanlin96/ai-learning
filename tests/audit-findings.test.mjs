import assert from "node:assert/strict";
import test from "node:test";
import {
  capContextualFinding,
  countBySeverity,
  firstActions,
  quickWins,
  sortFindings,
} from "../lib/audit-findings.ts";

const finding = (overrides) => ({
  category: "seo",
  severity: "low",
  confidence: "high",
  element: "Element",
  evidence: "Evidence",
  impact: "Impact",
  fix: "Fix",
  owner: "Content",
  ...overrides,
});

test("findings sort by severity first, then by confidence", () => {
  const sorted = sortFindings([
    finding({ severity: "low", element: "third" }),
    finding({ severity: "critical", element: "first" }),
    finding({ severity: "medium", confidence: "low", element: "medium-low" }),
    finding({ severity: "medium", confidence: "high", element: "medium-high" }),
  ]);
  assert.deepEqual(sorted.map((item) => item.element), ["first", "medium-high", "medium-low", "third"]);
});

test("severity counts cover every level, including the empty ones", () => {
  const counts = countBySeverity([finding({ severity: "high" }), finding({ severity: "high" })]);
  assert.deepEqual(counts, { critical: 0, high: 2, medium: 0, low: 0 });
});

test("model-sourced findings can never outrank a deterministic check", () => {
  const capped = capContextualFinding(finding({ severity: "critical", confidence: "high" }));
  assert.equal(capped.severity, "medium");
  assert.equal(capped.confidence, "medium");
  // Anything already below the cap is left alone.
  const untouched = capContextualFinding(finding({ severity: "low", confidence: "low" }));
  assert.equal(untouched.severity, "low");
  assert.equal(untouched.confidence, "low");
});

test("the first three actions cover different categories rather than repeating one", () => {
  const actions = firstActions([
    finding({ category: "broken-link", severity: "high", element: "Link A", fix: "Fix A" }),
    finding({ category: "broken-link", severity: "high", element: "Link B", fix: "Fix B" }),
    finding({ category: "accessibility", severity: "medium", element: "Alt text", fix: "Fix C" }),
    finding({ category: "expired-content", severity: "low", element: "Old date", fix: "Fix D" }),
  ]);
  assert.deepEqual(actions, ["Link A: Fix A", "Alt text: Fix C", "Old date: Fix D"]);
});

test("quick wins exclude low-confidence findings and crawler configuration", () => {
  const wins = quickWins([
    finding({ confidence: "low", fix: "Uncertain fix" }),
    finding({ category: "ai-visibility", fix: "robots.txt change" }),
    finding({ fix: "Add a meta description" }),
  ]);
  assert.deepEqual(wins, ["Add a meta description"]);
});
