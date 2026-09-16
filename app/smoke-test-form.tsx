"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, Gauge, LoaderCircle, XCircle } from "lucide-react";
import type { SmokeTestReport } from "@/lib/smoke-test";
import { recordSmokeRun } from "@/lib/smoke-history";
import { SmokeUrlResults } from "@/app/smoke-url-results";
import { fieldClass, primaryActionClass } from "@/app/tool-ui";

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
  const [historyWarning, setHistoryWarning] = useState("");

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
    setHistoryWarning("");
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
      const history = recordSmokeRun(payload.report);
      if (!history.some((group) => group.runs[0]?.checkedAt === payload.report!.checkedAt)) setHistoryWarning("Your results are ready, but this browser could not save the run. Storage may be full or disabled. Keep this report open to review all URL results.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Smoke test failed");
    } finally {
      setLoading(false);
    }
  }

  const outcome = report ? RESULT_COPY[report.result] : null;

  return (
    <>
      <form className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6" onSubmit={submit} aria-busy={loading}>
        <div className="mb-5 hidden flex-wrap items-center justify-between gap-2 sm:flex">
          <h2 className="m-0 text-base font-bold text-[#090d46]">Choose the pages to cover</h2>
          <span className="text-sm text-slate-600">Read-only checks</span>
        </div>
        <label className="mb-2 block text-sm font-bold text-[#090d46]" htmlFor="smoke-base">Website URL</label>
        <input className={fieldClass} id="smoke-base" type="text" inputMode="url" placeholder="https://www.example.com" value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} required disabled={loading} />
        <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:gap-6">
          <details className="order-2 min-w-0 rounded-lg border border-slate-200 md:order-1">
            <summary className="min-h-11 cursor-pointer rounded-lg px-3 py-3 text-sm font-bold text-[#00539d] focus-visible:outline-2 focus-visible:outline-[#00539d]">Priority URLs &amp; custom limit</summary>
            <div className="border-t border-slate-200 p-3">
            <label className="mb-2 block text-sm text-slate-600" htmlFor="smoke-limit-number">Custom page limit (1–100)</label>
            <input className={fieldClass} id="smoke-limit-number" type="number" min={1} max={100} value={limit} disabled={loading} onChange={(event) => setLimit(Math.max(1, Math.min(100, Number(event.target.value) || 1)))} aria-describedby="smoke-budget-help" />
            <div className="mt-4">
            <label className="mb-2 block text-sm font-bold text-[#090d46]" htmlFor="smoke-manual">Priority URLs <span className="font-normal text-slate-600">(optional, one per line)</span></label>
            <textarea className={fieldClass + " resize-y text-sm leading-6"} id="smoke-manual" rows={6} placeholder={"/login\n/contact-us\nhttps://www.example.com/member-centre"} value={manualText} onChange={(event) => setManualText(event.target.value)} disabled={loading} aria-describedby="smoke-priority-help" />
            <p id="smoke-priority-help" className="mt-2 mb-0 text-sm leading-6 text-slate-600">Priority URLs run first. Remaining capacity is filled from the site’s sitemap.xml.</p>
            </div></div>
          </details>
          <div className="order-1 md:order-2">
            <fieldset className="m-0 min-w-0 border-0 p-0" disabled={loading}>
            <legend className="mb-2 p-0 text-sm font-bold text-[#090d46]">Maximum pages</legend>
            <div className="grid grid-cols-3 gap-2">
              {[{ label: "Quick", value: 10 }, { label: "Standard", value: 30 }, { label: "Full", value: 100 }].map((preset) => (
                <button type="button" key={preset.value} aria-pressed={limit === preset.value} className={`min-h-16 cursor-pointer rounded-lg border px-2 py-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00539d] disabled:cursor-wait disabled:opacity-60 ${limit === preset.value ? "border-[#00539d] bg-blue-50 text-[#00539d]" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`} onClick={() => setLimit(preset.value)}><strong className="block">{preset.label}</strong><span className="mt-1 block">{preset.value} pages</span></button>
              ))}
            </div>
            </fieldset>
            <p id="smoke-budget-help" className="mt-2 mb-3 text-sm leading-6 text-slate-600">Up to {limit} pages; runs may stop at the server time limit.</p>
            <button className={primaryActionClass + " w-full"} type="submit" disabled={loading}>
              {loading ? <LoaderCircle className="animate-spin motion-reduce:animate-none" size={17} /> : <Gauge size={17} />}
              {loading ? "Running smoke test…" : "Run smoke test"}
            </button>
          </div>
        </div>
      </form>
      {loading && <p className="mt-4 rounded-xl bg-blue-50 p-4 text-sm leading-6 text-[#00539d]" role="status">Checking priority URLs and sitemap pages. Browser checks follow; larger runs can take longer. Keep this page open for the results.</p>}
      {error && <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-800" role="alert">{error} Check the website URL and try again.</p>}
      {historyWarning && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">{historyWarning}</p>}
      {report && outcome && (
        <section className="mt-8 space-y-4" aria-live="polite">
          <article className={`rounded-xl p-5 ${report.result === "pass" ? "bg-teal-50 text-teal-900" : report.result === "warning" ? "bg-amber-50 text-amber-900" : "bg-red-50 text-red-900"}`}>
            <div className="flex items-start gap-3"><outcome.Icon className="mt-0.5 shrink-0" size={24} aria-hidden="true" />
            <div><h2 className="m-0 text-xl font-bold text-inherit">{outcome.label}</h2><p className="mt-2 mb-0 text-sm leading-6">{outcome.detail}</p></div></div>
            <dl className="mt-5 mb-0 grid grid-cols-2 gap-4 border-t border-current/20 pt-4 text-sm sm:grid-cols-4">
              {[["Checked", report.checked], ["Passed", report.counts.pass], ["Warnings", report.counts.warning], ["Failed", report.counts.fail]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd className="m-0 mt-1 text-xl font-bold tabular-nums">{value}</dd></div>)}
            </dl>
          </article>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm leading-6 text-slate-600">
            <span>Sitemap: <strong>{report.sitemap}</strong></span>
            <span>{report.discovered} URLs discovered</span>
            <span>{report.browserChecked} browser verified (maximum {report.browserLimit})</span>
            {report.skipped > 0 && <span>{report.skipped} not checked due to scope or time limits</span>}
          </div>
          <SmokeUrlResults pages={report.pages.map((page) => ({ ...page, issues: [...page.issues, ...page.browserIssues] }))} />
        </section>
      )}
    </>
  );
}
