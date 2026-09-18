export type WorkspaceAssistantAction =
  | { type: "run_website_audit"; url: string; href: string }
  | { type: "run_accessibility_audit"; url: string; href: string }
  | { type: "run_smoke_test"; url: string; href: string }
  | { type: "navigate"; destination: "audit_history" | "smoke_history" | "train_status"; href: string };

export type WorkspaceAssistantResult = {
  reply: string;
  action?: WorkspaceAssistantAction;
  nextIntent: WorkspaceAssistantRunIntent | null;
};

export type WorkspaceAssistantRunIntent = "website_audit" | "accessibility_audit" | "smoke_test";
export type WorkspaceAssistantSemanticIntent = WorkspaceAssistantRunIntent | "audit_history" | "smoke_history" | "train_status" | "capabilities" | "unknown";

export const ASSISTANT_SUGGESTIONS = [
  "What can CPA Tools do?",
  "Audit a website",
  "Estimate accessibility",
  "Run a smoke test",
] as const;

const CAPABILITY_REPLY = "I can run a Website Audit for SEO, GEO and broken links; an Accessibility Estimate; or a multi-page Smoke Test, then open a private result page. I can also open audit histories or Metro and V/Line information. Send a public URL with the check you want.";

export function extractPublicUrl(message: string) {
  const explicit = message.match(/(?:https?:\/\/|www\.)[^\s<>{}\[\]"']+/i);
  const bare = explicit ? null : message.match(/(?:^|\s)((?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s<>{}\[\]"']*)?)/i);
  const candidate = (explicit?.[0] || bare?.[1])?.replace(/[),.;!?，。！？；：]+$/, "");
  if (!candidate) return null;
  try {
    const value = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function isUrlOnlyMessage(message: string) {
  return /^(?:https?:\/\/|www\.)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s<>{}\[\]"']*)?[),.;!?，。！？；：]*$/i.test(message.trim());
}

function runHref(path: string, url: string) {
  return `${path}?url=${encodeURIComponent(url)}&run=1&source=assistant`;
}

export function workspaceResultForIntent(intent: WorkspaceAssistantSemanticIntent, url: string | null): WorkspaceAssistantResult {
  if (intent === "capabilities") return { reply: CAPABILITY_REPLY, nextIntent: null };
  if (intent === "audit_history") return { reply: "Website Audit History is ready to open.", action: { type: "navigate", destination: "audit_history", href: "/history" }, nextIntent: null };
  if (intent === "smoke_history") return { reply: "Smoke Test History is ready to open.", action: { type: "navigate", destination: "smoke_history", href: "/smoke-test/history" }, nextIntent: null };
  if (intent === "train_status") return { reply: "Train Line Status is ready to open for Metro notices and V/Line predictions.", action: { type: "navigate", destination: "train_status", href: "/disruptions" }, nextIntent: null };
  if (intent === "accessibility_audit") {
    if (!url) return { reply: "Paste the public page URL you want me to check for detectable accessibility barriers.", nextIntent: intent };
    return { reply: "I matched this to Accessibility Estimate.", action: { type: "run_accessibility_audit", url, href: runHref("/accessibility", url) }, nextIntent: null };
  }
  if (intent === "smoke_test") {
    if (!url) return { reply: "Paste the public site URL you want to smoke test. The standard scope checks up to 30 pages.", nextIntent: intent };
    return { reply: "I matched this to the standard Smoke Test.", action: { type: "run_smoke_test", url, href: runHref("/smoke-test", url) }, nextIntent: null };
  }
  if (intent === "website_audit") {
    if (!url) return { reply: "Paste the public page URL you want to audit for SEO, GEO and broken links.", nextIntent: intent };
    return { reply: "I matched this to Website Audit.", action: { type: "run_website_audit", url, href: runHref("/website-audit", url) }, nextIntent: null };
  }
  return { reply: `${CAPABILITY_REPLY} Try “Audit https://example.com” or choose one of the suggestions below.`, nextIntent: null };
}

export function matchWorkspaceMessage(message: string, pendingIntent: WorkspaceAssistantRunIntent | null = null): WorkspaceAssistantResult | null {
  const text = message.trim();
  const url = extractPublicUrl(text);

  if (!text) return { reply: "Type a question or paste a public website URL to begin.", nextIntent: pendingIntent };
  if (/(what can|what do you|help|capabilit|功能|能做什么|可以做什么|帮助)/i.test(text)) return workspaceResultForIntent("capabilities", url);
  if (/(smoke history|release history|冒烟.*历史|发布.*历史)/i.test(text)) return workspaceResultForIntent("smoke_history", url);
  if (/(audit history|审计.*历史|历史.*审计)/i.test(text)) return workspaceResultForIntent("audit_history", url);
  if (/(train|metro|v\/?line|火车|列车|线路)/i.test(text) && !url) return workspaceResultForIntent("train_status", url);

  const wantsAccessibility = /(accessib|accessil|accessa|a11y|wcag|无障碍|可访问性)/i.test(text) || Boolean(url && pendingIntent === "accessibility_audit");
  const wantsSmoke = /(smoke|release check|release test|冒烟|发布检查|发布测试)/i.test(text) || Boolean(url && pendingIntent === "smoke_test");
  const wantsAudit = /(audit|seo|geo|broken link|quality|审计|坏链|死链|网站检查|网站质量)/i.test(text) || Boolean(url && pendingIntent === "website_audit");

  if (wantsAccessibility) return workspaceResultForIntent("accessibility_audit", url);
  if (wantsSmoke) return workspaceResultForIntent("smoke_test", url);
  if (wantsAudit || (url && isUrlOnlyMessage(text))) return workspaceResultForIntent("website_audit", url);
  return null;
}

export function interpretWorkspaceMessage(message: string, pendingIntent: WorkspaceAssistantRunIntent | null = null): WorkspaceAssistantResult {
  return matchWorkspaceMessage(message, pendingIntent) || workspaceResultForIntent("unknown", extractPublicUrl(message));
}
