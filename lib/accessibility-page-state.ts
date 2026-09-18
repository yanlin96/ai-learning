export type AccessibilityRendering = "complete" | "unavailable" | "blocked";

type RenderedMarkup = {
  html: string;
  status: number | null;
};

const BLOCKED_STATUS_CODES = new Set([401, 403, 429]);
const BLOCKED_TITLES = [
  /^access denied\b/i,
  /^forbidden\b/i,
  /^request (?:rejected|blocked)\b/i,
  /^attention required\b/i,
  /^just a moment\b/i,
  /^security check\b/i,
  /^verify (?:that )?you(?: are|'re) human\b/i,
  /^bot detection\b/i,
];
const BLOCKED_BODY_MARKERS = [
  "you don't have permission to access",
  "you do not have permission to access",
  "the request could not be satisfied",
  "request blocked",
  "verify you are human",
  "checking your browser",
  "enable javascript and cookies to continue",
  "automated access has been blocked",
];

function readableText(html: string) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:nbsp|#160);/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function detectAutomatedAccessBlock(html: string, status: number | null = null) {
  if (status !== null && BLOCKED_STATUS_CODES.has(status)) {
    return { blocked: true, reason: `The browser received HTTP ${status}.` };
  }

  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]
    ?.replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim() ?? "";
  const titleMatch = BLOCKED_TITLES.find((pattern) => pattern.test(title));
  if (titleMatch) return { blocked: true, reason: `The browser returned a “${title}” page.` };

  const text = readableText(html);
  const normalized = text.toLowerCase();
  const bodyMarker = BLOCKED_BODY_MARKERS.find((marker) => normalized.includes(marker));
  if (bodyMarker && text.length < 20_000) {
    return { blocked: true, reason: "The browser returned an automated-access challenge instead of the requested page." };
  }

  return { blocked: false };
}

export function chooseAccessibilityMarkup(input: {
  initialHtml: string;
  initialStatus?: number | null;
  rendered?: RenderedMarkup;
  renderError?: string;
}): { html: string; rendering: AccessibilityRendering; renderingNote?: string } {
  const initialBlock = detectAutomatedAccessBlock(input.initialHtml, input.initialStatus);

  if (input.rendered) {
    const renderedBlock = detectAutomatedAccessBlock(input.rendered.html, input.rendered.status);
    if (!renderedBlock.blocked) {
      return { html: input.rendered.html, rendering: "complete" };
    }
    if (initialBlock.blocked) {
      throw new Error("Unable to assess this page because its access controls blocked both the initial request and browser rendering.");
    }
    return {
      html: input.initialHtml,
      rendering: "blocked",
      renderingNote: `${renderedBlock.reason ?? "Browser automation was blocked."} The estimate uses initial HTML only.`,
    };
  }

  if (initialBlock.blocked) {
    throw new Error("Unable to assess this page because its access controls blocked both the initial request and browser rendering.");
  }
  return {
    html: input.initialHtml,
    rendering: "unavailable",
    renderingNote: input.renderError || "JavaScript rendering was unavailable. The estimate uses initial HTML only.",
  };
}
