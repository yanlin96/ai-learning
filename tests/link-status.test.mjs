import assert from "node:assert/strict";
import test from "node:test";
import { classifyLinkStatus } from "../lib/link-status.ts";

test("successful responses are healthy links", () => {
  assert.equal(classifyLinkStatus(200, true), "ok");
  assert.equal(classifyLinkStatus(301, true), "ok");
});

test("missing responses and bot rejection statuses are inconclusive", () => {
  assert.equal(classifyLinkStatus(null, false), "inconclusive");
  assert.equal(classifyLinkStatus(403, false), "inconclusive");
  assert.equal(classifyLinkStatus(429, false), "inconclusive");
});

test("confirmed HTTP failures remain broken", () => {
  assert.equal(classifyLinkStatus(404, false), "broken");
  assert.equal(classifyLinkStatus(410, false), "broken");
  assert.equal(classifyLinkStatus(500, false), "broken");
});
