"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, ExternalLink, Link2Off, LoaderCircle, Search, TriangleAlert } from "lucide-react";
import type { AuditFinding, WebsiteAudit } from "@/lib/website-audit";
import { CATEGORY_LABEL, SEVERITY_LABEL, SEVERITY_ORDER, type QualityFinding } from "@/lib/audit-findings";
import { recordAuditRun } from "@/lib/audit-history";
import { primaryActionClass } from "@/app/tool-ui";
import { consumeAssistantRun } from "@/app/assistant-run";

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

export function AuditForm({ initialReport = null, reportOnly = false }: { initialReport?: WebsiteAudit | null; reportOnly?: boolean }) {
  const [url, setUrl] = useState("");
  const [report, setReport] = useState<WebsiteAudit | null>(initialReport);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyWarning, setHistoryWarning] = useState("");
  const [assistantStarting, setAssistantStarting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const assistantRunStarted = useRef(false);

  useEffect(() => {
    if (reportOnly) return;
    const params = new URLSearchParams(window.location.search);
    const requestedUrl = params.get("url");
    if (requestedUrl) {
      setUrl(requestedUrl);
      if (consumeAssistantRun(params) && !assistantRunStarted.current) {
        assistantRunStarted.current = true;
        setAssistantStarting(true);
        const timer = window.setTimeout(() => { setAssistantStarting(false); void runAudit(requestedUrl); }, 650);
        return () => window.clearTimeout(timer);
      } else inputRef.current?.focus();
    }
  }, []);

  async function runAudit(targetUrl: string) {
    setLoading(true);
    setError("");
    setHistoryWarning("");
    setReport(null);
    try {
      const response = await fetch("/api/audits", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });
      const payload = await response.json() as { ok: boolean; report?: WebsiteAudit; error?: string };
      if (!response.ok || !payload.report) throw new Error(payload.error || "Audit failed");
      setReport(payload.report);
      const history = recordAuditRun(payload.report);
      if (history[0]?.ranAt !== payload.report.checkedAt) setHistoryWarning("Your report is ready, but this browser could not save its history. Storage may be full or disabled. Keep this report open if you need its evidence.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Audit failed");
    } finally {
      setLoading(false);
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (assistantStarting) return;
    void runAudit(url);
  }

  return (
    <>
      {!reportOnly && <form className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6" onSubmit={submit} aria-busy={loading}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2"><h2 className="m-0 text-base font-bold text-[#090d46]">Start your website check</h2><span className="text-sm text-slate-600">Usually takes about a minute</span></div>
        <label className="mb-2 block text-sm font-bold text-[#090d46]" htmlFor="audit-url">Website URL</label>
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-300 bg-white p-2 pl-4 focus-within:border-[#00539d] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#00539d]">
          <Search className="shrink-0 text-slate-400" size={19} />
          <input className="h-11 min-w-0 flex-1 border-0 bg-transparent text-base text-slate-800 outline-none placeholder:text-slate-500" ref={inputRef} id="audit-url" type="text" inputMode="url" autoComplete="url" aria-describedby="audit-scope" placeholder="https://your-website.com" value={url} onChange={(event) => setUrl(event.target.value)} required disabled={loading || assistantStarting} />
          <button className={primaryActionClass + ` w-full sm:w-auto ${assistantStarting ? "animate-pulse ring-4 ring-blue-100 motion-reduce:animate-none" : ""}`} type="submit" disabled={loading || assistantStarting}>{loading ? <LoaderCircle className="animate-spin motion-reduce:animate-none" size={17} /> : null}{assistantStarting ? "Starting audit…" : loading ? "Checking website…" : "Check my website"}{!loading && !assistantStarting ? <ArrowRight size={17} /> : null}</button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span>Just exploring?</span>
          <button className="min-h-11 cursor-pointer rounded-md border-0 bg-transparent px-1 text-sm font-bold text-[#00539d] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-[#00539d] disabled:opacity-50" type="button" disabled={loading} onClick={() => { setUrl("https://example.com"); inputRef.current?.focus(); }}>Try example.com</button>
        </div>
        <p className="mt-2 mb-0 text-sm leading-6 text-slate-600" id="audit-scope">Checks one public page and up to 80 links. Nothing is changed on the website.</p>
      </form>}
      {!reportOnly && assistantStarting && <p className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm font-bold text-[#00539d]" role="status">Assistant filled the URL. Starting Website Audit…</p>}
      {!reportOnly && loading && (
        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-5" role="status" aria-live="polite">
          <div className="flex items-center gap-3"><LoaderCircle className="animate-spin text-[#00539d]" size={20} /><div><strong className="block text-sm text-[#090d46]">Checking your page</strong><small className="text-xs text-slate-600">Fetching, checking links and metadata, rendering JavaScript, then preparing the report. Keep this tab open.</small></div></div>
        </div>
      )}
      {!reportOnly && error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>}
      {!reportOnly && historyWarning && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">{historyWarning}</p>}
      {report && (
        <section className="audit-report" aria-live="polite">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="m-0 min-w-0 text-2xl font-bold break-words text-[#090d46]">{report.page.title || new URL(report.finalUrl).hostname}</h2>
            <a className="inline-flex min-h-11 shrink-0 items-center gap-2 text-sm font-bold text-[#00539d] underline" href={report.finalUrl} target="_blank" rel="noreferrer">Open page <ExternalLink size={14} /></a>
          </div>
          <article className={`mb-5 rounded-xl p-5 ${report.qualityReport.findings.length ? "bg-amber-50 text-amber-900" : "bg-teal-50 text-teal-900"}`}>
            <h3 className="m-0 text-lg leading-7 font-bold text-inherit">{report.qualityReport.findings.length ? `${report.qualityReport.findings.length} confirmed findings to review` : "The checks that ran found a healthy foundation."}</h3><p className="mt-2 mb-0 text-sm leading-6">{report.qualityReport.firstActions[0] || "Review the evidence coverage below, then keep monitoring after future releases."}</p>
          </article>
          <div className="audit-score-grid">
            <article title={report.seo.methodology}><span>Technical SEO</span><strong>{report.seo.score}</strong><small>/ 100 · {report.seo.rating}</small><em>{report.seo.confidence} confidence</em></article>
            <article title={report.aiVisibility.methodology}><span>AI visibility</span><strong>{report.aiVisibility.score}</strong><small>/ 100 · {report.aiVisibility.rating}</small><em>{report.aiVisibility.confidence} confidence</em></article>
            <article><span>Broken links</span><strong>{report.links.broken.length}</strong><small>of {report.links.checked} checked</small></article>
            <article><span>JS dependency</span><strong>{report.page.javascriptDependencyPercent === null ? "—" : `${report.page.javascriptDependencyPercent}%`}</strong><small>{report.page.rendering === "complete" ? "rendered comparison" : "browser unavailable"}</small></article>
          </div>
          <p className="score-disclaimer">Scores are weighted diagnostics, not rankings. Confidence reflects browser rendering, robots availability and checked-link coverage.</p>
          {report.summary && <article className="my-5 rounded-xl bg-blue-50 p-5 text-[#090d46]"><h3 className="m-0 text-base font-bold">AI summary</h3><p className="mt-2 mb-0 text-sm leading-6">{report.summary}</p></article>}

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
