import assert from "node:assert/strict";
import test from "node:test";
import * as cheerio from "cheerio";
import { auditAccessibility } from "../lib/accessibility-audit.ts";
import { scoreAccessibility } from "../lib/audit-scoring.ts";

test("accessible-name overrides prevent generic-link false positives", () => {
  const $ = cheerio.load(`<!doctype html><html lang="en-AU"><body>
    <h1>Services</h1>
    <span id="membership-label">Read about membership</span>
    <a href="/membership" aria-label="Read about membership">Read more</a>
    <a href="/support" aria-labelledby="membership-label">More</a>
  </body></html>`);
  const findings = auditAccessibility($);
  assert.equal(findings.some((finding) => finding.element === "Non-descriptive call-to-action labels"), false);
  assert.equal(scoreAccessibility(findings, true).score, 100);
});

test("deterministic DOM findings feed the accessibility estimate", () => {
  const $ = cheerio.load("<!doctype html><html><body><img src='member.jpg'><button></button></body></html>");
  const findings = auditAccessibility($);
  assert.ok(findings.some((finding) => finding.element === "Images without an alt attribute"));
  assert.ok(findings.some((finding) => finding.element === "Buttons with no accessible name"));
  assert.ok(scoreAccessibility(findings, true).score < 75);
});
