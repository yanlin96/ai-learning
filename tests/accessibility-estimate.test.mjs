import assert from "node:assert/strict";
import test from "node:test";
import * as cheerio from "cheerio";
import { auditAccessibility } from "../lib/accessibility-audit.ts";
import { scoreAccessibility } from "../lib/audit-scoring.ts";
import { chooseAccessibilityMarkup, detectAutomatedAccessBlock } from "../lib/accessibility-page-state.ts";

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

test("access-control responses are detected without treating ordinary page copy as a block", () => {
  assert.equal(detectAutomatedAccessBlock("<html><head><title>Access Denied</title></head><body>Reference #18</body></html>").blocked, true);
  assert.equal(detectAutomatedAccessBlock("<html><head><title>Home</title></head><body>The request could not be satisfied.</body></html>").blocked, true);
  const article = `<html><head><title>Security guidance</title></head><body>${"Useful public guidance. ".repeat(1_100)} A user may see access denied when permissions are missing.</body></html>`;
  assert.equal(detectAutomatedAccessBlock(article).blocked, false);
});

test("blocked browser rendering falls back to initial HTML with reduced evidence", () => {
  const initialHtml = "<html><head><title>Real page</title></head><body><h1>Welcome</h1></body></html>";
  const result = chooseAccessibilityMarkup({
    initialHtml,
    rendered: { html: "<html><head><title>Access Denied</title></head><body>Request blocked</body></html>", status: 403 },
  });
  assert.equal(result.html, initialHtml);
  assert.equal(result.rendering, "blocked");
  assert.match(result.renderingNote, /initial HTML only/i);
});

test("a successful browser render can recover from a blocked initial response", () => {
  const renderedHtml = "<html><head><title>Real page</title></head><body><h1>Welcome</h1></body></html>";
  const result = chooseAccessibilityMarkup({
    initialHtml: "Forbidden",
    initialStatus: 403,
    rendered: { html: renderedHtml, status: 200 },
  });
  assert.equal(result.html, renderedHtml);
  assert.equal(result.rendering, "complete");
});

test("no score is produced when both retrieval paths are blocked", () => {
  assert.throws(() => chooseAccessibilityMarkup({
    initialHtml: "Forbidden",
    initialStatus: 403,
    rendered: { html: "<html><head><title>Forbidden</title></head><body>Request blocked</body></html>", status: 403 },
  }), /Unable to assess/);
});
