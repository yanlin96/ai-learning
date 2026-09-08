import assert from "node:assert/strict";
import test from "node:test";
import { evaluateSmokeSignals } from "../lib/smoke-rules.ts";

const healthy = {
  httpStatus: 200,
  contentType: "text/html; charset=utf-8",
  title: "Member centre",
  h1Count: 1,
  noindex: false,
  errorText: null,
  redirected: false,
};

test("a healthy HTML page passes", () => {
  assert.deepEqual(evaluateSmokeSignals(healthy), { status: "pass", issues: [] });
});

test("HTTP errors and visible application errors fail the release check", () => {
  assert.equal(evaluateSmokeSignals({ ...healthy, httpStatus: 500 }).status, "fail");
  assert.equal(evaluateSmokeSignals({ ...healthy, errorText: "application error" }).status, "fail");
});

test("metadata and redirect defects warn without blocking the release", () => {
  const result = evaluateSmokeSignals({ ...healthy, title: "", h1Count: 0, noindex: true, redirected: true });
  assert.equal(result.status, "warning");
  assert.deepEqual(result.issues, ["Missing page title", "Missing H1", "Page is marked noindex", "URL redirected"]);
});

test("a request failure is always a failure", () => {
  const result = evaluateSmokeSignals({ ...healthy, httpStatus: null, requestError: "Timed out" });
  assert.deepEqual(result, { status: "fail", issues: ["Timed out"] });
});
