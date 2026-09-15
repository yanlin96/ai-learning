import assert from "node:assert/strict";
import test from "node:test";
import { workspaceCallback, isAuthenticationEntry } from "../lib/auth-routing.ts";

test("preserves local tool paths and query strings after login", () => {
  assert.equal(workspaceCallback('/website-audit?url=https%3A%2F%2Fexample.com'), '/website-audit?url=https%3A%2F%2Fexample.com');
  assert.equal(workspaceCallback('/smoke-test/history'), '/smoke-test/history');
  assert.equal(workspaceCallback('https://tools.example/smoke-test', 'https://tools.example'), '/smoke-test');
  assert.equal(workspaceCallback('https://evil.example/smoke-test', 'https://tools.example'), '/');
  assert.equal(workspaceCallback('/%6cogin'), '/');
});
test("rejects external redirects, login loops, invalid encodings and API destinations", () => {
  for (const path of [undefined, 'https://evil.example', '//evil.example', '/%2fevil.example', '/\\evil.example', '/login', '/train-login', '/api/auth/signin', '/api/audits', '/_next/static/x', '/%zz', '/%0aevil']) assert.equal(workspaceCallback(path), '/');
});
test("authentication exemptions are exact or scoped to the auth API", () => {
  for (const path of ['/login', '/train-login', '/api/auth', '/api/auth/callback/okta', '/api/auth/session']) assert.equal(isAuthenticationEntry(path), true);
  for (const path of ['/', '/login/tools', '/api/auth-other', '/api/audits', '/history', '/website-audit']) assert.equal(isAuthenticationEntry(path), false);
});
