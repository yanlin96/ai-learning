const { spawn } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const { chromium } = require('playwright-core');
const { encode } = require('next-auth/jwt');
const assert = require('node:assert/strict');

(async () => {
  const secret = randomBytes(32).toString('hex');
  const origin = 'http://localhost:3109';
  const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3109'], {
    cwd: process.cwd(), windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, CPA_TOOLS_BUILD_DIR: '.next-workspace-check', AUTH_SECRET: secret, AUTH_OKTA_ID: 'fixture', AUTH_OKTA_SECRET: 'fixture', AUTH_OKTA_ISSUER: 'https://example.invalid/oauth2/default', NEXTAUTH_URL: origin },
  });
  let browser;
  try {
    for (let i = 0; i < 60; i++) {
      try { if ((await fetch(origin + '/login')).ok) break; } catch {}
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.addCookies([{ name: 'next-auth.session-token', value: await encode({ secret, token: { sub: 'fixture', name: 'Test User', email: 'test@example.invalid' }, maxAge: 600 }), url: origin }]);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const requests = { session: 0, brief: 0, documents: 0 };
    page.on('request', request => { if (request.isNavigationRequest() && request.frame() === page.mainFrame()) requests.documents++; });
    await page.route('**/api/auth/session', route => { requests.session++; return route.fulfill({ json: { user: { name: 'Test User', email: 'test@example.invalid' } } }); });
    await page.route('**/api/daily-brief', route => { requests.brief++; return route.fulfill({ json: { weather: { tone: 'cloudy', temperature: 19, condition: 'Overcast', low: 14, high: 19 }, train: { requiresAuth: false, unavailable: false, count: 3, majorCount: 1 }, checkedAt: new Date().toISOString(), sources: { weather: 'https://open-meteo.com/' } } }); });
    await page.goto(origin + '/website-audit');
    await page.getByRole('button', { name: 'Check my website' }).waitFor();
    await page.getByRole('link', { name: 'Train line status' }).first().count();
    await page.waitForTimeout(700);
    const captures = [['website-audit', 'Website audit'], ['accessibility', 'Accessibility estimate'], ['smoke-test', 'Smoke testing'], ['history', 'Website audit history'], ['smoke-test/history', 'Smoke test history'], ['disruptions', 'Train line status']];
    for (const [path, title] of captures) {
      if (path !== 'website-audit') {
        const names = { accessibility: 'Accessibility', 'smoke-test': 'Smoke testing', history: 'Audit history', 'smoke-test/history': 'Smoke test history', disruptions: 'Train line status' };
        if (path === 'disruptions') await page.locator('aside[aria-label="Company tools"] details').last().evaluate(el => { el.open = true; });
        await page.locator('aside[aria-label="Company tools"]').getByRole('link', { name: names[path], exact: false }).click();
      }
      await page.getByRole('heading', { name: title, exact: true }).waitFor();
      await page.waitForTimeout(350);
      await page.evaluate(() => window.scrollTo(0, 0));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, path + ' desktop overflow');
      await page.screenshot({ path: '.impeccable/review/' + path.replaceAll('/', '-') + '-desktop.png', fullPage: true });
    }
    assert.equal(requests.documents, 1, 'client navigation should preserve document');
    assert.equal(requests.session, 1, 'account must not refetch on navigation');
    assert.equal(requests.brief, 1, 'daily brief must not refetch on navigation');
    const navigationRequests = { ...requests };
    await page.setViewportSize({ width: 390, height: 844 });
    for (const [path, title] of captures) {
      await page.goto(origin + '/' + path);
      await page.getByRole('heading', { name: title, exact: true }).waitFor();
      await page.waitForTimeout(300);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, path + ' mobile overflow');
      if (path === 'smoke-test') {
        const action = await page.getByRole('button', { name: 'Run smoke test', exact: true }).boundingBox();
        assert.ok(action && action.y + action.height <= 844, 'smoke action should be in first mobile viewport');
      }
      if (path === 'disruptions' && await page.getByRole('link', { name: 'Check official service updates' }).count()) {
        const recovery = await page.getByRole('link', { name: 'Check official service updates' }).boundingBox();
        assert.ok(recovery && recovery.y + recovery.height <= 844, 'train recovery should be in first mobile viewport');
      }
      await page.screenshot({ path: '.impeccable/review/' + path.replaceAll('/', '-') + '-mobile.png', fullPage: true });
    }
    const opener = page.getByRole('button', { name: 'Open company toolbox' });
    await opener.click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Close toolbox');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await dialog.evaluate(el => el.contains(document.activeElement)), true);
    await page.screenshot({ path: '.impeccable/review/toolbox-mobile.png', fullPage: true });
    await page.keyboard.press('Escape');
    assert.equal(await opener.evaluate(el => el === document.activeElement), true);
    await page.evaluate(() => {
      const pages = Array.from({ length: 25 }, (_, index) => ({ url: 'https://example.com/page-' + index, title: 'Synthetic test page ' + index, status: index === 0 ? 'fail' : 'pass', httpStatus: index === 0 ? 500 : 200, responseTimeMs: 250, browser: 'not-selected', source: 'sitemap', issues: index === 0 ? ['HTTP 500; inspect server logs'] : [] }));
      localStorage.setItem('smoke-test-history-v1', JSON.stringify([{ domain: 'example.com', runs: [{ id: 'fixture', checkedAt: '2026-09-16T00:00:00Z', result: 'fail', checked: 25, skipped: 2, requestedLimit: 30, browserChecked: 0, counts: { pass: 24, warning: 0, fail: 1 }, issueSamples: [], pages }] }]));
      sessionStorage.setItem('audit-history', JSON.stringify([{ id: 'fixture', url: 'https://example.com', title: 'Synthetic audit record', ranAt: '2026-09-16T00:00:00Z', seoScore: 84, aiScore: 91, brokenLinks: 0, linksChecked: 30, linksDiscovered: 35, findingsTotal: 0, severityCounts: { critical: 0, high: 0, medium: 0, low: 0 }, findings: [], notVerified: [], firstActions: [], coverage: { rendering: 'browser', seoConfidence: 'high', aiConfidence: 'medium', inconclusive: 1, unchecked: 5 } }]));
    });
    for (const path of ['history', 'smoke-test/history']) {
      await page.goto(origin + '/' + path);
      await page.locator('main article').first().waitFor();
      await page.locator('main details > summary').first().click();
      if (path.startsWith('smoke')) {
        await page.getByRole('button', { name: 'Next', exact: true }).click();
        assert.equal(await page.getByText('21–25 of 25', { exact: false }).count(), 1);
        await page.getByRole('button', { name: 'Previous', exact: true }).click();
        await page.locator('section[aria-label="URL results"] select').selectOption('fail');
        assert.equal(await page.locator('section[aria-label="URL results"] article').count(), 1);
      }
      await page.screenshot({ path: '.impeccable/review/' + path.replaceAll('/', '-') + '-filled-mobile.png', fullPage: true });
    }
    await page.goto(origin + '/smoke-test');
    await page.route('**/api/smoke-tests', async route => { await new Promise(resolve => setTimeout(resolve, 500)); await route.fulfill({ status: 502, json: { error: 'Synthetic upstream failure' } }); });
    await page.getByLabel('Website URL', { exact: true }).fill('https://example.com');
    await page.getByRole('button', { name: 'Run smoke test', exact: true }).click();
    await page.getByRole('button', { name: 'Running smoke test…' }).waitFor();
    assert.equal(await page.getByLabel('Website URL', { exact: true }).isDisabled(), true);
    await page.getByRole('alert').filter({ hasText: 'Synthetic upstream failure' }).waitFor();
    assert.match(await page.locator('main').getByRole('alert').innerText(), /try again/);
    await page.screenshot({ path: '.impeccable/review/smoke-error-mobile.png', fullPage: true });
    await page.unroute('**/api/smoke-tests');
    await page.route('**/api/smoke-tests', route => route.fulfill({ json: { report: { baseUrl: 'https://example.com', checkedAt: new Date().toISOString(), requestedLimit: 10, discovered: 1, checked: 1, skipped: 0, result: 'warning', counts: { pass: 0, warning: 1, fail: 0 }, sitemap: 'loaded', browserChecked: 0, browserLimit: 20, pages: [{ url: 'https://example.com', title: 'Synthetic smoke result', source: 'manual', status: 'warning', httpStatus: 200, responseTimeMs: 200, browser: 'not-run', issues: ['Missing page description'], browserIssues: [] }] } } }));
    await page.getByRole('button', { name: 'Run smoke test', exact: true }).click();
    await page.getByRole('heading', { name: 'PASS WITH WARNINGS' }).waitFor();
    await page.screenshot({ path: '.impeccable/review/smoke-result-mobile.png', fullPage: true });
    await page.goto(origin + '/website-audit');
    await page.route('**/api/audits', route => route.fulfill({ json: { report: { finalUrl: 'https://example.com', checkedAt: new Date().toISOString(), page: { title: 'Synthetic audit result', rendering: 'unavailable', javascriptDependencyPercent: null }, links: { discovered: 1, checked: 1, unchecked: 0, broken: [], successful: [], inconclusive: [] }, seo: { score: 84, rating: 'Good', confidence: 'medium', findings: [] }, aiVisibility: { score: 91, rating: 'Excellent', confidence: 'medium', findings: [], crawlers: [] }, qualityReport: { severityCounts: { critical: 0, high: 0, medium: 0, low: 0 }, findings: [], firstActions: [], quickWins: [], retestChecklist: [], verified: ['HTTP response checked'], notVerified: [], exclusionsApplied: [], contextualAnalysis: 'unavailable' }, summary: 'Synthetic preview only; not a real website assessment.' } } }));
    await page.getByLabel('Website URL', { exact: true }).fill('https://example.com');
    await page.getByRole('button', { name: 'Check my website' }).click();
    await page.getByRole('heading', { name: 'Synthetic audit result' }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'audit report mobile overflow');
    await page.screenshot({ path: '.impeccable/review/audit-result-mobile.png', fullPage: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({ path: '.impeccable/review/audit-result-desktop.png', fullPage: true });
    await page.goto(origin + '/accessibility');
    await page.route('**/api/accessibility-audits', route => route.fulfill({ json: { report: { finalUrl: 'https://example.com', checkedAt: new Date().toISOString(), page: { title: 'Synthetic accessibility result', status: 200, rendering: 'complete' }, estimate: { score: 86, rating: 'Good', confidence: 'high', findingsCount: 1, methodology: 'Synthetic estimate.' }, findings: [{ category: 'accessibility', severity: 'medium', confidence: 'high', element: 'Document language', evidence: 'The html element has no lang attribute.', impact: 'Screen readers may use the wrong pronunciation.', fix: 'Set lang on the html element.', owner: 'Engineering' }], severityCounts: { critical: 0, high: 0, medium: 1, low: 0 }, verified: ['Rendered DOM inspected.'], notVerified: ['Keyboard navigation and focus order.'] } } }));
    await page.getByLabel('Website URL', { exact: true }).fill('https://example.com');
    await page.getByRole('button', { name: 'Estimate accessibility', exact: true }).click();
    await page.getByRole('heading', { name: 'Synthetic accessibility result' }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'accessibility desktop overflow');
    await page.screenshot({ path: '.impeccable/review/accessibility-result-desktop.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'accessibility mobile overflow');
    await page.screenshot({ path: '.impeccable/review/accessibility-result-mobile.png', fullPage: true });
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: true, clientNavigationRequests: navigationRequests, captures: captures.length * 2 + 7, smokePaginationAndFilter: true, loadingAndError: true, mobileFocus: true, pageErrors: errors }));
  } finally { await browser?.close(); server.kill(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
