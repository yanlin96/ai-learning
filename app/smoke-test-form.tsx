"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, ExternalLink, Gauge, LoaderCircle, XCircle } from "lucide-react";
import type { SmokeTestReport } from "@/lib/smoke-test";
import { recordSmokeRun } from "@/lib/smoke-history";

const RESULT_COPY = {
  pass: { label: "PASS", detail: "All checked pages passed the smoke checks.", Icon: CheckCircle2 },
  warning: { label: "PASS WITH WARNINGS", detail: "The site is reachable, but some pages need review.", Icon: CircleAlert },
  fail: { label: "FAIL", detail: "At least one checked page has a release-blocking failure.", Icon: XCircle },
};

export function SmokeTestForm() {
  const [baseUrl, setBaseUrl] = useState("");
  const [manualText, setManualText] = useState("");
  const [limit, setLimit] = useState(30);
  const [report, setReport] = useState<SmokeTestReport | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedUrl = params.get("url");
    const requestedLimit = Number(params.get("limit"));
    if (requestedUrl) setBaseUrl(requestedUrl);
    if (requestedLimit >= 1 && requestedLimit <= 100) setLimit(requestedLimit);
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setReport(null);
    try {
      const manualUrls = manualText.split(/\r?\n|,/).map((value) => value.trim()).filter(Boolean);
      const response = await fetch("/api/smoke-tests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ baseUrl, manualUrls, limit }),
      });
      const payload = await response.json() as { ok: boolean; report?: SmokeTestReport; error?: string };
      if (!response.ok || !payload.report) throw new Error(payload.error || "Smoke test failed");
      setReport(payload.report);
      recordSmokeRun(payload.report);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Smoke test failed");
    } finally {
      setLoading(false);
    }
  }

  const outcome = report ? RESULT_COPY[report.result] : null;

  return (
    <>
      <form className="smoke-form" onSubmit={submit}>
        <div className="smoke-form-head">
          <div><p className="label">TEST SCOPE</p><h2>Choose the pages to cover</h2></div>
          <span>Read-only checks</span>
        </div>
        <label htmlFor="smoke-base">Website URL</label>
        <input id="smoke-base" type="text" inputMode="url" placeholder="https://www.example.com" value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} required />
        <div className="smoke-form-grid">
          <div>
            <label htmlFor="smoke-manual">Priority URLs <small>optional, one per line</small></label>
            <textarea id="smoke-manual" rows={6} placeholder={"/login\n/contact-us\nhttps://www.example.com/member-centre"} value={manualText} onChange={(event) => setManualText(event.target.value)} />
            <p>Priority URLs run first. Remaining capacity is filled from the site’s sitemap.xml.</p>
          </div>
          <div>
            <label>Maximum pages</label>
            <div className="scope-presets">
              {[{ label: "Quick", value: 10 }, { label: "Standard", value: 30 }, { label: "Full", value: 100 }].map((preset) => (
                <button type="button" key={preset.value} aria-pressed={limit === preset.value} className={limit === preset.value ? "active" : ""} onClick={() => setLimit(preset.value)}><strong>{preset.label}</strong><small>{preset.value} pages</small></button>
              ))}
            </div>
            <label className="custom-limit" htmlFor="smoke-limit-number">Or enter a custom limit</label>
            <input id="smoke-limit-number" type="number" min={1} max={100} value={limit} onChange={(event) => setLimit(Math.max(1, Math.min(100, Number(event.target.value) || 1)))} />
            <p>Larger runs may stop at the server time budget.</p>
            <button type="submit" disabled={loading}>
              {loading ? <LoaderCircle className="spin" size={17} /> : <Gauge size={17} />}
              {loading ? "Running smoke test…" : "Run smoke test"}
            </button>
          </div>
        </div>
      </form>
      {error && <p className="audit-error" role="alert">{error}</p>}
      {report && outcome && (
        <section className="smoke-report" aria-live="polite">
          <article className={`smoke-outcome ${report.result}`}>
            <outcome.Icon size={30} />
            <div><p className="label">RELEASE RECOMMENDATION</p><h2>{outcome.label}</h2><p>{outcome.detail}</p></div>
            <div className="smoke-counts">
              <span><strong>{report.checked}</strong> checked</span>
              <span className="pass"><strong>{report.counts.pass}</strong> passed</span>
              <span className="warning"><strong>{report.counts.warning}</strong> warnings</span>
              <span className="fail"><strong>{report.counts.fail}</strong> failed</span>
            </div>
          </article>
          <div className="smoke-run-note">
            <span>Sitemap: <strong>{report.sitemap}</strong></span>
            <span>{report.discovered} URLs discovered</span>
            <span>{report.browserChecked} browser verified (maximum {report.browserLimit})</span>
            {report.skipped > 0 && <span>{report.skipped} not checked due to scope or time limits</span>}
          </div>
          <article className="smoke-results">
            <div className="smoke-results-head"><span>Result</span><span>Page</span><span>HTTP</span><span>Time</span><span>Browser</span><span>Checks</span></div>
            {report.pages.map((page) => (
              <div className="smoke-result-row" key={page.url}>
                <b className={page.status}>{page.status}</b>
                <span className="smoke-result-page">
                  <strong>{page.title || new URL(page.url).pathname || "Homepage"}</strong>
                  <a href={page.url} target="_blank" rel="noreferrer">{page.url} <ExternalLink size={12} /></a>
                  <small>{page.source === "manual" ? "Priority URL" : "Sitemap"}{page.finalUrl && page.finalUrl !== page.url ? ` → ${page.finalUrl}` : ""}</small>
                </span>
                <strong>{page.httpStatus ?? "—"}</strong>
                <span>{page.responseTimeMs === null ? "—" : `${page.responseTimeMs} ms`}</span>
                <b className={`browser-state ${page.browser}`}>{page.browser.replace("-", " ")}</b>
                <span>{[...page.issues, ...page.browserIssues].length ? [...page.issues, ...page.browserIssues].join(" · ") : "Essential checks passed"}</span>
              </div>
            ))}
          </article>
        </section>
      )}
    </>
  );
}
