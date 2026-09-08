import type { Confidence, QualityFinding, Severity } from "@/lib/audit-findings";

/**
 * Expired content detection.
 *
 * The false-positive risk here is the one called out in the requirements: a page
 * full of historical reports, event archives, and past regulatory references is
 * *supposed* to contain past dates. Two defences apply.
 *
 * 1. A past date is only actionable when expiry language sits next to it
 *    ("sale must end", "register by", "closes"). A bare past date is emitted at
 *    low confidence and low severity, flagged as possibly legitimate history.
 * 2. Pages matching an archive exclusion rule have every date finding
 *    downgraded one severity level, with the matched rule recorded on the finding.
 */

const SEVERITY_STEPS: Severity[] = ["critical", "high", "medium", "low"];

/** An archive match softens a finding by one level rather than hiding it entirely. */
export function downgrade(severity: Severity): Severity {
  return SEVERITY_STEPS[Math.min(SEVERITY_STEPS.indexOf(severity) + 1, SEVERITY_STEPS.length - 1)];
}

const MONTHS: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
  may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7,
  sep: 8, sept: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10,
  dec: 11, december: 11,
};

const MONTH_PATTERN = "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";

/** Words that turn a date into a commitment the page is making to the reader. */
const EXPIRY_CONTEXT = [
  "must end", "ends", "ending", "end of", "closes", "closing", "closed on",
  "deadline", "due by", "due on", "expires", "expiry", "expired", "valid until",
  "available until", "until", "register by", "registrations close", "apply by",
  "applications close", "book by", "bookings close", "enrol by", "enrolments close",
  "rsvp by", "last day", "final day", "early bird", "offer ends", "sale",
  "cut-off", "cutoff", "on sale", "save until", "limited time", "act now",
];

/** URL fragments that mark a page as an intentional archive. */
const DEFAULT_ARCHIVE_PATTERNS = [
  "/archive", "/archives", "/past-", "/past/", "/historical", "/history",
  "/annual-report", "/media-release/20", "/back-issues", "/previous",
];

export type FreshnessResult = {
  findings: QualityFinding[];
  /** Exclusion rules that matched this page, for the report's verification notes. */
  exclusionsApplied: string[];
};

type DateHit = {
  text: string;
  date: Date;
  context: string;
  hasExpiryLanguage: boolean;
  /** DD/MM vs MM/DD cannot be resolved from the string alone. */
  ambiguous: boolean;
};

function monthIndex(name: string) {
  return MONTHS[name.toLowerCase().replace(/\.$/, "")];
}

function contextAround(text: string, index: number, length: number) {
  return text.slice(Math.max(0, index - 90), index + length + 40).toLowerCase();
}

function hasExpiryLanguage(context: string) {
  return EXPIRY_CONTEXT.some((phrase) => context.includes(phrase));
}

/** Real dates only: rejects things like 31 February and out-of-range years. */
function buildDate(year: number, month: number, day: number) {
  if (year < 1990 || year > 2100 || month < 0 || month > 11 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month || date.getUTCDate() !== day) return null;
  return date;
}

export function extractDates(text: string): DateHit[] {
  const hits: DateHit[] = [];
  const push = (match: RegExpExecArray, date: Date | null, ambiguous = false) => {
    if (!date) return;
    const context = contextAround(text, match.index, match[0].length);
    hits.push({ text: match[0].trim(), date, context, hasExpiryLanguage: hasExpiryLanguage(context), ambiguous });
  };

  const dayFirst = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTH_PATTERN})\\.?\\s+(\\d{4})\\b`, "gi");
  for (let match = dayFirst.exec(text); match; match = dayFirst.exec(text)) {
    push(match, buildDate(Number(match[3]), monthIndex(match[2]), Number(match[1])));
  }

  const monthFirst = new RegExp(`\\b(${MONTH_PATTERN})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})\\b`, "gi");
  for (let match = monthFirst.exec(text); match; match = monthFirst.exec(text)) {
    push(match, buildDate(Number(match[3]), monthIndex(match[1]), Number(match[2])));
  }

  const iso = /\b(\d{4})-(\d{2})-(\d{2})\b/g;
  for (let match = iso.exec(text); match; match = iso.exec(text)) {
    push(match, buildDate(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  }

  // Australian sites write DD/MM/YYYY, but 03/04/2026 is genuinely ambiguous.
  const slashed = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g;
  for (let match = slashed.exec(text); match; match = slashed.exec(text)) {
    const first = Number(match[1]);
    const second = Number(match[2]);
    push(match, buildDate(Number(match[3]), second - 1, first), first <= 12 && second <= 12);
  }

  return hits;
}

function matchedExclusions(url: string, extraPatterns: string[]) {
  const path = url.toLowerCase();
  return [...DEFAULT_ARCHIVE_PATTERNS, ...extraPatterns]
    .filter((pattern) => pattern && path.includes(pattern.toLowerCase()));
}

export function readExclusionPatterns(value: string | undefined): string[] {
  return (value || "").split(",").map((item) => item.trim()).filter(Boolean);
}

export function auditContentFreshness(
  text: string,
  url: string,
  now: Date = new Date(),
  extraPatterns: string[] = [],
): FreshnessResult {
  const exclusionsApplied = matchedExclusions(url, extraPatterns);
  const isArchive = exclusionsApplied.length > 0;
  const findings: QualityFinding[] = [];

  // A day of slack absorbs timezone differences between us and the publisher.
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const past = extractDates(text).filter((hit) => hit.date < cutoff);

  const committed = past.filter((hit) => hit.hasExpiryLanguage);
  const bare = past.filter((hit) => !hit.hasExpiryLanguage);

  const apply = (severity: Severity): Severity => (isArchive ? downgrade(severity) : severity);
  const note = isArchive
    ? `Downgraded: URL matches archive exclusion rule ${exclusionsApplied.map((rule) => `"${rule}"`).join(", ")}.`
    : undefined;

  if (committed.length) {
    const daysStale = Math.floor((now.getTime() - Math.max(...committed.map((hit) => hit.date.getTime()))) / 86_400_000);
    const examples = committed.slice(0, 5).map((hit) => `"${hit.text}" (${hit.context.trim().slice(0, 70).replace(/\s+/g, " ")}…)`);
    findings.push({
      category: "expired-content",
      severity: apply(daysStale <= 365 ? "high" : "medium"),
      confidence: "high",
      element: "Expired deadline or campaign date",
      evidence: `${committed.length} date${committed.length === 1 ? "" : "s"} with expiry wording ${committed.length === 1 ? "has" : "have"} already passed: ${examples.join("; ")}.`,
      impact: "The page is still promoting an offer or deadline that has closed. Members may attempt to act on it, and content freshness is visibly poor.",
      fix: "Remove or update the expired promotion, and schedule an expiry review date for the campaign so it is retired automatically next time.",
      owner: "Content",
      location: url,
      ...(note ? { note } : {}),
    });
  }

  if (bare.length) {
    const confidence: Confidence = "low";
    findings.push({
      category: "expired-content",
      severity: apply("low"),
      confidence,
      element: "Past dates without expiry wording",
      evidence: `${bare.length} past date${bare.length === 1 ? "" : "s"} appear on the page: ${bare.slice(0, 5).map((hit) => `"${hit.text}"`).join(", ")}.`,
      impact: "These may be legitimate historical references (past events, prior-year reports, superseded regulation) rather than defects.",
      fix: "Review only if the page is meant to present current information. No action needed for genuine archive content.",
      owner: "Content",
      location: url,
      ...(note ? { note } : {}),
    });
  }

  const copyright = /(?:©|&copy;|copyright)\s*(?:\d{4}\s*[-–]\s*)?(\d{4})/i.exec(text);
  if (copyright) {
    const year = Number(copyright[1]);
    if (year < now.getUTCFullYear()) {
      findings.push({
        category: "expired-content",
        severity: apply("low"),
        confidence: "medium",
        element: "Copyright year",
        evidence: `The footer shows ${year}, but the current year is ${now.getUTCFullYear()}.`,
        impact: "A stale copyright year suggests to visitors that the site is not actively maintained.",
        fix: "Render the copyright year dynamically rather than hard-coding it.",
        owner: "Engineering",
        location: url,
        ...(note ? { note } : {}),
      });
    }
  }

  return { findings, exclusionsApplied };
}
