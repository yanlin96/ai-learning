import "server-only";

import * as cheerio from "cheerio";
import { auditAccessibility } from "@/lib/accessibility-audit";
import { countBySeverity, sortFindings, type QualityFinding, type SeverityCounts } from "@/lib/audit-findings";
import { scoreAccessibility, type AuditScore } from "@/lib/audit-scoring";
import { normalizePublicUrl, safePublicFetch } from "@/lib/public-web";
import { renderPublicPage } from "@/lib/public-page-renderer";

const MAX_HTML_LENGTH = 2_000_000;

export type AccessibilityEstimateReport = {
  finalUrl: string;
  checkedAt: string;
  page: { title: string; status: number; rendering: "complete" | "unavailable"; renderingNote?: string };
  estimate: AuditScore & { findingsCount: number };
  findings: QualityFinding[];
  severityCounts: SeverityCounts;
  verified: string[];
  notVerified: string[];
};

export async function estimateAccessibility(input: string): Promise<AccessibilityEstimateReport> {
  const target = normalizePublicUrl(input);
  const response = await safePublicFetch(target);
  if (!response.ok) throw new Error(`The page returned HTTP ${response.status}`);
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) throw new Error("The URL did not return an HTML page");
  const initialHtml = (await response.text()).slice(0, MAX_HTML_LENGTH);
  const finalUrl = new URL(response.url || target.href);
  let html = initialHtml;
  let rendering: "complete" | "unavailable" = "unavailable";
  let renderingNote: string | undefined;
  try {
    html = (await renderPublicPage(finalUrl)).html.slice(0, MAX_HTML_LENGTH);
    rendering = "complete";
  } catch (error) {
    renderingNote = error instanceof Error ? error.message : "JavaScript rendering was unavailable";
  }
  const $ = cheerio.load(html);
  const findings = sortFindings(auditAccessibility($));
  const score = scoreAccessibility(findings, rendering === "complete");
  return {
    finalUrl: finalUrl.href,
    checkedAt: new Date().toISOString(),
    page: { title: $("title").first().text().trim(), status: response.status, rendering, ...(renderingNote ? { renderingNote } : {}) },
    estimate: { ...score, findingsCount: findings.length },
    findings,
    severityCounts: countBySeverity(findings),
    verified: [
      `${$("img").length} images checked for text alternatives.`,
      `${$("a[href]").length} links and ${$("button").length} buttons checked for accessible names.`,
      `${$("input,select,textarea").length} form controls checked for programmatic labels.`,
      "Heading structure, document language and frame titles checked in the DOM.",
      rendering === "complete" ? "JavaScript-rendered DOM inspected." : "Initial HTML inspected because browser rendering was unavailable.",
    ],
    notVerified: [
      "Colour contrast and information conveyed by colour.",
      "Keyboard navigation, visible focus and focus order.",
      "Zoom, reflow, responsive layouts and target size.",
      "Screen-reader announcements, reading order and live interactions.",
      "Captions, transcripts and the accuracy of human-authored text alternatives.",
    ],
  };
}
