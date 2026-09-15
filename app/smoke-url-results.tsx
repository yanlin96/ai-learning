"use client";

import { useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import type { SmokeHistoryPage } from "@/lib/smoke-history";

const statusStyles = {
  pass: "bg-teal-50 text-teal-800",
  warning: "bg-amber-50 text-amber-800",
  fail: "bg-red-50 text-red-800",
};
const PAGE_SIZE = 20;

export function SmokeUrlResults({ pages }: { pages: SmokeHistoryPage[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [pageNumber, setPageNumber] = useState(1);
  const filtered = pages.filter((page) =>
    (status === "all" || page.status === status) &&
    `${page.url} ${page.title} ${page.issues.join(" ")}`.toLowerCase().includes(query.toLowerCase().trim()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(pageNumber, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const shown = filtered.slice(start, start + PAGE_SIZE);

  return (
    <section className="rounded-xl border border-slate-200 bg-white" aria-label="URL results">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 p-4">
        <div className="min-w-0 flex-1">
          <h3 className="m-0 mb-3 text-base font-extrabold text-[#090d46]">All checked URLs <span className="text-sm font-normal text-slate-500">({pages.length})</span></h3>
          <label className="mb-1.5 block text-xs font-bold text-slate-600">Search URL, title or issue
            <span className="mt-1.5 flex items-center gap-2 rounded-lg border border-slate-300 px-3 focus-within:border-[#00539d] focus-within:ring-2 focus-within:ring-blue-100">
              <Search className="shrink-0 text-slate-400" size={16} />
              <input className="h-10 w-full min-w-0 border-0 bg-transparent text-sm font-normal outline-none" type="search" value={query} placeholder="/contact, sitemap, missing title…" onChange={(event) => { setQuery(event.target.value); setPageNumber(1); }} />
            </span>
          </label>
        </div>
        <label className="mb-1.5 block text-xs font-bold text-slate-600">Result
          <select className="mt-1.5 block h-[42px] rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal" value={status} onChange={(event) => { setStatus(event.target.value); setPageNumber(1); }}>
            <option value="all">All results ({pages.length})</option>
            {(["fail", "warning", "pass"] as const).map((value) => <option key={value} value={value}>{value === "warning" ? "Warnings" : value === "pass" ? "Passed" : "Failed"} ({pages.filter((page) => page.status === value).length})</option>)}
          </select>
        </label>
      </div>
      <div className="max-h-[560px] overflow-y-auto">
        {shown.map((page) => (
          <article className="border-b border-slate-100 p-4 last:border-b-0" key={page.url}>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`rounded-md px-2 py-1 font-extrabold uppercase ${statusStyles[page.status]}`}>{page.status}</span>
              <span className="text-slate-600">HTTP <strong>{page.httpStatus ?? "No response"}</strong></span>
              <span className="text-slate-500">{page.responseTimeMs === null ? "Time unavailable" : `${page.responseTimeMs} ms`}</span>
              <span className="text-slate-500">Browser: {page.browser.replaceAll("-", " ")}</span>
              <span className="ml-auto text-slate-500">{page.source === "manual" ? "Priority URL" : "Sitemap"}</span>
            </div>
            <a className="mt-2 flex items-start gap-2 text-sm font-bold break-all text-[#00539d] no-underline hover:underline" href={page.url} target="_blank" rel="noreferrer">{page.url}<ExternalLink className="mt-0.5 shrink-0" size={14} /></a>
            {page.title && <p className="mt-1 mb-0 text-xs leading-5 text-slate-500">{page.title}</p>}
            {page.finalUrl && page.finalUrl !== page.url && <p className="mt-2 mb-0 text-xs break-all text-slate-600">Redirected to: {page.finalUrl}</p>}
            {page.issues.length > 0 ? (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs font-bold text-slate-700">Review {page.issues.length} recorded issue{page.issues.length === 1 ? "" : "s"}</summary>
                <ul className="mt-2 mb-0 space-y-1 pl-5 text-xs leading-5 break-words text-slate-600">{page.issues.map((issue, index) => <li key={index}>{issue}</li>)}</ul>
              </details>
            ) : <p className="mt-2 mb-0 text-xs text-teal-700">Essential checks passed. Browser coverage is shown separately above.</p>}
          </article>
        ))}
        {!shown.length && <p className="m-0 p-6 text-sm text-slate-500">No URLs match these filters.</p>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4 text-xs text-slate-500" aria-live="polite">
        <span>{filtered.length ? `${start + 1}–${Math.min(start + PAGE_SIZE, filtered.length)} of ${filtered.length}` : "0 results"} · {pages.length} URL results saved</span>
        <div className="flex items-center gap-3">
          <button className="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 disabled:cursor-default disabled:opacity-40" type="button" disabled={currentPage <= 1} onClick={() => setPageNumber(currentPage - 1)}>Previous</button>
          <span>{currentPage} / {totalPages}</span>
          <button className="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 disabled:cursor-default disabled:opacity-40" type="button" disabled={currentPage >= totalPages} onClick={() => setPageNumber(currentPage + 1)}>Next</button>
        </div>
      </div>
    </section>
  );
}
