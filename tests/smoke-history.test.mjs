import assert from "node:assert/strict";
import test from "node:test";
import { MAX_RUNS_PER_DOMAIN, MAX_SMOKE_DOMAINS, mergeSmokeHistory } from "../lib/smoke-history.ts";

const run = (index) => ({
  id: String(index), checkedAt: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
  result: "pass", checked: 10, skipped: 0, requestedLimit: 10, browserChecked: 2,
  counts: { pass: 10, warning: 0, fail: 0 }, issueSamples: [],
});

test("runs are grouped by normalized domain", () => {
  let history = mergeSmokeHistory([], "Example.COM", run(1));
  history = mergeSmokeHistory(history, "example.com", run(2));
  assert.equal(history.length, 1);
  assert.equal(history[0].domain, "example.com");
  assert.deepEqual(history[0].runs.map((item) => item.id), ["2", "1"]);
});

test("history retains at most ten recent domains", () => {
  let history = [];
  for (let index = 0; index < MAX_SMOKE_DOMAINS + 2; index += 1) {
    history = mergeSmokeHistory(history, `domain-${index}.example`, run(index));
  }
  assert.equal(history.length, MAX_SMOKE_DOMAINS);
  assert.equal(history[0].domain, "domain-11.example");
  assert.equal(history.at(-1).domain, "domain-2.example");
});

test("each domain retains at most ten recent runs", () => {
  let history = [];
  for (let index = 0; index < MAX_RUNS_PER_DOMAIN + 2; index += 1) {
    history = mergeSmokeHistory(history, "example.com", run(index));
  }
  assert.equal(history[0].runs.length, MAX_RUNS_PER_DOMAIN);
  assert.equal(history[0].runs[0].id, "11");
});
