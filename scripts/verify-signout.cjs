// Isolated Auth.js logout regression; uses synthetic identity, never a real Okta account.
const { spawn } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const { chromium } = require('playwright-core');
const { encode } = require('next-auth/jwt');
const assert = require('node:assert/strict');

(async () => {
  const secret = randomBytes(32).toString('hex');
  const origin = 'http://localhost:3110';
  const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3110'], {
    windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, CPA_TOOLS_BUILD_DIR: '.next-workspace-check', AUTH_SECRET: secret, AUTH_OKTA_ID: 'fixture', AUTH_OKTA_SECRET: 'fixture', AUTH_OKTA_ISSUER: 'https://example.invalid/oauth2/default', NEXTAUTH_URL: origin },
  });
  let browser;
  try {
    let ready = false;
    for (let i = 0; i < 60; i++) {
      try { if ((await fetch(origin + '/login')).ok) { ready = true; break; } } catch {}
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    assert.ok(ready, 'isolated server ready');
    browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.addCookies([{ name: 'next-auth.session-token', value: await encode({ secret, token: { sub: 'fixture', name: 'Test User', email: 'test@example.invalid' }, maxAge: 600 }), url: origin }]);
    const page = await context.newPage();
    let starts = 0;
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/auth/signin/okta', route => { starts++; return route.fulfill({ json: { url: origin + '/login?signedOut=1' } }); });
    await page.route('**/api/daily-brief', route => route.fulfill({ status: 503, json: {} }));
    await page.goto(origin + '/website-audit');
    await page.locator('header details').filter({ hasText: 'Test User' }).locator('summary').click();
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await page.getByRole('heading', { name: 'You’re signed out' }).waitFor();
    assert.equal(new URL(page.url()).searchParams.get('signedOut'), '1');
    await page.waitForTimeout(800);
    assert.equal(starts, 0, 'logout must not restart OAuth');
    assert.equal((await context.request.get(origin + '/api/auth/session')).status(), 200);
    assert.equal((await (await context.request.get(origin + '/api/auth/session')).json()).user, undefined);
    assert.equal((await context.request.post(origin + '/api/audits', { data: {} })).status(), 401);
    assert.equal((await context.request.post(origin + '/api/accessibility-audits', { data: {} })).status(), 401);
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: `.impeccable/review/signout-${width}.png`, fullPage: true });
    }
    await page.reload();
    await page.getByRole('heading', { name: 'You’re signed out' }).waitFor();
    await page.waitForTimeout(400);
    assert.equal(starts, 0, 'reload remains paused');
    await page.getByRole('button', { name: 'Continue with Okta' }).click();
    await page.waitForFunction(() => location.search.includes('signedOut=1'));
    await page.waitForTimeout(400);
    assert.equal(starts, 1, 'explicit restart');
    await page.goto(origin + '/smoke-test');
    await page.waitForTimeout(600);
    assert.equal(starts, 2, 'protected-page visit starts normal OAuth');
    await page.goto(origin + '/login?error=OAuthSignin');
    await page.getByRole('heading', { name: 'Sign-in did not finish' }).waitFor();
    await page.waitForTimeout(400);
    assert.equal(starts, 2, 'errors do not auto-retry');
    assert.deepEqual(errors, []);
    console.log('Signout verified: session cleared, APIs protected, paused reload, explicit restart, normal auto-login, error pause, desktop/mobile.');
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
