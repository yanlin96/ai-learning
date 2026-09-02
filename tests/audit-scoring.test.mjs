import assert from "node:assert/strict";
import test from "node:test";
import { scoreAiVisibility, scoreSeo } from "../lib/audit-scoring.ts";

test("SEO scoring gives critical indexability more weight than minor metadata", () => {
  const base = { noindex: false, titleLength: 35, descriptionLength: 120, h1Count: 1, hasCanonical: true, imageCount: 0, missingAlt: 0, brokenInternal: 0, brokenExternal: 0, renderingComplete: true, robotsKnown: true, linksDiscovered: 10, linksChecked: 10 };
  assert.equal(scoreSeo(base).score, 100);
  assert.equal(scoreSeo({ ...base, descriptionLength: 0 }).score, 94);
  assert.equal(scoreSeo({ ...base, noindex: true }).score, 65);
});

test("broken internal links cost more than broken external links", () => {
  const base = { noindex: false, titleLength: 35, descriptionLength: 120, h1Count: 1, hasCanonical: true, imageCount: 0, missingAlt: 0, brokenInternal: 0, brokenExternal: 0, renderingComplete: true, robotsKnown: true, linksDiscovered: 10, linksChecked: 10 };
  assert.equal(scoreSeo({ ...base, brokenInternal: 1 }).score, 94);
  assert.equal(scoreSeo({ ...base, brokenExternal: 1 }).score, 98);
});

test("GPTBot training permission does not lower AI search visibility score", () => {
  const crawlers = [
    { name: "OAI-SearchBot", robotsAllowed: true, accessible: true },
    { name: "GPTBot", robotsAllowed: false, accessible: false },
    { name: "ChatGPT-User", robotsAllowed: true, accessible: true },
    { name: "ClaudeBot", robotsAllowed: true, accessible: true },
    { name: "PerplexityBot", robotsAllowed: true, accessible: true },
  ];
  const result = scoreAiVisibility({ noindex: false, crawlers, javascriptDependencyPercent: 0, rawTextLength: 500, hasStructuredData: true, renderingComplete: true, linksDiscovered: 5, linksChecked: 5 });
  assert.equal(result.score, 100);
});

test("incomplete evidence lowers confidence", () => {
  const result = scoreSeo({ noindex: false, titleLength: 35, descriptionLength: 120, h1Count: 1, hasCanonical: true, imageCount: 0, missingAlt: 0, brokenInternal: 0, brokenExternal: 0, renderingComplete: false, robotsKnown: false, linksDiscovered: 100, linksChecked: 30 });
  assert.equal(result.confidence, "low");
});
