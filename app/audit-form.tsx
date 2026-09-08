"use client";

import { useState } from "react";
import { Bot, CheckCircle2, ExternalLink, Link2Off, LoaderCircle, Search, TriangleAlert } from "lucide-react";
import type { AuditFinding, WebsiteAudit } from "@/lib/website-audit";
import { CATEGORY_LABEL, SEVERITY_LABEL, SEVERITY_ORDER, type QualityFinding } from "@/lib/audit-findings";

function FindingRow({ finding }: { finding: QualityFinding }) {
  return (
    <div className="finding-row">
      <span className={`finding-severity ${finding.severity}`}>
        <b>{SEVERITY_LABEL[finding.severity]}</b>
        <small>{finding.confidence} confidence</small>
      </span>
      <span>
        <strong>{finding.element}</strong>
        <small>{CATEGORY_LABEL[finding.category]}</small>
      </span>
      <span>
        {finding.evidence}
        {finding.location && <small>{finding.location}</small>}
      </span>
      <span className="finding-impact">{finding.impact}</span>
      <span>
        {finding.fix}
        {finding.note && <small className="finding-note">{finding.note}</small>}
      </span>
      <span className="finding-owner">{finding.owner}</span>
    </div>
  );
}

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
        <p>Checks one public page and up to 80 links for broken destinations, accessibility defects, expired content, and crawler access. Private network addresses are blocked.</p>
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

          <article className={`audit-panel broken-panel${report.links.broken.length ? " has-issues" : ""}`}>
            <div className="link-panel-head">
              <div>
                <h3><Link2Off size={19} /> Broken links</h3>
                <p>
                  {report.links.checked} of {report.links.discovered} discovered links checked; internal links are prioritised
                  {report.links.unchecked > 0 ? `, ${report.links.unchecked} not reached within the time budget` : ""}.
                </p>
              </div>
              <b className={report.links.broken.length ? "has-broken" : "all-clear"}>
                {report.links.broken.length ? `${report.links.broken.length} found` : "None found"}
              </b>
            </div>
            {report.links.broken.length > 0 ? (
              <ul className="broken-list">
                {report.links.broken.map((link) => (
                  <li key={link.url} className={link.internal ? "internal" : "external"}>
                    <div>
                      <strong>{link.text || "Link without visible text"}</strong>
                      <a href={link.url} target="_blank" rel="noreferrer">{link.url}</a>
                      <small>{link.internal ? "Internal" : "External"} · {link.source === "both" ? "Initial + rendered DOM" : `${link.source} DOM`}</small>
                    </div>
                    <b className={link.status === 404 || link.status === 410 ? "gone" : link.status && link.status >= 500 ? "server" : "unreachable"}>
                      {link.status || link.error || "Failed"}
                    </b>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="audit-note">Every checked link resolved successfully.</p>
            )}
          </article>

          <article className="audit-panel google-tools">
            <div><p className="label">VERIFY WITH GOOGLE</p><h3>Google SEO check</h3><p>Use Search Console URL Inspection to verify how Google crawls and indexes the page. Site ownership is required.</p></div>
            <div className="google-tool-links">
              <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer">Search Console URL Inspection <ExternalLink size={14} /></a>
            </div>
          </article>

          <article className="audit-panel">
            <div className="link-panel-head">
              <div>
                <h3>Quality &amp; Fix Report</h3>
                <p>{report.qualityReport.findings.length} confirmed issue{report.qualityReport.findings.length === 1 ? "" : "s"}, ordered by severity then confidence.</p>
              </div>
              <b className={report.qualityReport.severityCounts.critical + report.qualityReport.severityCounts.high ? "has-broken" : "all-clear"}>
                {report.qualityReport.contextualAnalysis === "complete" ? "Deterministic + contextual" : "Deterministic checks only"}
              </b>
            </div>
            <div className="severity-row">
              {SEVERITY_ORDER.map((severity) => (
                <div key={severity} className={`severity-tile ${severity}`}>
                  <span>{SEVERITY_LABEL[severity]}</span>
                  <strong>{report.qualityReport.severityCounts[severity]}</strong>
                </div>
              ))}
            </div>
            {report.qualityReport.findings.length === 0 ? (
              <p className="audit-note">No issues were confirmed by the checks that ran. Review the &ldquo;not verified&rdquo; list below before treating this page as clean.</p>
            ) : (
              <div className="findings-table">
                <div className="findings-head">
                  <span>Severity</span><span>Element</span><span>Evidence</span><span>Impact</span><span>Recommended fix</span><span>Owner</span>
                </div>
                {report.qualityReport.findings.map((finding, index) => (
                  <FindingRow key={`${finding.element}-${index}`} finding={finding} />
                ))}
              </div>
            )}
            {report.qualityReport.exclusionsApplied.length > 0 && (
              <p className="audit-note"><strong>Exclusions applied:</strong> this URL matched archive rule{report.qualityReport.exclusionsApplied.length === 1 ? "" : "s"} {report.qualityReport.exclusionsApplied.map((rule) => `"${rule}"`).join(", ")}, so date-related findings were downgraded one severity level.</p>
            )}
            {report.qualityReport.contextualAnalysis !== "complete" && (
              <p className="audit-note"><strong>Contextual analysis {report.qualityReport.contextualAnalysis}:</strong> only deterministic markup and HTTP checks contributed to this report. Language-model review of the copy needs OPENAI_API_KEY to be configured.</p>
            )}
          </article>

          <div className="audit-columns">
            <article className="audit-panel">
              <h3>Verified in this run</h3>
              <ul className="note-list">
                {report.qualityReport.verified.map((item) => <li key={item}><CheckCircle2 size={15} /><span>{item}</span></li>)}
              </ul>
            </article>
            <article className="audit-panel">
              <h3>Not verified — still needs a human</h3>
              <ul className="note-list warning">
                {report.qualityReport.notVerified.map((item) => <li key={item}><TriangleAlert size={15} /><span>{item}</span></li>)}
              </ul>
            </article>
          </div>

          {(report.qualityReport.firstActions.length > 0 || report.qualityReport.quickWins.length > 0) && (
            <div className="audit-columns">
              <article className="audit-panel">
                <h3>First three actions</h3>
                <ol className="action-list">{report.qualityReport.firstActions.map((item) => <li key={item}>{item}</li>)}</ol>
                {report.qualityReport.quickWins.length > 0 && <>
                  <h3 className="stacked-heading">Quick wins</h3>
                  <ul className="note-list">{report.qualityReport.quickWins.map((item) => <li key={item}><CheckCircle2 size={15} /><span>{item}</span></li>)}</ul>
                </>}
              </article>
              <article className="audit-panel">
                <h3>Retest checklist</h3>
                <ul className="note-list">{report.qualityReport.retestChecklist.map((item) => <li key={item}><CheckCircle2 size={15} /><span>{item}</span></li>)}</ul>
              </article>
            </div>
          )}
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
        </section>
      )}
    </>
  );
}
