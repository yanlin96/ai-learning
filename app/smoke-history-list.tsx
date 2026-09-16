"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Play, Trash2 } from "lucide-react";
import { clearSmokeHistory, readSmokeHistory, removeSmokeDomain, type SmokeDomainHistory } from "@/lib/smoke-history";
import { SmokeUrlResults } from "@/app/smoke-url-results";
import { HistoryEmptyState, HistorySearch } from "@/app/tool-ui";

const timeFormat = new Intl.DateTimeFormat("en-AU", {
  day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Australia/Melbourne",
});
const resultStyle = { pass: "bg-teal-50 text-teal-800", warning: "bg-amber-50 text-amber-800", fail: "bg-red-50 text-red-800" };

export function SmokeHistoryList() {
  const [groups, setGroups] = useState<SmokeDomainHistory[] | null>(null);
  const [query, setQuery] = useState("");
  useEffect(() => setGroups(readSmokeHistory()), []);
  if (groups === null) return <p className="text-sm text-slate-500" role="status">Loading smoke-test history…</p>;
  if (!groups.length) return <HistoryEmptyState title="Your release checks start here" description="Run a smoke test to save its release recommendation and URL-by-URL evidence. Records stay in this browser, separate from your website audits." href="/smoke-test" action="Run a smoke test" />;
  const filtered = groups.filter((group) => group.domain.includes(query.toLowerCase().trim()));
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <HistorySearch label="Search smoke history by domain" placeholder="Find a domain…" value={query} onChange={setQuery} />
        <span className="text-sm text-slate-600">{filtered.length} of {groups.length} domains · 10 maximum</span>
        <button className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-600" type="button" onClick={() => { clearSmokeHistory(); setGroups([]); }}><Trash2 size={14} /> Clear smoke history</button>
      </div>
      {filtered.map((group) => (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white" key={group.domain}>
          <header className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-5">
            <div className="min-w-0"><h2 className="m-0 text-lg font-extrabold break-all text-[#090d46]">{group.domain}</h2><p className="mt-1 mb-0 text-xs text-slate-500">{group.runs.length} saved runs · newest first</p></div>
            <button className="grid size-11 cursor-pointer place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-[#00539d]" type="button" aria-label={"Delete smoke history for " + group.domain} onClick={() => setGroups(removeSmokeDomain(group.domain))}><Trash2 size={17} /></button>
          </header>
          {group.runs.map((run) => (
            <details className="border-t border-slate-200" key={run.id}>
              <summary className="cursor-pointer p-5 text-sm text-[#090d46]">
                <span className={"mr-3 inline-block rounded-md px-2 py-1 text-xs font-extrabold uppercase " + resultStyle[run.result]}>{run.result === "warning" ? "Pass with warnings" : run.result}</span>
                <strong>{timeFormat.format(new Date(run.checkedAt))}</strong>
                <span className="mt-2 block text-xs leading-6 text-slate-500">{run.checked} checked · {run.counts.pass} passed · {run.counts.warning} warnings · {run.counts.fail} failed · {run.browserChecked} browser checks · {run.skipped} not checked</span>
                <span className="mt-1 block text-xs font-bold text-[#00539d]">Expand URL results</span>
              </summary>
              <div className="space-y-4 px-4 pb-5 sm:px-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="m-0 text-xs leading-6 text-slate-500">Melbourne time. {run.discovered ?? run.checked + run.skipped} discovered URLs; {run.skipped} not checked due to scope or time limits. Unchecked URLs are not passes or failures.</p>
                  <Link className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-[#00539d] no-underline" href={"/smoke-test?url=" + encodeURIComponent(run.baseUrl || "https://" + group.domain) + "&limit=" + run.requestedLimit}><Play size={12} /> Run again</Link>
                </div>
                {run.pages ? <SmokeUrlResults pages={run.pages} embedded /> : (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="mt-0 text-sm text-amber-900">This older run saved issue samples only, not all URLs. Run it again to save complete URL results.</p>
                    <ul className="mb-0 space-y-2 pl-5 text-xs leading-5">{run.issueSamples.map((issue) => <li key={issue.url}><a className="break-all text-[#00539d]" href={issue.url} target="_blank" rel="noreferrer">{issue.url}</a><span className="block text-slate-600">{issue.issues.join(" · ") || issue.status}</span></li>)}</ul>
                  </div>
                )}
              </div>
            </details>
          ))}
        </article>
      ))}
      {!filtered.length && <p className="p-5 text-sm text-slate-500">No matching domains.</p>}
    </div>
  );
}
