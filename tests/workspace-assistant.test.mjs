import test from "node:test";
import assert from "node:assert/strict";
import { interpretWorkspaceMessage, matchWorkspaceMessage, workspaceResultForIntent } from "../lib/workspace-assistant.ts";

test("a URL alone defaults to Website Audit", () => {
  const result = interpretWorkspaceMessage("https://example.com/path");
  assert.equal(result.action?.type, "run_website_audit");
  assert.match(result.action?.href || "", /^\/website-audit\?/);
  assert.match(result.action?.href || "", /run=1/);
});

test("a bare domain is normalized and starts Website Audit", () => {
  const result = interpretWorkspaceMessage("cpaaustralia.com.au/become-a-cpa");
  assert.equal(result.action?.type, "run_website_audit");
  assert.equal(result.action?.url, "https://cpaaustralia.com.au/become-a-cpa");
});

test("accessibility and smoke intents route to dedicated tools", () => {
  assert.equal(interpretWorkspaceMessage("Check accessibility for www.example.com").action?.type, "run_accessibility_audit");
  assert.equal(interpretWorkspaceMessage("https://www.nrma.com.au check the accessility").action?.type, "run_accessibility_audit");
  assert.equal(interpretWorkspaceMessage("对 https://example.com 跑冒烟测试").action?.type, "run_smoke_test");
});

test("run intents ask for a URL instead of inventing one", () => {
  const result = interpretWorkspaceMessage("Run a smoke test");
  assert.equal(result.action, undefined);
  assert.equal(result.nextIntent, "smoke_test");
  assert.match(result.reply, /Paste the public site URL/);
});

test("a follow-up URL keeps the previously requested tool intent", () => {
  const first = interpretWorkspaceMessage("Estimate accessibility");
  const second = interpretWorkspaceMessage("https://example.com", first.nextIntent);
  assert.equal(second.action?.type, "run_accessibility_audit");
  assert.equal(second.nextIntent, null);
});

test("history and train requests use local allow-listed destinations", () => {
  assert.equal(interpretWorkspaceMessage("show audit history").action?.href, "/history");
  assert.equal(interpretWorkspaceMessage("看看火车线路").action?.href, "/disruptions");
});

test("capability questions explain the supported workspace surface", () => {
  const result = interpretWorkspaceMessage("你能做什么？");
  assert.equal(result.action, undefined);
  assert.match(result.reply, /Website Audit/);
  assert.match(result.reply, /Smoke Test/i);
});

test("ambiguous natural language is left for semantic classification", () => {
  assert.equal(matchWorkspaceMessage("Could a keyboard-only visitor use https://example.com comfortably?"), null);
  const classified = workspaceResultForIntent("accessibility_audit", "https://example.com/");
  assert.equal(classified.action?.type, "run_accessibility_audit");
});
