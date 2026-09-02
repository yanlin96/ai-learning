import robotsParser from "robots-parser";

export function isCrawlerAllowed(
  robotsUrl: string,
  content: string,
  targetUrl: string,
  userAgent: string,
) {
  return robotsParser(robotsUrl, content).isAllowed(targetUrl, userAgent) ?? true;
}
