import "server-only";

import { lookup } from "node:dns/promises";
import { existsSync } from "node:fs";
import { isIP } from "node:net";
import * as cheerio from "cheerio";
import { isCrawlerAllowed } from "@/lib/robots";
import { scoreAiVisibility, scoreSeo, type AuditScore } from "@/lib/audit-scoring";

const MAX_LINKS = 30;
const FETCH_TIMEOUT_MS = 12_000;
const MAX_HTML_LENGTH = 2_000_000;

export type AuditFinding = {
  level: "pass" | "warning" | "error" | "info";
  title: string;
  detail: string;
};

export type LinkResult = {
  url: string;
  finalUrl?: string;
  text: string;
  internal: boolean;
  source: "initial" | "rendered" | "both";
  status: number | null;
  ok: boolean;
  redirected: boolean;
  error?: string;
};

export type CrawlerResult = {
  name: string;
  purpose: string;
  robotsAllowed: boolean | null;
  httpStatus: number | null;
  accessible: boolean;
  requestError?: string;
};

export type WebsiteAudit = {
  url: string;
  finalUrl: string;
  checkedAt: string;
  page: {
    status: number;
    title: string;
    description: string;
    canonical: string | null;
    rawTextLength: number;
    renderedTextLength: number | null;
    javascriptDependencyPercent: number | null;
    rendering: "complete" | "unavailable";
    renderingNote?: string;
  };
  links: {
    discovered: number;
    checked: number;
    broken: LinkResult[];
    redirects: LinkResult[];
  };
  seo: AuditScore & {
    findings: AuditFinding[];
  };
  aiVisibility: AuditScore & {
    findings: AuditFinding[];
    crawlers: CrawlerResult[];
    indexingVerified: false;
  };
  summary?: string;
};

const CRAWLERS = [
  { name: "OAI-SearchBot", purpose: "ChatGPT search visibility" },
  { name: "GPTBot", purpose: "OpenAI model training crawl" },
  { name: "ChatGPT-User", purpose: "User-triggered ChatGPT visit" },
  { name: "ClaudeBot", purpose: "Anthropic crawler" },
  { name: "PerplexityBot", purpose: "Perplexity search crawler" },
];

function isPrivateIp(address: string) {
  if (isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
  }
  const value = address.toLowerCase();
  return value === "::1" || value === "::" || value.startsWith("fc") ||
    value.startsWith("fd") || value.startsWith("fe8") || value.startsWith("fe9") ||
    value.startsWith("fea") || value.startsWith("feb") || value.startsWith("::ffff:127.") ||
    value.startsWith("::ffff:10.") || value.startsWith("::ffff:192.168.");
}

export function normalizeAuditUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Enter a website URL");
  return new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
}

async function assertPublicUrl(url: URL) {
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error("Only HTTP and HTTPS URLs are supported");
  if (url.username || url.password) throw new Error("URLs containing credentials are not supported");
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) {
    throw new Error("Local and private network addresses are not allowed");
  }
  const addresses = await lookup(host, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) {
    throw new Error("Local and private network addresses are not allowed");
  }
}

async function safeFetch(url: URL, init: RequestInit = {}, redirects = 0): Promise<Response> {
  if (redirects > 5) throw new Error("Too many redirects");
  await assertPublicUrl(url);
  const response = await fetch(url, {
    ...init,
    redirect: "manual",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      "user-agent": "LineWatchWebsiteAudit/1.0",
      accept: "text/html,application/xhtml+xml,*/*;q=0.8",
      ...init.headers,
    },
  });
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    const location = response.headers.get("location");
    if (!location) return response;
    return safeFetch(new URL(location, url), init, redirects + 1);
  }
  return response;
}

function visibleTextLength(html: string) {
  const $ = cheerio.load(html);
  $("script,style,noscript,template,svg").remove();
  return $("body").text().replace(/\s+/g, " ").trim().length;
}

type LinkCandidate = {
  url: URL;
  text: string;
  source: "initial" | "rendered" | "both";
};

function collectLinks(html: string, baseUrl: URL, source: "initial" | "rendered") {
  const links = new Map<string, LinkCandidate>();
  const $ = cheerio.load(html);
  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href) return;
    try {
      const url = new URL(href, baseUrl);
      url.hash = "";
      if (!["http:", "https:"].includes(url.protocol)) return;
      links.set(url.href, {
        url,
        text: $(element).text().replace(/\s+/g, " ").trim().slice(0, 160),
        source,
      });
    } catch { /* Malformed URLs cannot be requested. */ }
  });
  return links;
}

async function inspectCrawler(target: URL, robots: string, robotsAvailable: boolean, crawler: (typeof CRAWLERS)[number]): Promise<CrawlerResult> {
  const robotsAllowed = robotsAvailable
    ? isCrawlerAllowed(new URL("/robots.txt", target).href, robots, target.href, crawler.name)
    : null;
  try {
    const response = await safeFetch(target, { headers: { "user-agent": `${crawler.name}/1.0` } });
    return {
      ...crawler,
      robotsAllowed,
      httpStatus: response.status,
      accessible: robotsAllowed !== false && response.status >= 200 && response.status < 400,
    };
  } catch (error) {
    return {
      ...crawler,
      robotsAllowed,
      httpStatus: null,
      accessible: false,
      requestError: error instanceof Error ? error.message : "Request failed",
    };
  }
}

async function inspectLink(candidate: LinkCandidate, pageOrigin: string): Promise<LinkResult> {
  const { url, text, source } = candidate;
  try {
    let response = await safeFetch(url, { method: "HEAD" });
    if ([403, 405].includes(response.status)) response = await safeFetch(url, { method: "GET" });
    const finalUrl = response.url || url.href;
    return {
      url: url.href,
      finalUrl,
      text,
      source,
      internal: url.origin === pageOrigin,
      status: response.status,
      ok: response.status >= 200 && response.status < 400,
      redirected: finalUrl !== url.href,
    };
  } catch (error) {
    return {
      url: url.href,
      text,
      source,
      internal: url.origin === pageOrigin,
      status: null,
      ok: false,
      redirected: false,
      error: error instanceof Error ? error.message : "Request failed",
    };
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

async function renderPage(url: URL) {
  const [{ chromium: playwrightChromium }, sparticuz] = await Promise.all([
    import("playwright-core"),
    import("@sparticuz/chromium"),
  ]);
  const executablePath = process.env.VERCEL ? await sparticuz.default.executablePath() : localChromePath();
  if (!executablePath) throw new Error("No local Chrome or Edge executable found");
  const browser = await playwrightChromium.launch({
    executablePath,
    headless: true,
    args: process.env.VERCEL ? sparticuz.default.args : [],
  });
  try {
    const page = await browser.newPage();
    await page.route("**/*", async (route) => {
      try {
        const requestUrl = new URL(route.request().url());
        if (!["http:", "https:"].includes(requestUrl.protocol)) return route.continue();
        await assertPublicUrl(requestUrl);
        return route.continue();
      } catch {
        return route.abort("blockedbyclient");
      }
    });
    await page.goto(url.href, { waitUntil: "domcontentloaded", timeout: 15_000 });
    await page.waitForLoadState("load", { timeout: 5_000 }).catch(() => undefined);
    await page.waitForTimeout(750);
    return { html: await page.content(), textLength: (await page.locator("body").innerText()).trim().length };
  } finally {
    await browser.close();
  }
}

async function addAiSummary(report: WebsiteAudit) {
  if (!process.env.OPENAI_API_KEY) return report;
  try {
    const OpenAI = (await import("openai")).default;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
      instructions: `You are a website auditor. Summarize only the supplied evidence and give the three most important actionable fixes in concise plain English.
Crawler terminology is strict:
- Say "blocked by robots.txt" only when robotsAllowed is exactly false.
- When robotsAllowed is true but accessible is false, say the HTTP request was rejected or failed, and cite httpStatus or requestError.
- When robotsAllowed is null, say robots.txt permission could not be verified. Never describe it as allowed or blocked.
- GPTBot concerns training, OAI-SearchBot concerns ChatGPT Search, and ChatGPT-User is a user-triggered visit. Do not combine their purposes.
- Never claim that a page is indexed, discoverable, or cited by an AI system; external indexing is not verified.`,
      input: JSON.stringify({ page: report.page, links: report.links, seo: report.seo, aiVisibility: report.aiVisibility }),
      max_output_tokens: 450,
    });
    return { ...report, summary: response.output_text.trim() };
  } catch {
    return report;
  }
}

export async function auditWebsite(input: string): Promise<WebsiteAudit> {
  const target = normalizeAuditUrl(input);
  const response = await safeFetch(target);
  if (!response.ok) throw new Error(`The page returned HTTP ${response.status}`);
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
    throw new Error("The URL did not return an HTML page");
  }
  const html = (await response.text()).slice(0, MAX_HTML_LENGTH);
  const finalUrl = new URL(response.url || target.href);
  const $ = cheerio.load(html);
  const title = $("title").first().text().trim();
  const description = $('meta[name="description"]').attr("content")?.trim() || "";
  const canonicalValue = $('link[rel="canonical"]').attr("href");
  const canonical = canonicalValue ? new URL(canonicalValue, finalUrl).href : null;
  const rawTextLength = visibleTextLength(html);

  const discovered = collectLinks(html, finalUrl, "initial");

  let renderedTextLength: number | null = null;
  let renderingNote: string | undefined;
  let renderedHtml = "";
  try {
    const rendered = await renderPage(finalUrl);
    renderedTextLength = rendered.textLength;
    renderedHtml = rendered.html;
    for (const [href, candidate] of collectLinks(rendered.html, finalUrl, "rendered")) {
      const existing = discovered.get(href);
      discovered.set(href, existing
        ? { ...existing, text: existing.text || candidate.text, source: "both" }
        : candidate);
    }
  } catch (error) {
    renderingNote = error instanceof Error ? error.message : "JavaScript rendering was unavailable";
  }
  const javascriptDependencyPercent = renderedTextLength && renderedTextLength > 0
    ? Math.max(0, Math.min(100, Math.round((1 - rawTextLength / renderedTextLength) * 100)))
    : null;

  const orderedLinks = [...discovered.values()].sort((a, b) => Number(b.url.origin === finalUrl.origin) - Number(a.url.origin === finalUrl.origin));
  const checkedLinks = await Promise.all(orderedLinks.slice(0, MAX_LINKS).map((candidate) => inspectLink(candidate, finalUrl.origin)));

  let robots = "";
  let robotsAvailable = true;
  try {
    const robotsResponse = await safeFetch(new URL("/robots.txt", finalUrl));
    if (robotsResponse.ok) robots = await robotsResponse.text();
    else if (robotsResponse.status !== 404) robotsAvailable = false;
  } catch {
    robotsAvailable = false;
  }
  const crawlers = await Promise.all(CRAWLERS.map((crawler) => inspectCrawler(finalUrl, robots, robotsAvailable, crawler)));

  const seoFindings: AuditFinding[] = [];
  seoFindings.push(title
    ? { level: "pass", title: "Page title", detail: title }
    : { level: "error", title: "Missing page title", detail: "Add a unique, descriptive <title>." });
  seoFindings.push(description
    ? { level: "pass", title: "Meta description", detail: description }
    : { level: "warning", title: "Missing meta description", detail: "Add a concise description for search result snippets." });
  seoFindings.push($("h1").length === 1
    ? { level: "pass", title: "Single H1", detail: $("h1").first().text().replace(/\s+/g, " ").trim() }
    : { level: "warning", title: "Heading structure", detail: `Found ${$("h1").length} H1 elements; aim for one clear primary heading.` });
  seoFindings.push(canonical
    ? { level: "pass", title: "Canonical URL", detail: canonical }
    : { level: "warning", title: "Missing canonical", detail: "Declare the preferred URL for this page." });
  const noindex = `${$('meta[name="robots"]').attr("content") || ""} ${response.headers.get("x-robots-tag") || ""}`.toLowerCase().includes("noindex");
  if (noindex) seoFindings.push({ level: "error", title: "Page is noindex", detail: "Robots directives tell search engines not to index this page." });
  const imageCount = $("img").length;
  const missingAlt = $("img").filter((_, element) => $(element).attr("alt") === undefined).length;
  seoFindings.push(missingAlt
    ? { level: "warning", title: "Image alternative text", detail: `${missingAlt} of ${imageCount} images have no alt attribute.` }
    : { level: "pass", title: "Image alternative text", detail: `${imageCount} images checked.` });
  const broken = checkedLinks.filter((item) => !item.ok);
  if (broken.length) seoFindings.push({ level: "error", title: "Broken links", detail: `${broken.length} checked links could not be reached successfully.` });

  const aiFindings: AuditFinding[] = [];
  const blocked = crawlers.filter((crawler) => crawler.robotsAllowed === false);
  const unknownRobots = crawlers.filter((crawler) => crawler.robotsAllowed === null);
  aiFindings.push(blocked.length
    ? { level: "error", title: "AI crawlers blocked", detail: `${blocked.map((item) => item.name).join(", ")} are disallowed by robots.txt.` }
    : unknownRobots.length
      ? { level: "warning", title: "Robots permission not verified", detail: "robots.txt could not be retrieved successfully, so crawler permission is unknown." }
      : { level: "pass", title: "AI crawler permissions", detail: "No tested AI crawler is disallowed by robots.txt for this URL." });
  const inaccessible = crawlers.filter((crawler) => crawler.robotsAllowed && !crawler.accessible);
  if (inaccessible.length) aiFindings.push({ level: "error", title: "Crawler requests rejected", detail: `${inaccessible.map((item) => item.name).join(", ")} could not retrieve a successful response.` });
  if (javascriptDependencyPercent !== null) {
    aiFindings.push(javascriptDependencyPercent > 60
      ? { level: "error", title: "High JavaScript dependency", detail: `${javascriptDependencyPercent}% of rendered text was absent from the initial HTML.` }
      : javascriptDependencyPercent > 20
        ? { level: "warning", title: "JavaScript-dependent content", detail: `${javascriptDependencyPercent}% of rendered text was absent from the initial HTML.` }
        : { level: "pass", title: "Initial HTML readability", detail: "Most visible text is present before JavaScript runs." });
  } else {
    aiFindings.push({ level: "warning", title: "JavaScript rendering not verified", detail: renderingNote || "A browser renderer was unavailable." });
  }
  const jsonLdCount = $("script[type='application/ld+json']").length || (renderedHtml ? cheerio.load(renderedHtml)("script[type='application/ld+json']").length : 0);
  aiFindings.push(jsonLdCount
    ? { level: "pass", title: "Structured data", detail: `Found ${jsonLdCount} JSON-LD block${jsonLdCount === 1 ? "" : "s"}.` }
    : { level: "warning", title: "No JSON-LD structured data", detail: "Machine-readable entities and relationships are not explicitly declared." });
  if (rawTextLength < 150) aiFindings.push({ level: "warning", title: "Thin initial HTML", detail: `Only ${rawTextLength} visible characters were available without JavaScript.` });

  const seoScore = scoreSeo({
    noindex,
    titleLength: title.length,
    descriptionLength: description.length,
    h1Count: $("h1").length,
    hasCanonical: Boolean(canonical),
    imageCount,
    missingAlt,
    brokenInternal: broken.filter((item) => item.internal).length,
    brokenExternal: broken.filter((item) => !item.internal).length,
    renderingComplete: renderedTextLength !== null,
    robotsKnown: crawlers.every((item) => item.robotsAllowed !== null),
    linksDiscovered: discovered.size,
    linksChecked: checkedLinks.length,
  });
  const aiScore = scoreAiVisibility({
    noindex,
    crawlers,
    javascriptDependencyPercent,
    rawTextLength,
    hasStructuredData: jsonLdCount > 0,
    renderingComplete: renderedTextLength !== null,
    linksDiscovered: discovered.size,
    linksChecked: checkedLinks.length,
  });

  const report: WebsiteAudit = {
    url: target.href,
    finalUrl: finalUrl.href,
    checkedAt: new Date().toISOString(),
    page: {
      status: response.status,
      title,
      description,
      canonical,
      rawTextLength,
      renderedTextLength,
      javascriptDependencyPercent,
      rendering: renderedTextLength === null ? "unavailable" : "complete",
      ...(renderingNote ? { renderingNote } : {}),
    },
    links: {
      discovered: discovered.size,
      checked: checkedLinks.length,
      broken,
      redirects: checkedLinks.filter((item) => item.redirected),
    },
    seo: { ...seoScore, findings: seoFindings },
    aiVisibility: { ...aiScore, findings: aiFindings, crawlers, indexingVerified: false },
  };
  return addAiSummary(report);
}
