import "server-only";

import { existsSync } from "node:fs";
import * as cheerio from "cheerio";
import { assertPublicUrl, normalizePublicUrl, safePublicFetch } from "@/lib/public-web";
import { classifyLinkStatus } from "@/lib/link-status";
import { isCrawlerAllowed } from "@/lib/robots";
import { scoreAiVisibility, scoreSeo, type AuditScore } from "@/lib/audit-scoring";
import { auditAccessibility } from "@/lib/accessibility-audit";
import { auditContentFreshness, readExclusionPatterns } from "@/lib/content-freshness";
import {
  capContextualFinding,
  countBySeverity,
  firstActions,
  quickWins,
  retestChecklist,
  sortFindings,
  type Confidence,
  type FindingCategory,
  type FindingOwner,
  type QualityFinding,
  type Severity,
  type SeverityCounts,
} from "@/lib/audit-findings";

const MAX_LINKS = 80;
const LINK_CONCURRENCY = 12;
/** Link checking stops after this long so the whole audit stays inside a request timeout. */
const LINK_BUDGET_MS = 25_000;
const LINK_TIMEOUT_MS = 8_000;
const MAX_HTML_LENGTH = 2_000_000;
const MAX_CONTEXT_CHARS = 6_000;

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
  redirectStatuses: number[];
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

export type QualityReport = {
  severityCounts: SeverityCounts;
  findings: QualityFinding[];
  quickWins: string[];
  firstActions: string[];
  retestChecklist: string[];
  /** Checks that actually ran against this page. */
  verified: string[];
  /** Checks a member of the team still has to do by hand. */
  notVerified: string[];
  exclusionsApplied: string[];
  contextualAnalysis: "complete" | "unavailable" | "failed";
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
    /** Discovered links that the time budget did not allow us to test. */
    unchecked: number;
    broken: LinkResult[];
    successful: LinkResult[];
    /** Bot rejections, rate limits, and request failures that need browser confirmation. */
    inconclusive: LinkResult[];
    redirects: LinkResult[];
  };
  qualityReport: QualityReport;
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

export function normalizeAuditUrl(input: string) {
  return normalizePublicUrl(input);
}

function visibleText(html: string) {
  const $ = cheerio.load(html);
  $("script,style,noscript,template,svg").remove();
  return $("body").text().replace(/\s+/g, " ").trim();
}

/** Bounded parallelism with a wall-clock budget; unstarted items are reported as unchecked. */
async function mapWithBudget<T, R>(
  items: T[],
  limit: number,
  deadline: number,
  worker: (item: T) => Promise<R>,
): Promise<{ results: R[]; skipped: number }> {
  const results: R[] = [];
  let cursor = 0;
  let skipped = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      if (Date.now() > deadline) {
        skipped += 1;
        continue;
      }
      results.push(await worker(items[index]));
    }
  });
  await Promise.all(runners);
  return { results, skipped };
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
    const response = await safePublicFetch(target, { headers: { "user-agent": `${crawler.name}/1.0` } });
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
    let redirectStatuses: number[] = [];
    let response = await safePublicFetch(url, { method: "HEAD" }, 0, LINK_TIMEOUT_MS, redirectStatuses);
    if ([403, 405].includes(response.status)) {
      redirectStatuses = [];
      response = await safePublicFetch(url, { method: "GET" }, 0, LINK_TIMEOUT_MS, redirectStatuses);
    }
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
      redirectStatuses,
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
      redirectStatuses: [],
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

/**
 * Broken-link severity separates "our page is wrong" from "their server blipped".
 * The requirement calls out legitimate external outages as the main false-positive
 * risk, so anything that could be transient or bot-blocking is emitted at low
 * confidence with an explicit re-test instruction instead of a remediation task.
 */
function brokenLinkFinding(link: LinkResult): QualityFinding {
  const label = link.text ? `"${link.text}"` : "an unlabelled link";
  const scope = link.internal ? "Internal link" : "External link";
  const owner: FindingOwner = link.internal ? "Web Publishing" : "Content";
  const base = { category: "broken-link" as const, element: scope, location: link.url, owner };

  if (link.status === 404 || link.status === 410) {
    return {
      ...base,
      severity: link.internal ? "high" : "medium",
      confidence: "high",
      evidence: `${label} → ${link.url} returns HTTP ${link.status}.`,
      impact: link.internal
        ? "A member following this link inside our own site reaches a dead end."
        : "The destination has been removed, so the reference is no longer usable.",
      fix: link.internal
        ? "Repoint the link to the current page, or remove it if the destination was retired."
        : "Replace with the destination's current URL, or remove the reference if it no longer exists.",
    };
  }

  if (link.status === 401 || link.status === 403 || link.status === 429) {
    return {
      ...base,
      severity: "low",
      confidence: "low",
      evidence: `${label} → ${link.url} returned HTTP ${link.status} to our checker.`,
      impact: "This is frequently bot protection or rate limiting rather than a genuine break; a human browser may load the page normally.",
      fix: "Open the URL in a browser before raising a ticket. Only treat it as broken if it fails interactively too.",
    };
  }

  if (link.status && link.status >= 500) {
    return {
      ...base,
      severity: link.internal ? "high" : "low",
      confidence: link.internal ? "medium" : "low",
      evidence: `${label} → ${link.url} returned HTTP ${link.status}.`,
      impact: link.internal
        ? "Our own server errored for this URL, which may affect every visitor."
        : "The external site is erroring, which is often temporary.",
      fix: link.internal
        ? "Investigate the server error for this route."
        : "Re-test in the next scan; escalate only if it stays broken across runs.",
    };
  }

  return {
    ...base,
    severity: link.internal ? "medium" : "low",
    confidence: "low",
    evidence: `${label} → ${link.url} could not be reached: ${link.error || "the request failed"}.`,
    impact: "A DNS, TLS, or timeout failure can be transient or caused by the destination blocking automated requests.",
    fix: "Confirm the URL in a browser. If it loads, no change is needed; if it does not, replace or remove the link.",
  };
}

function pageHealthFindings(input: {
  title: string;
  description: string;
  canonical: string | null;
  noindex: boolean;
  javascriptDependencyPercent: number | null;
  blockedCrawlers: string[];
}): QualityFinding[] {
  const findings: QualityFinding[] = [];

  if (input.noindex) {
    findings.push({
      category: "seo", severity: "critical", confidence: "high",
      element: "Indexability directive",
      evidence: "A robots directive on this page contains noindex.",
      impact: "Search engines are instructed not to list this page at all, so organic traffic to it is zero.",
      fix: "Remove the noindex directive if this page is meant to be publicly discoverable.",
      owner: "Engineering", location: "meta[name=robots] / X-Robots-Tag",
    });
  }
  if (!input.title) {
    findings.push({
      category: "seo", severity: "high", confidence: "high",
      element: "Page title",
      evidence: "The page has no <title> element.",
      impact: "Search results and browser tabs have nothing to display, and screen readers cannot announce the page.",
      fix: "Add a unique, descriptive title of roughly 50-60 characters.",
      owner: "Engineering", location: "title",
    });
  }
  if (!input.description) {
    findings.push({
      category: "seo", severity: "low", confidence: "high",
      element: "Meta description",
      evidence: "The page has no meta description.",
      impact: "Search engines generate their own snippet, which is often less compelling than an authored one.",
      fix: "Add a 120-160 character meta description summarising the page.",
      owner: "Content", location: "meta[name=description]",
    });
  }
  if (!input.canonical) {
    findings.push({
      category: "seo", severity: "low", confidence: "high",
      element: "Canonical URL",
      evidence: "No canonical link element is declared.",
      impact: "Duplicate or parameterised versions of this URL may compete with each other in search.",
      fix: "Declare the preferred URL with <link rel=\"canonical\">.",
      owner: "Engineering", location: "link[rel=canonical]",
    });
  }
  if (input.blockedCrawlers.length) {
    findings.push({
      category: "ai-visibility", severity: "medium", confidence: "high",
      element: "AI crawler permissions",
      evidence: `robots.txt disallows ${input.blockedCrawlers.join(", ")} for this URL.`,
      impact: "AI assistants cannot retrieve this page, so it will not appear in answers they generate for members.",
      fix: "Decide deliberately whether these crawlers should be blocked; if not, allow them in robots.txt.",
      owner: "Engineering", location: "/robots.txt",
    });
  }
  if (input.javascriptDependencyPercent !== null && input.javascriptDependencyPercent > 60) {
    findings.push({
      category: "ai-visibility", severity: "medium", confidence: "high",
      element: "JavaScript-dependent content",
      evidence: `${input.javascriptDependencyPercent}% of the rendered text is absent from the initial HTML.`,
      impact: "Crawlers that do not execute JavaScript see a mostly empty page, weakening both search and AI visibility.",
      fix: "Server-render the primary content, or provide it in the initial HTML response.",
      owner: "Engineering", location: input.canonical || "page",
    });
  }
  return findings;
}

const CONTEXTUAL_CATEGORIES: FindingCategory[] = ["content-quality", "expired-content", "accessibility", "seo"];
const CONTEXTUAL_OWNERS: FindingOwner[] = ["Content", "Design/Accessibility", "Web Publishing", "Engineering"];
const SEVERITIES: Severity[] = ["critical", "high", "medium", "low"];
const CONFIDENCES: Confidence[] = ["high", "medium", "low"];

function parseContextualFindings(raw: string): QualityFinding[] {
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start === -1 || end <= start) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const findings: QualityFinding[] = [];
  for (const item of parsed.slice(0, 6)) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const text = (key: string) => (typeof record[key] === "string" ? (record[key] as string).trim() : "");
    const element = text("element");
    const evidence = text("evidence");
    const impact = text("impact");
    const fix = text("fix");
    // A finding without evidence and a fix cannot be actioned, so it is not worth reporting.
    if (!element || !evidence || !fix) continue;
    const category = CONTEXTUAL_CATEGORIES.find((value) => value === record.category) || "content-quality";
    const severity = SEVERITIES.find((value) => value === record.severity) || "low";
    const confidence = CONFIDENCES.find((value) => value === record.confidence) || "low";
    const owner = CONTEXTUAL_OWNERS.find((value) => value === record.owner) || "Content";
    findings.push(capContextualFinding({
      category, severity, confidence, element, evidence,
      impact: impact || "Reduces clarity or trust for the reader.",
      fix, owner,
      note: "Contextual finding from language-model analysis; verify before assigning remediation.",
    }));
  }
  return findings;
}

/** Rebuilds every derived field after the findings list changes. */
function summariseFindings(report: QualityReport, findings: QualityFinding[]): QualityReport {
  const sorted = sortFindings(findings);
  return {
    ...report,
    findings: sorted,
    severityCounts: countBySeverity(sorted),
    quickWins: quickWins(sorted),
    firstActions: firstActions(sorted),
    retestChecklist: retestChecklist(sorted),
  };
}

/**
 * Contextual pass: the checks that need judgement rather than markup inspection.
 * Findings are capped at medium severity/confidence by capContextualFinding, and
 * the model is told explicitly not to flag legitimate historical content.
 */
async function addContextualFindings(report: WebsiteAudit, pageText: string): Promise<WebsiteAudit> {
  if (!process.env.OPENAI_API_KEY) {
    return { ...report, qualityReport: { ...report.qualityReport, contextualAnalysis: "unavailable" } };
  }
  try {
    const OpenAI = (await import("openai")).default;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
      instructions: `You review published web page copy for a professional membership body.
Return ONLY a JSON array. Each element must be an object with these string fields:
category (one of "content-quality", "expired-content", "accessibility", "seo"),
severity (one of "medium", "low"), confidence (one of "medium", "low"),
element, evidence, impact, fix, owner (one of "Content", "Design/Accessibility", "Web Publishing", "Engineering").

Rules:
- Quote the page's own wording in "evidence". Never invent text that is not in the supplied content.
- Report at most 5 findings. If the copy reads well, return [].
- Do NOT flag historical content, past events, prior-year reports, or superseded regulatory references as defects. A professional body publishes these deliberately.
- Only flag a date as expired when the page presents it as a live deadline or offer.
- Do not repeat findings already listed in "existingFindings".
- Do not comment on anything you cannot see in the supplied text.
- "fix" must be a specific edit an author can make, not general advice.`,
      input: JSON.stringify({
        url: report.finalUrl,
        title: report.page.title,
        todayIso: new Date().toISOString().slice(0, 10),
        existingFindings: report.qualityReport.findings.map((finding) => finding.element),
        pageText: pageText.slice(0, MAX_CONTEXT_CHARS),
      }),
      max_output_tokens: 1_200,
    });
    const contextual = parseContextualFindings(response.output_text || "");
    return {
      ...report,
      qualityReport: summariseFindings(
        { ...report.qualityReport, contextualAnalysis: "complete" },
        [...report.qualityReport.findings, ...contextual],
      ),
    };
  } catch {
    return { ...report, qualityReport: { ...report.qualityReport, contextualAnalysis: "failed" } };
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
  const response = await safePublicFetch(target);
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
  const rawText = visibleText(html);
  const rawTextLength = rawText.length;

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
  const { results: checkedLinks } = await mapWithBudget(
    orderedLinks.slice(0, MAX_LINKS),
    LINK_CONCURRENCY,
    Date.now() + LINK_BUDGET_MS,
    (candidate) => inspectLink(candidate, finalUrl.origin),
  );
  const uncheckedLinks = discovered.size - checkedLinks.length;

  let robots = "";
  let robotsAvailable = true;
  try {
    const robotsResponse = await safePublicFetch(new URL("/robots.txt", finalUrl));
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
  const broken = checkedLinks.filter((item) => classifyLinkStatus(item.status, item.ok) === "broken");
  const inconclusive = checkedLinks.filter((item) => classifyLinkStatus(item.status, item.ok) === "inconclusive");
  const successful = checkedLinks.filter((item) => classifyLinkStatus(item.status, item.ok) === "ok");
  if (broken.length) seoFindings.push({ level: "error", title: "Broken links", detail: `${broken.length} checked links returned a confirmed HTTP failure.` });
  if (inconclusive.length) seoFindings.push({ level: "info", title: "Links needing verification", detail: `${inconclusive.length} checked link${inconclusive.length === 1 ? " was" : "s were"} blocked, rate-limited, or unreachable to the checker; this does not prove they are broken.` });

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

  // Accessibility and freshness read the rendered DOM when a browser was available,
  // because content injected by JavaScript is what a member actually sees.
  const contentHtml = renderedHtml || html;
  const contentText = renderedHtml ? visibleText(renderedHtml) : rawText;
  const accessibilityFindings = auditAccessibility(renderedHtml ? cheerio.load(renderedHtml) : $);
  const freshness = auditContentFreshness(
    contentText,
    finalUrl.href,
    new Date(),
    readExclusionPatterns(process.env.AUDIT_ARCHIVE_PATTERNS),
  );

  const deterministicFindings = sortFindings([
    ...broken.map(brokenLinkFinding),
    ...accessibilityFindings,
    ...freshness.findings,
    ...pageHealthFindings({
      title,
      description,
      canonical,
      noindex,
      javascriptDependencyPercent,
      blockedCrawlers: blocked.map((crawler) => crawler.name),
    }),
  ]);

  const verified: string[] = [
    `Page responded with HTTP ${response.status} and returned HTML.`,
    `${checkedLinks.length} of ${discovered.size} discovered links tested for HTTP status.`,
    `${cheerio.load(contentHtml)("img").length} images inspected for alt attributes.`,
    "Heading hierarchy, form labels, link labels, and document language read from the DOM.",
    "Title, meta description, canonical, and robots directives read from the response.",
    `robots.txt permissions and live access tested for ${crawlers.length} AI crawlers.`,
    renderedTextLength !== null
      ? "Page rendered in a headless browser to capture JavaScript-injected content."
      : "Initial HTML analysed (headless rendering was unavailable).",
  ];

  const notVerified: string[] = [
    "Colour contrast, keyboard navigation, and focus order (require interactive testing).",
    "Core Web Vitals and other performance metrics.",
    "Mobile and responsive rendering behaviour.",
    "Structured data validity beyond the presence of JSON-LD blocks.",
    "Whether flagged historical content is intentional (needs a content owner's judgement).",
  ];
  if (uncheckedLinks > 0) {
    notVerified.unshift(`HTTP status of ${uncheckedLinks} further discovered link${uncheckedLinks === 1 ? "" : "s"} (link-checking budget reached).`);
  }
  if (inconclusive.length > 0) {
    notVerified.unshift(`${inconclusive.length} link${inconclusive.length === 1 ? " needs" : "s need"} manual browser confirmation because the checker was blocked or received no conclusive response.`);
  }
  if (renderedTextLength === null) {
    notVerified.unshift("Content injected by JavaScript: the headless browser was unavailable for this run.");
  }

  const qualityReport: QualityReport = summariseFindings(
    {
      severityCounts: { critical: 0, high: 0, medium: 0, low: 0 },
      findings: [],
      quickWins: [],
      firstActions: [],
      retestChecklist: [],
      verified,
      notVerified,
      exclusionsApplied: freshness.exclusionsApplied,
      contextualAnalysis: "unavailable",
    },
    deterministicFindings,
  );

  const report: WebsiteAudit = {
    url: target.href,
    finalUrl: finalUrl.href,
    checkedAt: new Date().toISOString(),
    qualityReport,
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
      unchecked: Math.max(0, uncheckedLinks),
      broken,
      successful,
      inconclusive,
      redirects: checkedLinks.filter((item) => item.redirected),
    },
    seo: { ...seoScore, findings: seoFindings },
    aiVisibility: { ...aiScore, findings: aiFindings, crawlers, indexingVerified: false },
  };
  const withSummary = await addAiSummary(report);
  return addContextualFindings(withSummary, contentText);
}
