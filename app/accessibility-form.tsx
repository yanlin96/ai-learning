"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, ExternalLink, LoaderCircle, Search, TriangleAlert } from "lucide-react";
import type { AccessibilityEstimateReport } from "@/lib/accessibility-estimate";
import { CATEGORY_LABEL, SEVERITY_LABEL, SEVERITY_ORDER } from "@/lib/audit-findings";
import { primaryActionClass } from "@/app/tool-ui";
import { consumeAssistantRun } from "@/app/assistant-run";

const severityStyle = {
  critical: "bg-red-50 text-red-800",
  high: "bg-orange-50 text-orange-800",
  medium: "bg-blue-50 text-blue-800",
  low: "bg-slate-100 text-slate-700",
};

export function AccessibilityForm({ initialReport = null, reportOnly = false }: { initialReport?: AccessibilityEstimateReport | null; reportOnly?: boolean }) {
  const [url, setUrl] = useState("");
  const [report, setReport] = useState<AccessibilityEstimateReport | null>(initialReport);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [assistantStarting, setAssistantStarting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const assistantRunStarted = useRef(false);
  useEffect(() => {
    if (reportOnly) return;
    const params = new URLSearchParams(window.location.search);
    const requestedUrl = params.get("url");
    if (!requestedUrl) return;
    setUrl(requestedUrl);
    if (consumeAssistantRun(params) && !assistantRunStarted.current) {
      assistantRunStarted.current = true;
      setAssistantStarting(true);
      const timer = window.setTimeout(() => { setAssistantStarting(false); void runEstimate(requestedUrl); }, 650);
      return () => window.clearTimeout(timer);
    } else inputRef.current?.focus();
  }, []);

  async function runEstimate(targetUrl: string) {
    setLoading(true); setError(""); setReport(null);
    try {
      const response = await fetch("/api/accessibility-audits", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: targetUrl }) });
      const payload = await response.json() as { report?: AccessibilityEstimateReport; error?: string };
      if (!response.ok || !payload.report) throw new Error(payload.error || "Accessibility estimate failed");
      setReport(payload.report);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Accessibility estimate failed"); }
    finally { setLoading(false); }
  }
  function submit(event: React.FormEvent) { event.preventDefault(); if (!assistantStarting) void runEstimate(url); }
  return <>
    {!reportOnly && <form className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6" onSubmit={submit} aria-busy={loading}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2"><h2 className="m-0 text-base font-bold text-[#090d46]">Estimate a public page</h2><span className="text-sm text-slate-600">Usually takes under a minute</span></div>
      <label className="mb-2 block text-sm font-bold text-[#090d46]" htmlFor="accessibility-url">Website URL</label>
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-300 bg-white p-2 pl-4 focus-within:border-[#00539d] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#00539d]">
        <Search className="shrink-0 text-slate-500" size={19}/><input ref={inputRef} id="accessibility-url" className="h-11 min-w-0 flex-1 border-0 bg-transparent text-base text-slate-800 outline-none placeholder:text-slate-500" type="url" inputMode="url" autoComplete="url" placeholder="https://your-website.com" value={url} onChange={event => setUrl(event.target.value)} required disabled={loading || assistantStarting}/>
        <button className={primaryActionClass + ` w-full sm:w-auto ${assistantStarting ? "animate-pulse ring-4 ring-blue-100 motion-reduce:animate-none" : ""}`} type="submit" disabled={loading || assistantStarting}>{loading && <LoaderCircle className="animate-spin motion-reduce:animate-none" size={17}/>} {assistantStarting ? "Starting estimate…" : loading ? "Checking accessibility…" : "Estimate accessibility"} {!loading && !assistantStarting && <ArrowRight size={17}/>}</button>
      </div>
      <div className="mt-2 flex items-center gap-2 text-sm text-slate-600"><span>Just exploring?</span><button className="min-h-11 cursor-pointer border-0 bg-transparent px-1 text-sm font-bold text-[#00539d] underline underline-offset-4" type="button" disabled={loading} onClick={() => { setUrl("https://example.com"); inputRef.current?.focus(); }}>Try example.com</button></div>
      <p className="mt-2 mb-0 text-sm leading-6 text-slate-600">Read-only automated DOM checks. Nothing is changed on the website.</p>
    </form>}
    {!reportOnly && assistantStarting && <p className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm font-bold text-[#00539d]" role="status">Assistant filled the URL. Starting Accessibility Estimate…</p>}
    {!reportOnly && loading && <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-5" role="status"><div className="flex gap-3"><LoaderCircle className="mt-0.5 shrink-0 animate-spin text-[#00539d] motion-reduce:animate-none" size={20}/><div><strong className="block text-sm text-[#090d46]">Inspecting the page</strong><span className="mt-1 block text-sm leading-6 text-slate-600">Loading initial and rendered markup, then checking accessible names, labels and structure.</span></div></div></div>}
    {!reportOnly && error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800" role="alert">{error} If the page opens normally in your browser, its security controls may be blocking automated checks.</p>}
    {report && <section className="mt-8 space-y-5" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="m-0 text-2xl font-bold break-words text-[#090d46]">{report.page.title || new URL(report.finalUrl).hostname}</h2><a className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#00539d] underline" href={report.finalUrl} target="_blank" rel="noreferrer">Open page <ExternalLink size={14}/></a></div>
      {report.page.rendering === "blocked" && <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-950" role="status">
        <div className="flex items-start gap-3"><TriangleAlert className="mt-0.5 shrink-0 text-amber-700" size={20}/><div><h3 className="m-0 text-base font-bold">Partial estimate — browser rendering blocked</h3><p className="mt-1 mb-0 max-w-[72ch] text-sm leading-6">The target site returned its initial HTML, but blocked the automated browser. Dynamic content and interactions were not inspected, so this score has reduced confidence.</p>{report.page.renderingNote && <p className="mt-2 mb-0 text-xs leading-5 text-amber-800">{report.page.renderingNote}</p>}</div></div>
      </div>}
      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        <article className="rounded-xl bg-[#090d46] p-6 text-white"><span className="block text-xs font-bold tracking-wide text-blue-200 uppercase">{report.page.rendering === "blocked" ? "Partial accessibility estimate" : "Accessibility estimate"}</span><strong className="mt-4 block text-5xl font-extrabold">{report.estimate.score}<small className="ml-1 text-sm text-blue-200">/100</small></strong><span className="mt-3 block text-sm text-blue-100">{report.estimate.rating} · {report.estimate.confidence} confidence</span><span className="mt-2 block text-sm text-blue-100">{report.estimate.findingsCount} automated finding{report.estimate.findingsCount === 1 ? "" : "s"}</span></article>
        <article className="rounded-xl border border-slate-200 bg-white p-5"><h3 className="m-0 text-base font-bold text-[#090d46]">What this estimate means</h3><p className="mt-2 mb-0 text-sm leading-6 text-slate-600">It prioritises detectable markup problems. It is not a WCAG compliance result and cannot prove that a page works well for disabled users.</p><div className="mt-4 flex flex-wrap gap-2">{SEVERITY_ORDER.map(severity => <span className={`rounded-md px-2 py-1 text-xs font-bold ${severityStyle[severity]}`} key={severity}>{report.severityCounts[severity]} {SEVERITY_LABEL[severity]}</span>)}</div></article>
      </div>
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"><h3 className="m-0 text-xl font-bold text-[#090d46]">Automated findings</h3>{report.findings.length ? <div className="mt-4 divide-y divide-slate-200">{report.findings.map((finding, index) => <article className="py-5 first:pt-0 last:pb-0" key={`${finding.element}-${index}`}><div className="flex flex-wrap items-center gap-2"><span className={`rounded-md px-2 py-1 text-xs font-bold ${severityStyle[finding.severity]}`}>{SEVERITY_LABEL[finding.severity]}</span><span className="text-xs text-slate-600">{finding.confidence} confidence · {CATEGORY_LABEL[finding.category]} · {finding.owner}</span></div><h4 className="mt-3 mb-2 text-base text-[#090d46]">{finding.element}</h4><p className="my-2 text-sm leading-6 text-slate-600"><strong>Evidence: </strong>{finding.evidence}</p><p className="my-2 text-sm leading-6 text-slate-600"><strong>Impact: </strong>{finding.impact}</p><p className="my-0 text-sm leading-6 text-slate-700"><strong>Recommended fix: </strong>{finding.fix}</p></article>)}</div> : <p className="mt-3 mb-0 flex items-start gap-2 text-sm leading-6 text-teal-700"><CheckCircle2 className="mt-0.5 shrink-0" size={17}/> No issues were found by the automated checks that ran. Manual testing is still required.</p>}</section>
      <div className="grid gap-4 md:grid-cols-2"><article className="rounded-xl border border-slate-200 bg-white p-5"><h3 className="m-0 flex items-center gap-2 text-base text-[#090d46]"><CheckCircle2 className="text-teal-600" size={18}/> Checked automatically</h3><ul className="mb-0 space-y-2 pl-5 text-sm leading-6 text-slate-600">{report.verified.map(item => <li key={item}>{item}</li>)}</ul></article><article className="rounded-xl border border-amber-200 bg-amber-50 p-5"><h3 className="m-0 flex items-center gap-2 text-base text-amber-900"><TriangleAlert size={18}/> Still needs a human</h3><ul className="mb-0 space-y-2 pl-5 text-sm leading-6 text-amber-900">{report.notVerified.map(item => <li key={item}>{item}</li>)}</ul></article></div>
    </section>}
  </>;
}
