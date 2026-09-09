export type LinkCheckClassification = "ok" | "broken" | "inconclusive";

/**
 * A bot rejection or missing response does not prove that a link is broken for a
 * human visitor. Keep those results visible without counting them as defects.
 */
export function classifyLinkStatus(status: number | null, ok: boolean): LinkCheckClassification {
  if (ok) return "ok";
  if (status === null || [401, 403, 405, 408, 425, 429].includes(status)) return "inconclusive";
  return status >= 400 ? "broken" : "inconclusive";
}
