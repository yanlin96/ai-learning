"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ExternalLink, Play, Trash2 } from "lucide-react";
import { CATEGORY_LABEL, SEVERITY_LABEL, SEVERITY_ORDER } from "@/lib/audit-findings";
import { clearAuditHistory, readAuditHistory, type AuditHistoryEntry } from "@/lib/audit-history";

const timeFormat = new Intl.DateTimeFormat("en-AU", {
  day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Australia/Melbourne",
});
const severityStyle = { critical: "bg-red-50 text-red-800", high: "bg-orange-50 text-orange-800", medium: "bg-blue-50 text-blue-800", low: "bg-slate-100 text-slate-600" };

export function HistoryList() {
  const [entries, setEntries] = useState<AuditHistoryEntry[] | null>(null);
  const [query, setQuery] = useState("");
  useEffect(() => setEntries(readAuditHistory()), []);
  if (entries === null) return <p className="text-sm text-slate-500" role="status">Loading audit history…</p>;
  if (!entries.length) return <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"><p className="mt-0 font-bold text-[#090d46]">No audits saved in this tab yet.</p><Link className="inline-flex rounded-lg bg-[#00539d] px-4 py-3 text-sm font-bold text-white no-underline" href="/website-audit">Run your first website audit</Link></div>;
  const filtered = entries.filter((entry) => (entry.url + " " + entry.title).toLowerCase().includes(query.toLowerCase().trim()));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input className="h-11 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-100" type="search" aria-label="Search audit history by page or URL" placeholder="Find a page or URL…" value={query} onChange={(event) => setQuery(event.target.value)} />
        <span className="text-xs text-slate-500">{filtered.length} of {entries.length} runs</span>
        <button className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-600" type="button" onClick={() => { clearAuditHistory(); setEntries([]); }}><Trash2 size={14} /> Clear audit history</button>
      </div>
      {filtered.map((entry) => (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white" key={entry.id}>
          <div className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="m-0 text-base font-extrabold break-words text-[#090d46]">{entry.title || new URL(entry.url).hostname}</h2>
                <a className="mt-2 inline-flex items-start gap-2 text-xs break-all text-[#00539d] no-underline hover:underline" href={entry.url} target="_blank" rel="noreferrer">{entry.url}<ExternalLink className="shrink-0" size={13} /></a>
                <p className="mt-2 mb-0 text-xs text-slate-500">{timeFormat.format(new Date(entry.ranAt))} · Melbourne time</p>
              </div>
              <Link className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-[#00539d] no-underline" href={"/website-audit?url=" + encodeURIComponent(entry.url)}><Play size={12} /> Run again</Link>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[["SEO", entry.seoScore + "/100"], ["GEO / AI visibility", entry.aiScore + "/100"], ["Broken links", entry.brokenLinks], ["Link coverage", entry.linksChecked + "/" + entry.linksDiscovered]].map(([label, value]) => <div className="rounded-lg bg-slate-50 px-3 py-2" key={label}><small className="block text-[11px] text-slate-500">{label}</small><strong className="mt-1 block text-lg text-[#090d46]">{value}</strong></div>)}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {SEVERITY_ORDER.filter((severity) => entry.severityCounts[severity] > 0).map((severity) => <span className={"rounded-md px-2 py-1 text-xs font-bold " + severityStyle[severity]} key={severity}>{entry.severityCounts[severity]} {SEVERITY_LABEL[severity]}</span>)}
              {!entry.findingsTotal && <span className="text-xs text-teal-700">No confirmed findings in checks that ran</span>}
            </div>
          </div>
          <details className="border-t border-slate-200">
            <summary className="cursor-pointer bg-slate-50 px-5 py-3 text-sm font-bold text-[#00539d]">View findings, fixes and evidence coverage</summary>
            <div className="space-y-4 p-5">
              {entry.findings === undefined ? <p className="m-0 text-sm text-slate-500">This older run saved scores only. Run it again to capture detailed findings and fixes.</p> : (
                <>
                  {!!entry.firstActions?.length && <div className="rounded-xl bg-blue-50 p-4"><h3 className="m-0 text-sm text-[#090d46]">Recommended next actions</h3><ol className="mt-2 mb-0 space-y-1 pl-5 text-sm leading-6 text-slate-700">{entry.firstActions.map((action, index) => <li key={index}>{action}</li>)}</ol></div>}
                  {entry.findings.map((finding, index) => (
                    <div className="rounded-xl border border-slate-200 p-4" key={index}>
                      <div className="flex flex-wrap items-center gap-2 text-xs"><span className={"rounded px-2 py-1 font-bold " + severityStyle[finding.severity]}>{SEVERITY_LABEL[finding.severity]}</span><span className="text-slate-500">{CATEGORY_LABEL[finding.category]} · {finding.confidence} confidence · {finding.owner}</span></div>
                      <h3 className="mt-2 mb-2 text-sm text-[#090d46]">{finding.element}</h3>
                      <p className="mt-0 mb-2 text-sm leading-6 break-words text-slate-600"><strong>Evidence: </strong>{finding.evidence}</p>
                      {finding.location && <p className="text-xs break-all text-slate-500">Location: {finding.location}</p>}
                      <p className="my-2 text-sm leading-6 text-slate-600"><strong>Impact: </strong>{finding.impact}</p>
                      <p className="my-0 text-sm leading-6 text-slate-700"><strong>Fix: </strong>{finding.fix}</p>
                      {finding.note && <p className="mb-0 text-xs text-slate-500">{finding.note}</p>}
                    </div>
                  ))}
                  {!entry.findings.length && <p className="text-sm text-teal-700">No confirmed findings. This does not mean every possible issue was tested.</p>}
                </>
              )}
              {entry.coverage && <p className="m-0 rounded-lg bg-slate-50 p-3 text-xs leading-6 text-slate-600">Browser rendering: {entry.coverage.rendering} · SEO confidence: {entry.coverage.seoConfidence} · GEO / AI confidence: {entry.coverage.aiConfidence}<br />{entry.coverage.unchecked} links not checked · {entry.coverage.inconclusive} inconclusive · {entry.contextual ? "Contextual analysis included" : "Deterministic checks only"}</p>}
              {!!entry.notVerified?.length && <div><h3 className="text-sm text-[#090d46]">Not verified — still needs a human</h3><ul className="space-y-1 pl-5 text-xs leading-5 text-slate-500">{entry.notVerified.map((note, index) => <li key={index}>{note}</li>)}</ul></div>}
            </div>
          </details>
        </article>
      ))}
      {!filtered.length && <p className="p-5 text-sm text-slate-500">No matching audits.</p>}
    </div>
  );
}
