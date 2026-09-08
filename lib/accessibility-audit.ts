import type { CheerioAPI } from "cheerio";
import type { QualityFinding } from "@/lib/audit-findings";

/**
 * Deterministic accessibility checks against the rendered DOM.
 *
 * Every rule here is observable in markup, so findings are emitted at high
 * confidence. Anything requiring judgement (is this image decorative? is this
 * heading wording good?) is deliberately left to the contextual pass, where
 * findings are capped at medium confidence.
 */

/** Link labels that carry no meaning when read out of context by a screen reader. */
const NON_DESCRIPTIVE_LABELS = new Set([
  "click here", "here", "read more", "more", "learn more", "find out more",
  "more info", "more information", "details", "view", "view more", "see more",
  "explore more", "explore", "continue", "go", "link", "this link", "this page",
  "download", "next", "previous", "start", "apply", "submit",
]);

const GENERIC_ALT = new Set([
  "image", "photo", "picture", "graphic", "icon", "logo", "banner", "img",
  "spacer", "placeholder", "thumbnail", "untitled",
]);

const MAX_EXAMPLES = 5;

function normalise(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function quoteExamples(values: string[]) {
  const shown = values.slice(0, MAX_EXAMPLES).map((value) => `"${value}"`).join(", ");
  const extra = values.length - MAX_EXAMPLES;
  return extra > 0 ? `${shown}, and ${extra} more` : shown;
}

function looksLikeFilename(alt: string) {
  return /\.(jpe?g|png|gif|svg|webp|avif)$/i.test(alt) || (/[_-]/.test(alt) && !/\s/.test(alt) && alt.length > 6);
}

/** The name a screen reader would announce for an element. */
function accessibleName(node: ReturnType<CheerioAPI>) {
  const own = normalise(node.text());
  if (own) return own;
  const aria = normalise(node.attr("aria-label") || "");
  if (aria) return aria;
  const title = normalise(node.attr("title") || "");
  if (title) return title;
  const imgAlt = normalise(node.find("img[alt]").first().attr("alt") || "");
  if (imgAlt) return imgAlt;
  return "";
}

export function auditAccessibility($: CheerioAPI): QualityFinding[] {
  const findings: QualityFinding[] = [];

  // --- Images -------------------------------------------------------------
  const images = $("img").toArray();
  const missingAlt: string[] = [];
  const linkedDecorative: string[] = [];
  const weakAlt: string[] = [];

  for (const element of images) {
    const node = $(element);
    const alt = node.attr("alt");
    const src = normalise(node.attr("src") || node.attr("data-src") || "(inline image)").split("?")[0];
    const insideLink = node.parents("a").length > 0;

    if (alt === undefined) {
      missingAlt.push(src);
      continue;
    }
    const trimmed = normalise(alt);
    if (trimmed === "" && insideLink) {
      // A decorative image is fine, but not when it is the only content of a link.
      const linkText = normalise(node.parents("a").first().text());
      if (!linkText) linkedDecorative.push(src);
      continue;
    }
    if (trimmed && (GENERIC_ALT.has(trimmed.toLowerCase()) || looksLikeFilename(trimmed))) {
      weakAlt.push(trimmed);
    }
  }

  if (missingAlt.length) {
    findings.push({
      category: "accessibility",
      severity: missingAlt.length > images.length / 2 ? "high" : "medium",
      confidence: "high",
      element: "Images without an alt attribute",
      evidence: `${missingAlt.length} of ${images.length} images have no alt attribute: ${quoteExamples(missingAlt)}.`,
      impact: "Screen-reader users receive no description, and the file path may be read aloud instead. This is a WCAG 2.1 A failure (1.1.1 Non-text Content).",
      fix: "Add meaningful alt text describing the purpose of each informative image. Use alt=\"\" only for purely decorative images.",
      owner: "Design/Accessibility",
      location: "img elements",
    });
  }

  if (linkedDecorative.length) {
    findings.push({
      category: "accessibility",
      severity: "high",
      confidence: "high",
      element: "Links whose only content is an image marked decorative",
      evidence: `${linkedDecorative.length} link${linkedDecorative.length === 1 ? "" : "s"} contain only an image with alt=\"\": ${quoteExamples(linkedDecorative)}.`,
      impact: "The link is announced with no name at all, so it cannot be understood or actioned by screen-reader or voice-control users.",
      fix: "Give the image alt text describing the link destination, or add an aria-label to the link.",
      owner: "Design/Accessibility",
      location: "a > img[alt=\"\"]",
    });
  }

  if (weakAlt.length) {
    findings.push({
      category: "accessibility",
      severity: "medium",
      confidence: "medium",
      element: "Images with placeholder or filename alt text",
      evidence: `Alt text appears auto-generated or non-descriptive: ${quoteExamples(weakAlt)}.`,
      impact: "The alt attribute is present but conveys no information, so the image content is effectively lost.",
      fix: "Replace with text describing what the image communicates in this context.",
      owner: "Content",
      location: "img[alt]",
    });
  }

  // --- Link labels --------------------------------------------------------
  const labelToHrefs = new Map<string, Set<string>>();
  const nonDescriptive: string[] = [];
  const namelessLinks: string[] = [];

  for (const element of $("a[href]").toArray()) {
    const href = normalise($(element).attr("href") || "");
    if (!href || href.startsWith("#")) continue;
    const name = accessibleName($(element));
    if (!name) {
      namelessLinks.push(href);
      continue;
    }
    const key = name.toLowerCase().replace(/[.!?:]+$/, "");
    if (NON_DESCRIPTIVE_LABELS.has(key)) nonDescriptive.push(name);
    const targets = labelToHrefs.get(key) || new Set<string>();
    targets.add(href);
    labelToHrefs.set(key, targets);
  }

  if (namelessLinks.length) {
    findings.push({
      category: "accessibility",
      severity: "high",
      confidence: "high",
      element: "Links with no accessible name",
      evidence: `${namelessLinks.length} link${namelessLinks.length === 1 ? "" : "s"} expose no text, aria-label, or image alt: ${quoteExamples(namelessLinks)}.`,
      impact: "Screen-reader and voice-control users cannot identify or activate these links. WCAG 2.1 A failure (2.4.4 Link Purpose).",
      fix: "Add visible link text or an aria-label describing the destination.",
      owner: "Design/Accessibility",
      location: "a[href]",
    });
  }

  if (nonDescriptive.length) {
    findings.push({
      category: "accessibility",
      severity: "medium",
      confidence: "high",
      element: "Non-descriptive call-to-action labels",
      evidence: `${nonDescriptive.length} link${nonDescriptive.length === 1 ? " uses" : "s use"} generic label text: ${quoteExamples([...new Set(nonDescriptive)])}.`,
      impact: "Screen-reader users navigating by link list cannot tell these apart, and the labels carry no SEO value.",
      fix: "Replace with descriptive text naming the destination, e.g. \"Learn more about CPA Congress 2026\" instead of \"Learn more\".",
      owner: "Content",
      location: "a[href]",
    });
  }

  const ambiguous = [...labelToHrefs.entries()].filter(([, targets]) => targets.size >= 3);
  if (ambiguous.length) {
    findings.push({
      category: "accessibility",
      severity: "medium",
      confidence: "high",
      element: "Repeated link labels pointing to different pages",
      evidence: ambiguous
        .slice(0, 3)
        .map(([label, targets]) => `"${label}" links to ${targets.size} different URLs`)
        .join("; ") + ".",
      impact: "Identical labels with different destinations are ambiguous out of context and fail WCAG 2.4.4 Link Purpose.",
      fix: "Make each label unique to its destination, or distinguish them with aria-label.",
      owner: "Content",
      location: "a[href]",
    });
  }

  // --- Headings -----------------------------------------------------------
  const h1Count = $("h1").length;
  if (h1Count !== 1) {
    findings.push({
      category: "accessibility",
      severity: h1Count === 0 ? "medium" : "low",
      confidence: "high",
      element: "Page heading structure",
      evidence: h1Count === 0
        ? "The page has no H1 element."
        : `The page has ${h1Count} H1 elements: ${quoteExamples($("h1").map((_, el) => normalise($(el).text())).toArray())}.`,
      impact: "Screen-reader users rely on a single H1 to identify the page topic before navigating its sections.",
      fix: "Use exactly one H1 naming the page subject, and demote the remaining headings to H2.",
      owner: "Design/Accessibility",
      location: "h1",
    });
  }

  const levels = $("h1,h2,h3,h4,h5,h6").toArray().map((el) => Number(el.tagName.slice(1)));
  const skips: string[] = [];
  for (let index = 1; index < levels.length; index += 1) {
    if (levels[index] - levels[index - 1] > 1) {
      skips.push(`H${levels[index - 1]} followed by H${levels[index]}`);
    }
  }
  if (skips.length) {
    findings.push({
      category: "accessibility",
      severity: "low",
      confidence: "high",
      element: "Heading level sequence",
      evidence: `${skips.length} skipped heading level${skips.length === 1 ? "" : "s"}: ${quoteExamples(skips)}.`,
      impact: "Skipped levels break the document outline that assistive technology uses to navigate the page.",
      fix: "Step heading levels one at a time; use CSS rather than heading level to control visual size.",
      owner: "Design/Accessibility",
      location: "h1-h6",
    });
  }

  // --- Forms and controls -------------------------------------------------
  const unlabelled: string[] = [];
  for (const element of $("input,select,textarea").toArray()) {
    const node = $(element);
    const type = (node.attr("type") || "text").toLowerCase();
    if (["hidden", "submit", "button", "image", "reset"].includes(type)) continue;
    const id = node.attr("id");
    const hasLabel = Boolean(
      (id && $(`label[for="${id}"]`).length) ||
      node.parents("label").length ||
      node.attr("aria-label") ||
      node.attr("aria-labelledby") ||
      node.attr("title"),
    );
    if (!hasLabel) unlabelled.push(normalise(node.attr("name") || node.attr("placeholder") || `${element.tagName}[type=${type}]`));
  }
  if (unlabelled.length) {
    findings.push({
      category: "accessibility",
      severity: "high",
      confidence: "high",
      element: "Form fields without a programmatic label",
      evidence: `${unlabelled.length} field${unlabelled.length === 1 ? " has" : "s have"} no label, aria-label, or aria-labelledby: ${quoteExamples(unlabelled)}.`,
      impact: "Screen-reader users cannot tell what to enter. Placeholder text alone is not an accessible label. WCAG 2.1 A failure (3.3.2 Labels or Instructions).",
      fix: "Associate a visible <label for> with each field, or add aria-label where a visible label is not possible.",
      owner: "Engineering",
      location: "input, select, textarea",
    });
  }

  const namelessButtons = $("button").toArray().filter((element) => !accessibleName($(element))).length;
  if (namelessButtons) {
    findings.push({
      category: "accessibility",
      severity: "high",
      confidence: "high",
      element: "Buttons with no accessible name",
      evidence: `${namelessButtons} button${namelessButtons === 1 ? " exposes" : "s expose"} no text, aria-label, or titled icon.`,
      impact: "Icon-only controls are announced as \"button\" with no purpose, blocking screen-reader and voice-control users.",
      fix: "Add an aria-label describing the action, e.g. aria-label=\"Close dialog\".",
      owner: "Engineering",
      location: "button",
    });
  }

  // --- Document level -----------------------------------------------------
  const lang = normalise($("html").attr("lang") || "");
  if (!lang) {
    findings.push({
      category: "accessibility",
      severity: "medium",
      confidence: "high",
      element: "Document language",
      evidence: "The <html> element has no lang attribute.",
      impact: "Screen readers may use the wrong pronunciation rules for the whole page. WCAG 2.1 A failure (3.1.1 Language of Page).",
      fix: "Set lang on the html element, e.g. <html lang=\"en-AU\">.",
      owner: "Engineering",
      location: "html",
    });
  }

  const untitledFrames = $("iframe").toArray().filter((element) => !normalise($(element).attr("title") || "")).length;
  if (untitledFrames) {
    findings.push({
      category: "accessibility",
      severity: "low",
      confidence: "high",
      element: "Embedded frames without a title",
      evidence: `${untitledFrames} iframe${untitledFrames === 1 ? " has" : "s have"} no title attribute.`,
      impact: "Embedded video and widget frames are announced without any indication of what they contain.",
      fix: "Add a title attribute describing the embedded content.",
      owner: "Engineering",
      location: "iframe",
    });
  }

  return findings;
}
