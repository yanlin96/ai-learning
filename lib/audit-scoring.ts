export type AuditConfidence = "high" | "medium" | "low";
export type AuditRating = "Excellent" | "Good" | "Needs work" | "Critical";

export type AuditScore = {
  score: number;
  rating: AuditRating;
  confidence: AuditConfidence;
  methodology: string;
};

type SeoScoreInput = {
  noindex: boolean;
  titleLength: number;
  descriptionLength: number;
  h1Count: number;
  hasCanonical: boolean;
  imageCount: number;
  missingAlt: number;
  brokenInternal: number;
  brokenExternal: number;
  renderingComplete: boolean;
  robotsKnown: boolean;
  linksDiscovered: number;
  linksChecked: number;
};

type AiScoreInput = {
  noindex: boolean;
  crawlers: Array<{ name: string; robotsAllowed: boolean | null; accessible: boolean }>;
  javascriptDependencyPercent: number | null;
  rawTextLength: number;
  hasStructuredData: boolean;
  renderingComplete: boolean;
  linksDiscovered: number;
  linksChecked: number;
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function rating(score: number): AuditRating {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 50) return "Needs work";
  return "Critical";
}

function confidence(renderingComplete: boolean, robotsKnown: boolean, discovered: number, checked: number): AuditConfidence {
  const linkCoverage = discovered === 0 ? 1 : checked / discovered;
  const gaps = Number(!renderingComplete) + Number(!robotsKnown) + Number(linkCoverage < 0.75);
  return gaps === 0 ? "high" : gaps === 1 ? "medium" : "low";
}

export function scoreSeo(input: SeoScoreInput): AuditScore {
  let value = 100;
  if (input.noindex) value -= 35;
  if (!input.titleLength) value -= 15;
  else if (input.titleLength < 15 || input.titleLength > 65) value -= 4;
  if (!input.descriptionLength) value -= 6;
  else if (input.descriptionLength < 50 || input.descriptionLength > 170) value -= 3;
  if (input.h1Count === 0) value -= 8;
  else if (input.h1Count > 1) value -= 4;
  if (!input.hasCanonical) value -= 4;
  if (input.imageCount) value -= Math.round(8 * input.missingAlt / input.imageCount);
  value -= Math.min(24, input.brokenInternal * 6);
  value -= Math.min(8, input.brokenExternal * 2);
  const finalScore = clamp(value);
  return {
    score: finalScore,
    rating: rating(finalScore),
    confidence: confidence(input.renderingComplete, input.robotsKnown, input.linksDiscovered, input.linksChecked),
    methodology: "Weighted technical signals: indexability 35%, metadata and headings 33%, links 24%, images 8%.",
  };
}

export function scoreAiVisibility(input: AiScoreInput): AuditScore {
  let value = 100;
  const crawler = (name: string) => input.crawlers.find((item) => item.name === name);
  const searchCrawler = crawler("OAI-SearchBot");
  if (searchCrawler?.robotsAllowed === false) value -= 30;
  else if (searchCrawler && !searchCrawler.accessible) value -= 25;
  else if (searchCrawler?.robotsAllowed === null) value -= 10;
  for (const name of ["ClaudeBot", "PerplexityBot"]) {
    const item = crawler(name);
    if (item?.robotsAllowed === false || (item && !item.accessible)) value -= 10;
    else if (item?.robotsAllowed === null) value -= 4;
  }
  const userVisit = crawler("ChatGPT-User");
  if (userVisit && !userVisit.accessible) value -= 8;
  if (input.noindex) value -= 10;
  if (input.javascriptDependencyPercent === null) value -= 10;
  else if (input.javascriptDependencyPercent > 80) value -= 25;
  else if (input.javascriptDependencyPercent > 60) value -= 18;
  else if (input.javascriptDependencyPercent > 20) value -= 8;
  if (input.rawTextLength < 150) value -= 8;
  if (!input.hasStructuredData) value -= 3;
  const robotsKnown = input.crawlers.every((item) => item.robotsAllowed !== null);
  const finalScore = clamp(value);
  return {
    score: finalScore,
    rating: rating(finalScore),
    confidence: confidence(input.renderingComplete, robotsKnown, input.linksDiscovered, input.linksChecked),
    methodology: "Weighted readiness signals: search-crawler access 50%, initial HTML and JavaScript dependency 35%, indexability and structured content 15%. Training-bot permission is not scored.",
  };
}
