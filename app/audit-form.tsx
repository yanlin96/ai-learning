"use client";

import { useState } from "react";
import { Bot, CheckCircle2, ExternalLink, Link2Off, LoaderCircle, Search, TriangleAlert } from "lucide-react";
import type { AuditFinding, WebsiteAudit } from "@/lib/website-audit";

function Finding({ finding }: { finding: AuditFinding }) {
  const Icon = finding.level === "pass" ? CheckCircle2 : finding.level === "error" ? Link2Off : TriangleAlert;
  return (
    <li className={`audit-finding ${finding.level}`}>
      <Icon size={18} />
      <span><strong>{finding.title}</strong><small>{finding.detail}</small></span>
    </li>
  );
}

export function AuditForm() {
  const [url, setUrl] = useState("");
  const [report, setReport] = useState<WebsiteAudit | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setReport(null);
    try {
      const response = await fetch("/api/audits", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const payload = await response.json() as { ok: boolean; report?: WebsiteAudit; error?: string };
      if (!response.ok || !payload.report) throw new Error(payload.error || "Audit failed");
      setReport(payload.report);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Audit failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form className="audit-form" onSubmit={submit}>
        <label htmlFor="audit-url">Public website URL</label>
        <div>
          <Search size={19} />
          <input id="audit-url" type="text" inputMode="url" placeholder="https://example.com" value={url} onChange={(event) => setUrl(event.target.value)} required />
          <button type="submit" disabled={loading}>{loading ? <LoaderCircle className="spin" size={17} /> : <Bot size={17} />}{loading ? "Auditing…" : "Run audit"}</button>
        </div>
        <p>Checks one public page and up to 30 links. Private network addresses are blocked.</p>
      </form>
      {error && <p className="audit-error" role="alert">{error}</p>}
      {report && (
        <section className="audit-report" aria-live="polite">
          <div className="audit-report-head">
            <div><p className="eyebrow">AUDIT COMPLETE</p><h2>{report.page.title || new URL(report.finalUrl).hostname}</h2></div>
            <a href={report.finalUrl} target="_blank" rel="noreferrer">Open page <ExternalLink size={14} /></a>
          </div>
          <div className="audit-score-grid">
            <article title={report.seo.methodology}><span>Technical SEO</span><strong>{report.seo.score}</strong><small>/ 100 · {report.seo.rating}</small><em>{report.seo.confidence} confidence</em></article>
            <article title={report.aiVisibility.methodology}><span>AI visibility</span><strong>{report.aiVisibility.score}</strong><small>/ 100 · {report.aiVisibility.rating}</small><em>{report.aiVisibility.confidence} confidence</em></article>
            <article><span>Broken links</span><strong>{report.links.broken.length}</strong><small>of {report.links.checked} checked</small></article>
            <article><span>JS dependency</span><strong>{report.page.javascriptDependencyPercent === null ? "—" : `${report.page.javascriptDependencyPercent}%`}</strong><small>{report.page.rendering === "complete" ? "rendered comparison" : "browser unavailable"}</small></article>
          </div>
          <p className="score-disclaimer">Scores are weighted diagnostics, not Google rankings. Confidence reflects browser rendering, robots availability, and checked-link coverage.</p>
          {report.summary && <article className="audit-summary"><p className="label">AI SUMMARY</p><p>{report.summary}</p></article>}
          <div className="audit-columns">
            <article className="audit-panel"><h3>SEO checks</h3><ul>{report.seo.findings.map((finding, index) => <Finding key={`${finding.title}-${index}`} finding={finding} />)}</ul></article>
            <article className="audit-panel"><h3>AI crawler readiness</h3><ul>{report.aiVisibility.findings.map((finding, index) => <Finding key={`${finding.title}-${index}`} finding={finding} />)}</ul></article>
          </div>
          <article className="audit-panel crawler-panel">
            <h3>AI crawler access</h3>
            <div className="crawler-table">
              <div className="crawler-table-head"><strong>Crawler</strong><span>Purpose</span><span>robots.txt</span><span>HTTP</span><span>Result</span></div>
              {report.aiVisibility.crawlers.map((crawler) => {
                const result = crawler.robotsAllowed === false
                  ? { label: "Robots denied", tone: "blocked" }
                  : crawler.accessible
                    ? { label: "Reachable", tone: "allowed" }
                    : crawler.httpStatus !== null
                      ? { label: "HTTP rejected", tone: "blocked" }
                      : { label: "Request failed", tone: "unknown" };
                return <div key={crawler.name} title={crawler.requestError}>
                  <strong>{crawler.name}</strong>
                  <span>{crawler.purpose}</span>
                  <b className={crawler.robotsAllowed === false ? "blocked" : crawler.robotsAllowed === true ? "allowed" : "unknown"}>{crawler.robotsAllowed === false ? "Disallowed" : crawler.robotsAllowed === true ? "Allowed" : "Unknown"}</b>
                  <small>{crawler.httpStatus ?? "No response"}</small>
                  <b className={result.tone}>{result.label}</b>
                </div>;
              })}
            </div>
            <p className="audit-note"><strong>How to read this:</strong> “Robots denied” means robots.txt explicitly disallows the crawler. “HTTP rejected” means robots permits it, but the server or firewall returned an unsuccessful response. “Request failed” means no HTTP response was obtained. None of these results verifies actual indexing or citation.</p>
          </article>
          <article className="audit-panel google-tools">
            <div><p className="label">VERIFY WITH GOOGLE</p><h3>Google SEO check</h3><p>Use Search Console URL Inspection to verify how Google crawls and indexes the page. Site ownership is required.</p></div>
            <div className="google-tool-links">
              <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer">Search Console URL Inspection <ExternalLink size={14} /></a>
            </div>
          </article>
          <article className="audit-panel">
            <div className="link-panel-head"><div><h3>Broken links</h3><p>{report.links.checked} of {report.links.discovered} discovered links checked; internal links are prioritised.</p></div><b className={report.links.broken.length ? "has-broken" : "all-clear"}>{report.links.broken.length ? `${report.links.broken.length} found` : "None found"}</b></div>
            {report.links.broken.length > 0 && <ul className="broken-list">{report.links.broken.map((link) => <li key={link.url}>
              <div><strong>{link.text || "Link without visible text"}</strong><a href={link.url} target="_blank" rel="noreferrer">{link.url}</a><small>{link.internal ? "Internal" : "External"} · {link.source === "both" ? "Initial + rendered DOM" : `${link.source} DOM`}</small></div>
              <b>{link.status || link.error || "Failed"}</b>
            </li>)}</ul>}
          </article>
        </section>
      )}
    </>
  );
}
