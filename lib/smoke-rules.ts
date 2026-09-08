export type SmokeStatus = "pass" | "warning" | "fail";

export type SmokeSignals = {
  httpStatus: number | null;
  contentType: string;
  title: string;
  h1Count: number;
  noindex: boolean;
  errorText: string | null;
  redirected: boolean;
  requestError?: string;
};

export function evaluateSmokeSignals(signals: SmokeSignals): { status: SmokeStatus; issues: string[] } {
  const issues: string[] = [];
  if (signals.requestError || signals.httpStatus === null) {
    return { status: "fail", issues: [signals.requestError || "No HTTP response"] };
  }
  if (signals.httpStatus >= 400) issues.push(`HTTP ${signals.httpStatus}`);
  if (signals.errorText) issues.push(`Visible error text: “${signals.errorText}”`);
  if (issues.length) return { status: "fail", issues };

  if (!signals.contentType.includes("text/html")) issues.push(`Expected HTML, received ${signals.contentType || "an unknown content type"}`);
  if (!signals.title) issues.push("Missing page title");
  if (signals.h1Count === 0) issues.push("Missing H1");
  if (signals.h1Count > 1) issues.push(`${signals.h1Count} H1 elements`);
  if (signals.noindex) issues.push("Page is marked noindex");
  if (signals.redirected) issues.push("URL redirected");
  return { status: issues.length ? "warning" : "pass", issues };
}
