import assert from "node:assert/strict";
import test from "node:test";
import { auditContentFreshness, extractDates } from "../lib/content-freshness.ts";

const NOW = new Date("2026-10-01T00:00:00Z");

test("dates are parsed in the formats a publisher actually writes", () => {
  const hits = extractDates("Ends 11 September 2026, or September 11, 2026, or 2026-09-11, or 11/09/2026.");
  assert.equal(hits.length, 4);
  for (const hit of hits) {
    assert.equal(hit.date.toISOString().slice(0, 10), "2026-09-11");
  }
});

test("impossible dates are rejected rather than guessed", () => {
  assert.equal(extractDates("31 February 2026").length, 0);
  assert.equal(extractDates("Version 1.2 build 4096").length, 0);
});

test("a passed deadline with expiry wording is a high-confidence, high-severity finding", () => {
  const { findings } = auditContentFreshness("Sale must end 11 September 2026.", "https://example.com/pd", NOW);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].category, "expired-content");
  assert.equal(findings[0].severity, "high");
  assert.equal(findings[0].confidence, "high");
  assert.match(findings[0].evidence, /11 September 2026/);
});

test("a past date with no expiry wording stays low severity so archives are not flagged as defects", () => {
  const { findings } = auditContentFreshness(
    "The 2019 report was published on 14 March 2019.",
    "https://example.com/reports",
    NOW,
  );
  assert.equal(findings.length, 1);
  assert.equal(findings[0].severity, "low");
  assert.equal(findings[0].confidence, "low");
  assert.match(findings[0].impact, /legitimate historical references/);
});

test("archive URLs downgrade severity and record which rule matched", () => {
  const { findings, exclusionsApplied } = auditContentFreshness(
    "Sale must end 11 September 2026.",
    "https://example.com/archive/campaigns",
    NOW,
  );
  assert.deepEqual(exclusionsApplied, ["/archive"]);
  assert.equal(findings[0].severity, "medium");
  assert.match(findings[0].note, /archive exclusion rule/);
});

test("caller-supplied exclusion patterns are honoured alongside the defaults", () => {
  const { exclusionsApplied } = auditContentFreshness(
    "Sale must end 11 September 2026.",
    "https://example.com/member-library/2019",
    NOW,
    ["/member-library"],
  );
  assert.deepEqual(exclusionsApplied, ["/member-library"]);
});

test("a stale copyright year is reported and future deadlines are not", () => {
  const stale = auditContentFreshness("© 2019 Example Ltd", "https://example.com/", NOW);
  assert.equal(stale.findings.length, 1);
  assert.equal(stale.findings[0].element, "Copyright year");

  const future = auditContentFreshness("Register by 30 June 2030.", "https://example.com/", NOW);
  assert.equal(future.findings.length, 0);
});
