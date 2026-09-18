import "server-only";

import { existsSync } from "node:fs";
import { assertPublicUrl } from "@/lib/public-web";

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

export async function renderPublicPage(url: URL) {
  const [{ chromium: playwrightChromium }, sparticuz] = await Promise.all([
    import("playwright-core"),
    import("@sparticuz/chromium"),
  ]);
  const executablePath = process.env.VERCEL ? await sparticuz.default.executablePath() : localChromePath();
  if (!executablePath) throw new Error("No local Chrome or Edge executable found");
  const browser = await playwrightChromium.launch({ executablePath, headless: true, args: process.env.VERCEL ? sparticuz.default.args : [] });
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
    const navigation = await page.goto(url.href, { waitUntil: "domcontentloaded", timeout: 15_000 });
    await page.waitForLoadState("load", { timeout: 5_000 }).catch(() => undefined);
    await page.waitForTimeout(750);
    return {
      html: await page.content(),
      textLength: (await page.locator("body").innerText()).trim().length,
      status: navigation?.status() ?? null,
      finalUrl: page.url(),
    };
  } finally {
    await browser.close();
  }
}
