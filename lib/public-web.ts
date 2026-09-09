import "server-only";

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const DEFAULT_TIMEOUT_MS = 12_000;

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

export function normalizePublicUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Enter a website URL");
  return new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
}

export async function assertPublicUrl(url: URL) {
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only HTTP and HTTPS URLs are supported");
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

export async function safePublicFetch(
  url: URL,
  init: RequestInit = {},
  redirects = 0,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  redirectTrace: number[] = [],
): Promise<Response> {
  if (redirects > 5) throw new Error("Too many redirects");
  await assertPublicUrl(url);
  const response = await fetch(url, {
    ...init,
    redirect: "manual",
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      "user-agent": "PASWebsiteQualityChecker/1.0",
      accept: "text/html,application/xhtml+xml,*/*;q=0.8",
      ...init.headers,
    },
  });
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    redirectTrace.push(response.status);
    const location = response.headers.get("location");
    if (!location) return response;
    return safePublicFetch(new URL(location, url), init, redirects + 1, timeoutMs, redirectTrace);
  }
  return response;
}
