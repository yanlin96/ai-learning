"use client";

import { useState } from "react";
import { ArrowRight, Check, CheckCircle2, ExternalLink, Link2Off, LoaderCircle, Search, TriangleAlert } from "lucide-react";
import type { AuditFinding, WebsiteAudit } from "@/lib/website-audit";
import { CATEGORY_LABEL, SEVERITY_LABEL, SEVERITY_ORDER, type QualityFinding } from "@/lib/audit-findings";
import { recordAuditRun } from "@/lib/audit-history";

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
  const [stage, setStage] = useState(0);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setReport(null);
    setStage(0);
    const progress = window.setInterval(() => setStage((current) => Math.min(current + 1, 3)), 1500);
    try {
      const response = await fetch("/api/audits", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const payload = await response.json() as { ok: boolean; report?: WebsiteAudit; error?: string };
      if (!response.ok || !payload.report) throw new Error(payload.error || "Audit failed");
      setReport(payload.report);
      recordAuditRun(payload.report);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Audit failed");
    } finally {
      window.clearInterval(progress);
      setLoading(false);
    }
  }

  return (
    <>
      <form className="audit-form" onSubmit={submit}>
        <div className="audit-form-title"><span>Start a free website check</span><small>Usually takes about a minute</small></div>
        <label htmlFor="audit-url">Website URL</label>
        <div className="audit-url-row">
          <Search size={19} />
          <input id="audit-url" type="text" inputMode="url" placeholder="https://example.com" value={url} onChange={(event) => setUrl(event.target.value)} required />
          <button type="submit" disabled={loading}>{loading ? <LoaderCircle className="spin" size={17} /> : null}{loading ? "Checking website…" : "Check my website"}{!loading ? <ArrowRight size={17} /> : null}</button>
        </div>
        <div className="audit-form-meta">
          <p>Not sure what to try?</p>
          <button type="button" onClick={() => setUrl("https://example.com")}>Use example.com</button>
          <span>Checks one page and up to 80 links. Nothing is changed on the website.</span>
        </div>
      </form>
      {loading && (
        <div className="audit-progress" role="status" aria-live="polite">
          <div className="progress-copy"><span><LoaderCircle className="spin" size={18} /></span><div><strong>{["Fetching the page", "Checking links and metadata", "Rendering JavaScript", "Preparing your report"][stage]}</strong><small>Keep this tab open while the checks finish.</small></div></div>
          <div className="progress-steps">
            {["Fetch", "Links", "Render", "Report"].map((label, index) => <span key={label} className={index < stage ? "complete" : index === stage ? "active" : ""}><i>{index < stage ? <Check size={11} /> : index + 1}</i>{label}</span>)}
          </div>
        </div>
      )}
      {error && <p className="audit-error" role="alert">{error}</p>}
      {report && (
        <section className="audit-report" aria-live="polite">
          <div className="audit-report-head">
            <div><p className="eyebrow">AUDIT COMPLETE</p><h2>{report.page.title || new URL(report.finalUrl).hostname}</h2></div>
            <a href={report.finalUrl} target="_blank" rel="noreferrer">Open page <ExternalLink size={14} /></a>
          </div>
          <article className={`audit-verdict ${report.qualityReport.findings.length ? "attention" : "clear"}`}>
            <span>{report.qualityReport.findings.length}</span>
            <div><p className="label">WHAT TO DO NEXT</p><h3>{report.qualityReport.findings.length ? "Your website is working, but a few issues deserve attention." : "The checks that ran found a healthy foundation."}</h3><p>{report.qualityReport.firstActions[0] || "Review the evidence coverage below, then keep monitoring after future releases."}</p></div>
          </article>
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
                  {report.links.checked} of {report.links.discovered} discovered links checked; internal links are prioritised.
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
            {report.links.unchecked > 0 && (
              <p className="link-coverage-note"><strong>{report.links.unchecked} links were not checked.</strong> {report.links.checked >= 80 ? "This audit reached its 80-link coverage limit; they are not failed or broken links." : "The run ended at its time budget; they are not counted as failed or broken links."}</p>
            )}
            {report.links.inconclusive.length > 0 && (
              <div className="inconclusive-links">
                <h4>{report.links.inconclusive.length} inconclusive link check{report.links.inconclusive.length === 1 ? "" : "s"}</h4>
                <p>These URLs blocked or did not answer the automated checker. They are not counted as broken and should be opened in a normal browser.</p>
                <ul className="broken-list">
                  {report.links.inconclusive.map((link) => (
                    <li key={link.url}>
                      <div><strong>{link.text || "Link without visible text"}</strong><a href={link.url} target="_blank" rel="noreferrer">{link.url}</a></div>
                      <b className="unreachable">{link.status || link.error || "No response"}</b>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {report.links.successful.length > 0 && (
              <details className="healthy-links">
                <summary>View {report.links.successful.length} successful link check{report.links.successful.length === 1 ? "" : "s"}</summary>
                <p>HTTP 2xx responses and successful 3xx redirects are shown for evidence only. They are not errors and do not reduce the score.</p>
                <ul className="broken-list">
                  {report.links.successful.map((link) => (
                    <li key={link.url}>
                      <div>
                        <strong>{link.text || "Link without visible text"}</strong>
                        <a href={link.url} target="_blank" rel="noreferrer">{link.url}</a>
                        <small>
                          {link.internal ? "Internal" : "External"} · {link.source === "both" ? "Initial + rendered DOM" : `${link.source} DOM`}
                          {link.redirected && link.finalUrl ? ` · Final URL: ${link.finalUrl}` : ""}
                        </small>
                      </div>
                      <b className="healthy-status">{[...link.redirectStatuses, link.status].filter((status): status is number => status !== null).join(" → ")}</b>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </article>

          <article className="audit-panel google-tools google-toolkit">
            <div><p className="label">VERIFY WITH GOOGLE</p><h3>Continue with Google’s specialist tools</h3><p>Our audit finds broad technical issues. Use these focused tools for performance, rich results, and authoritative indexing evidence.</p></div>
            <div className="google-tool-links">
              <a href="https://pagespeed.web.dev/" target="_blank" rel="noreferrer"><span><strong>PageSpeed Insights</strong><small>Performance + Core Web Vitals</small></span><ExternalLink size={14} /></a>
              <a href="https://search.google.com/test/rich-results" target="_blank" rel="noreferrer"><span><strong>Rich Results Test</strong><small>Structured data</small></span><ExternalLink size={14} /></a>
              <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer"><span><strong>Search Console</strong><small>Indexing · ownership required</small></span><ExternalLink size={14} /></a>
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
