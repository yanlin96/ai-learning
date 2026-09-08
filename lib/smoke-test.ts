import "server-only";

import { existsSync } from "node:fs";
import * as cheerio from "cheerio";
import type { Browser } from "playwright-core";
import { assertPublicUrl, normalizePublicUrl, safePublicFetch } from "@/lib/public-web";
import { evaluateSmokeSignals, type SmokeStatus } from "@/lib/smoke-rules";

const MAX_URLS = 100;
const CONCURRENCY = 12;
const REQUEST_TIMEOUT_MS = 3_500;
const HTTP_BUDGET_MS = 24_000;
const RUN_BUDGET_MS = 52_000;
const MAX_BROWSER_PAGES = 20;
const BROWSER_CONCURRENCY = 4;
const BROWSER_TIMEOUT_MS = 6_000;
const MAX_HTML_LENGTH = 1_000_000;
const ERROR_PATTERNS = [
  "internal server error",
  "application error",
  "something went wrong",
  "service unavailable",
  "this page isn’t working",
  "this page isn't working",
];

export type SmokePageResult = {
  url: string;
  finalUrl?: string;
  source: "manual" | "sitemap";
  status: SmokeStatus;
  httpStatus: number | null;
  responseTimeMs: number | null;
  title: string;
  h1Count: number;
  issues: string[];
  browser: "verified" | "failed" | "unavailable" | "not-run";
  browserIssues: string[];
};

export type SmokeTestReport = {
  baseUrl: string;
  checkedAt: string;
  requestedLimit: number;
  discovered: number;
  checked: number;
  skipped: number;
  result: SmokeStatus;
  counts: Record<SmokeStatus, number>;
  pages: SmokePageResult[];
  sitemap: "loaded" | "missing" | "failed";
  browserChecked: number;
  browserLimit: number;
};

function parseManualUrls(baseUrl: URL, values: string[]) {
  const urls: URL[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const url = /^https?:\/\//i.test(trimmed) ? normalizePublicUrl(trimmed) : new URL(trimmed, baseUrl);
    url.hash = "";
    if (url.origin !== baseUrl.origin) throw new Error(`Manual URL must belong to ${baseUrl.origin}: ${trimmed}`);
    urls.push(url);
  }
  return urls;
}

function sitemapLocations(xml: string) {
  const $ = cheerio.load(xml, { xmlMode: true });
  return $("loc").map((_, element) => $(element).text().trim()).get().filter(Boolean);
}

async function loadSitemap(baseUrl: URL) {
  try {
    const sitemapUrl = new URL("/sitemap.xml", baseUrl);
    const response = await safePublicFetch(sitemapUrl, { headers: { accept: "application/xml,text/xml,*/*" } }, 0, 6_000);
    if (response.status === 404) return { status: "missing" as const, urls: [] as URL[] };
    if (!response.ok) return { status: "failed" as const, urls: [] as URL[] };
    const xml = (await response.text()).slice(0, 2_000_000);
    const $ = cheerio.load(xml, { xmlMode: true });
    let locations = sitemapLocations(xml);
    if ($("sitemapindex").length) {
      const children = locations.slice(0, 5);
      const nested = await Promise.all(children.map(async (location) => {
        try {
          const child = new URL(location, baseUrl);
          if (child.origin !== baseUrl.origin) return [];
          const childResponse = await safePublicFetch(child, { headers: { accept: "application/xml,text/xml,*/*" } }, 0, 6_000);
          return childResponse.ok ? sitemapLocations((await childResponse.text()).slice(0, 2_000_000)) : [];
        } catch { return []; }
      }));
      locations = nested.flat();
    }
    const urls = locations.flatMap((location) => {
      try {
        const url = new URL(location, baseUrl);
        url.hash = "";
        return url.origin === baseUrl.origin && ["http:", "https:"].includes(url.protocol) ? [url] : [];
      } catch { return []; }
    });
    return { status: "loaded" as const, urls };
  } catch {
    return { status: "failed" as const, urls: [] as URL[] };
  }
}

async function inspectPage(url: URL, source: "manual" | "sitemap"): Promise<SmokePageResult> {
  const started = performance.now();
  try {
    const response = await safePublicFetch(url, {}, 0, REQUEST_TIMEOUT_MS);
    const responseTimeMs = Math.round(performance.now() - started);
    const contentType = response.headers.get("content-type") || "";
    const html = contentType.includes("text/html") ? (await response.text()).slice(0, MAX_HTML_LENGTH) : "";
    const $ = cheerio.load(html);
    $("script,style,noscript,template,svg").remove();
    const visibleText = $("body").text().replace(/\s+/g, " ").trim().toLowerCase();
    const errorText = ERROR_PATTERNS.find((pattern) => visibleText.includes(pattern)) || null;
    const finalUrl = response.url || url.href;
    const signals = {
      httpStatus: response.status,
      contentType,
      title: $("title").first().text().trim(),
      h1Count: $("h1").length,
      noindex: /(?:^|,)\s*noindex\b/i.test($("meta[name=robots]").attr("content") || "") || response.headers.get("x-robots-tag")?.includes("noindex") === true,
      errorText,
      redirected: finalUrl !== url.href,
    };
    const evaluation = evaluateSmokeSignals(signals);
    return { url: url.href, finalUrl, source, status: evaluation.status, httpStatus: response.status, responseTimeMs, title: signals.title, h1Count: signals.h1Count, issues: evaluation.issues, browser: "not-run", browserIssues: [] };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    const evaluation = evaluateSmokeSignals({ httpStatus: null, contentType: "", title: "", h1Count: 0, noindex: false, errorText: null, redirected: false, requestError: message });
    return { url: url.href, source, status: evaluation.status, httpStatus: null, responseTimeMs: null, title: "", h1Count: 0, issues: evaluation.issues, browser: "not-run", browserIssues: [] };
  }
}

function localChromePath() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  const roots = [process.env.PROGRAMFILES, process.env["PROGRAMFILES(X86)"], process.env.LOCALAPPDATA].filter(Boolean);
  const suffixes = ["Google\\Chrome\\Application\\chrome.exe", "Microsoft\\Edge\\Application\\msedge.exe"];
  for (const root of roots) for (const suffix of suffixes) {
    const candidate = `${root}\\${suffix}`;
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

async function launchBrowser(): Promise<Browser> {
  const [{ chromium: playwrightChromium }, sparticuz] = await Promise.all([
    import("playwright-core"),
    import("@sparticuz/chromium"),
  ]);
  const executablePath = process.env.VERCEL ? await sparticuz.default.executablePath() : localChromePath();
  if (!executablePath) throw new Error("No Chrome or Edge executable is available");
  return playwrightChromium.launch({
    executablePath,
    headless: true,
    args: process.env.VERCEL ? sparticuz.default.args : [],
  });
}

function worseStatus(current: SmokeStatus, next: SmokeStatus): SmokeStatus {
  const rank = { pass: 0, warning: 1, fail: 2 };
  return rank[next] > rank[current] ? next : current;
}

async function inspectInBrowser(browser: Browser, result: SmokePageResult) {
  const page = await browser.newPage();
  const browserIssues: string[] = [];
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const failedCriticalResources: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    if (["script", "stylesheet"].includes(request.resourceType())) failedCriticalResources.push(request.url());
  });
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (["font", "image", "media"].includes(request.resourceType())) return route.abort("blockedbyclient");
    try {
      const requestUrl = new URL(request.url());
      if (!["http:", "https:"].includes(requestUrl.protocol)) return route.continue();
      await assertPublicUrl(requestUrl);
      return route.continue();
    } catch {
      return route.abort("blockedbyclient");
    }
  });
  try {
    const response = await page.goto(result.url, { waitUntil: "domcontentloaded", timeout: BROWSER_TIMEOUT_MS });
    await page.waitForTimeout(400);
    const bodyText = (await page.locator("body").innerText().catch(() => "")).replace(/\s+/g, " ").trim();
    const lowerText = bodyText.toLowerCase();
    const visibleError = ERROR_PATTERNS.find((pattern) => lowerText.includes(pattern));
    if (!response) browserIssues.push("Browser navigation returned no document response");
    else if (response.status() >= 400) browserIssues.push(`Browser received HTTP ${response.status()}`);
    if (!bodyText) browserIssues.push("Rendered page body is empty");
    if (visibleError) browserIssues.push(`Rendered error text: “${visibleError}”`);
    if (pageErrors.length) browserIssues.push(`${pageErrors.length} uncaught page error${pageErrors.length === 1 ? "" : "s"}`);
    if (failedCriticalResources.length) browserIssues.push(`${failedCriticalResources.length} script or stylesheet request${failedCriticalResources.length === 1 ? "" : "s"} failed`);
    if (consoleErrors.length) browserIssues.push(`${consoleErrors.length} console error${consoleErrors.length === 1 ? "" : "s"}`);
    const blocking = !response || (response?.status() || 0) >= 400 || !bodyText || Boolean(visibleError) || pageErrors.length > 0;
    const browserStatus: SmokeStatus = blocking ? "fail" : browserIssues.length ? "warning" : "pass";
    result.browser = browserStatus === "fail" ? "failed" : "verified";
    result.browserIssues = browserIssues;
    result.status = worseStatus(result.status, browserStatus);
  } catch (error) {
    result.browser = "failed";
    result.browserIssues = [error instanceof Error ? error.message : "Browser navigation failed"];
    result.status = "fail";
  } finally {
    await page.close();
  }
}

export async function runSmokeTest(input: { baseUrl: string; manualUrls?: string[]; limit?: number }): Promise<SmokeTestReport> {
  const baseUrl = normalizePublicUrl(input.baseUrl);
  baseUrl.hash = "";
  const requestedLimit = Math.max(1, Math.min(MAX_URLS, Math.floor(input.limit || 20)));
  const manual = parseManualUrls(baseUrl, input.manualUrls || []);
  const sitemap = await loadSitemap(baseUrl);
  const candidates = new Map<string, { url: URL; source: "manual" | "sitemap" }>();
  candidates.set(baseUrl.href, { url: baseUrl, source: "manual" });
  for (const url of manual) candidates.set(url.href, { url, source: "manual" });
  for (const url of sitemap.urls) if (!candidates.has(url.href)) candidates.set(url.href, { url, source: "sitemap" });
  const selected = [...candidates.values()].slice(0, requestedLimit);
  const pages: SmokePageResult[] = [];
  let cursor = 0;
  const startedAt = Date.now();
  const deadline = startedAt + HTTP_BUDGET_MS;
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, selected.length) }, async () => {
    while (cursor < selected.length && Date.now() < deadline) {
      const candidate = selected[cursor++];
      pages.push(await inspectPage(candidate.url, candidate.source));
    }
  }));
  const browserCandidates = pages
    .filter((page) => page.source === "manual" || page.status !== "pass")
    .slice(0, MAX_BROWSER_PAGES);
  let browserChecked = 0;
  if (browserCandidates.length && Date.now() < startedAt + RUN_BUDGET_MS) {
    try {
      const browser = await launchBrowser();
      try {
        let browserCursor = 0;
        await Promise.all(Array.from({ length: Math.min(BROWSER_CONCURRENCY, browserCandidates.length) }, async () => {
          while (browserCursor < browserCandidates.length && Date.now() < startedAt + RUN_BUDGET_MS) {
            const page = browserCandidates[browserCursor++];
            await inspectInBrowser(browser, page);
            browserChecked += 1;
          }
        }));
      } finally {
        await browser.close();
      }
    } catch {
      for (const page of browserCandidates) page.browser = "unavailable";
    }
  }
  pages.sort((a, b) => ({ fail: 0, warning: 1, pass: 2 })[a.status] - ({ fail: 0, warning: 1, pass: 2 })[b.status]);
  const counts = { pass: 0, warning: 0, fail: 0 };
  for (const page of pages) counts[page.status] += 1;
  const result: SmokeStatus = counts.fail ? "fail" : counts.warning ? "warning" : "pass";
  return {
    baseUrl: baseUrl.href,
    checkedAt: new Date().toISOString(),
    requestedLimit,
    discovered: candidates.size,
    checked: pages.length,
    skipped: Math.max(0, candidates.size - pages.length),
    result,
    counts,
    pages,
    sitemap: sitemap.status,
    browserChecked,
    browserLimit: MAX_BROWSER_PAGES,
  };
}
