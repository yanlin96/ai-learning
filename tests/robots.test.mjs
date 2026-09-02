import assert from "node:assert/strict";
import test from "node:test";
import robotsParser from "robots-parser";

const robotsUrl = "https://www.example.com/robots.txt";
const suppliedRules = `
User-agent: *
Allow: /
Disallow: /*.mvc
Disallow: /search*
Disallow: /showcase*
`;

function isCrawlerAllowed(content, targetUrl, userAgent) {
  return robotsParser(robotsUrl, content).isAllowed(targetUrl, userAgent) ?? true;
}

test("a wildcard extension rule does not block ordinary pages", () => {
  assert.equal(isCrawlerAllowed(suppliedRules, "https://www.example.com/about-us", "OAI-SearchBot"), true);
});

test("wildcard rules block only matching URLs", () => {
  assert.equal(isCrawlerAllowed(suppliedRules, "https://www.example.com/course.mvc", "OAI-SearchBot"), false);
  assert.equal(isCrawlerAllowed(suppliedRules, "https://www.example.com/search?q=tax", "GPTBot"), false);
  assert.equal(isCrawlerAllowed(suppliedRules, "https://www.example.com/showcase/accounting", "ClaudeBot"), false);
});

test("a crawler-specific group overrides the wildcard group", () => {
  const content = `${suppliedRules}\nUser-agent: GPTBot\nDisallow: /\n`;
  assert.equal(isCrawlerAllowed(content, "https://www.example.com/about-us", "GPTBot"), false);
  assert.equal(isCrawlerAllowed(content, "https://www.example.com/about-us", "OAI-SearchBot"), true);
});
