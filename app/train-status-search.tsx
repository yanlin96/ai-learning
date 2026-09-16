"use client";

import { useEffect, useRef, useState } from "react";
import { VlineStatus } from "@/app/vline-status";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  LoaderCircle,
  Search,
  TrainFront,
} from "lucide-react";
import type { Disruption } from "@/lib/disruptions";
import type { TrainLine } from "@/lib/train-lines";

type TrainStatusSearchProps = {
  lines: TrainLine[];
  initialLine: TrainLine | null;
  initialDisruptions: Disruption[];
  initialUnavailable: boolean;
  checkedAt: string;
  sourceUrl: string;
};

const melbourneTime = new Intl.DateTimeFormat("en-AU", {
  timeZone: "Australia/Melbourne",
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function TrainStatusSearch({
  lines,
  initialLine,
  initialDisruptions,
  initialUnavailable,
  checkedAt,
  sourceUrl,
}: TrainStatusSearchProps) {
  const [network, setNetwork] = useState("metro");
  useEffect(() => { if (new URLSearchParams(window.location.search).get("network") === "vline") setNetwork("vline"); }, []);
  const [selectedLine, setSelectedLine] = useState(initialLine);
  const [query, setQuery] = useState(initialLine?.name ?? "");
  const [disruptions, setDisruptions] = useState(initialDisruptions);
  const [unavailable, setUnavailable] = useState(initialUnavailable);
  const [updatedAt, setUpdatedAt] = useState(checkedAt);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const request = useRef<AbortController | null>(null);

  const normalizedQuery = query.trim().toLowerCase();
  const queryIsCurrentLine = normalizedQuery === selectedLine?.name.toLowerCase();
  const filteredLines = !normalizedQuery || queryIsCurrentLine
    ? lines
    : lines.filter((line) => line.name.toLowerCase().includes(normalizedQuery));
  const hasWarnings = disruptions.length > 0;

  async function selectLine(line: TrainLine) {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setSelectedLine(line);
    setQuery(line.name);
    setOpen(false);
    setLoading(true);
    setUnavailable(false);
    window.history.replaceState(null, "", `/disruptions?lineId=${encodeURIComponent(line.id)}`);

    try {
      const response = await fetch(`/api/disruptions?lineId=${encodeURIComponent(line.id)}`, {
        signal: controller.signal,
      });
      const payload = await response.json() as {
        disruptions?: Disruption[];
        checkedAt?: string;
      };
      if (!response.ok) throw new Error("Live status is unavailable");
      setDisruptions(payload.disruptions ?? []);
      setUpdatedAt(payload.checkedAt ?? new Date().toISOString());
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setDisruptions([]);
      setUnavailable(true);
      setUpdatedAt(new Date().toISOString());
    } finally {
      if (request.current === controller) setLoading(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") setOpen(false);
    if (event.key === "Enter" && open && filteredLines[0]) {
      event.preventDefault();
      void selectLine(filteredLines[0]);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2 border-b border-[#dce5f0] pb-4" role="group" aria-label="Train operator">
        {[{ id: "metro", name: "Metro · Melbourne" }, { id: "vline", name: "V/Line · Regional" }].map((operator) => <button key={operator.id} type="button" aria-pressed={network === operator.id} onClick={() => {
          setNetwork(operator.id);
          if (operator.id === "metro") window.history.replaceState(null, "", `/disruptions?lineId=${encodeURIComponent(selectedLine?.id ?? "werribee")}`);
        }} className={`rounded-lg border-0 px-4 py-3 text-sm font-semibold transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005aaa] ${network === operator.id ? "bg-[#005aaa] text-white" : "bg-[#edf4fc] text-[#284968] hover:bg-[#dceafa]"}`}>{operator.name}</button>)}
      </div>
      {network === "vline" ? <VlineStatus/> : <>
      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
        <div>
          <h2 className="m-0 text-base font-bold text-[#090d46]">Which train line are you taking?</h2>
          <p className="mt-1 mb-0 text-sm leading-6 text-slate-600">Search metropolitan train lines below.</p>
        </div>

        <div
          className="relative flex items-center gap-3 rounded-lg border border-slate-300 px-3 focus-within:border-[#00539d] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#00539d]"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
          }}
        >
          <Search size={19} aria-hidden="true" />
          <input
            className="h-12 w-full min-w-0 border-0 bg-transparent text-base text-[#090d46] outline-none placeholder:text-slate-500"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search a train line"
            role="combobox"
            aria-label="Search Melbourne train lines"
            aria-expanded={open}
            aria-controls="train-line-options"
            aria-autocomplete="list"
          />
          {open ? (
            <div className="absolute top-[calc(100%+8px)] right-0 left-0 z-10 max-h-72 overflow-y-auto rounded-xl border border-slate-300 bg-white p-2" id="train-line-options" role="listbox">
              {filteredLines.length ? filteredLines.map((line) => (
                <button
                  type="button"
                  className="flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-lg border-0 bg-white px-3 py-2 text-left text-sm text-[#090d46] hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-[#00539d]"
                  role="option"
                  aria-selected={selectedLine?.id === line.id}
                  key={line.id}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => void selectLine(line)}
                >
                  <i className="size-2 shrink-0 rounded-full" style={{ background: line.color }} />
                  <span>{line.name}</span>
                  {selectedLine?.id === line.id ? <CheckCircle2 size={16} /> : null}
                </button>
              )) : <p>No matching train lines.</p>}
            </div>
          ) : null}
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6" aria-live="polite" aria-busy={loading}>
        <div className="flex flex-wrap items-start gap-3">
          <span className={`mt-1 shrink-0 ${unavailable || hasWarnings ? "text-amber-800" : "text-teal-700"}`}>
            {loading ? <LoaderCircle className="animate-spin motion-reduce:animate-none" size={24} /> : unavailable || hasWarnings ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
          </span>
          <div>
            <h2 className="m-0 text-xl leading-7 font-bold text-[#090d46]">{selectedLine?.name ?? "Train status"}</h2>
            <p className="mt-1 mb-0 text-sm leading-6 text-slate-600">
              {loading
                ? "Checking live service updates…"
                : unavailable
                  ? "Unable to check right now"
                  : hasWarnings
                    ? `${disruptions.length} current or upcoming ${disruptions.length === 1 ? "notice" : "notices"}`
                    : "No current disruptions found"}
            </p>
          </div>
          <span className="ml-auto text-xs leading-6 text-slate-600">Checked {melbourneTime.format(new Date(updatedAt))} · Melbourne time</span>
        </div>

        {unavailable && !loading && <a className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-bold text-[#00539d] underline focus-visible:outline-2 focus-visible:outline-[#00539d]" href={sourceUrl} target="_blank" rel="noreferrer">Check official service updates <ArrowUpRight size={17} /></a>}
        {!loading && hasWarnings ? (
          <div className="mt-5 divide-y divide-slate-200">
            {disruptions.map((item) => (
              <article className="py-5 first:pt-0" key={item.id}>
                <h3 className="mt-0 mb-2 text-base leading-6 font-bold text-[#090d46]">{item.detail}</h3>
                <div className="mb-3 flex flex-wrap items-center gap-3 text-sm leading-6 text-slate-700">
                  <span className={`rounded-md px-2 py-1 text-xs font-bold ${item.severity === "major" ? "bg-amber-50 text-amber-800" : "bg-blue-50 text-[#00539d]"}`}>{item.severity === "major" ? "Service change" : "Notice"}</span>
                  <span className="inline-flex items-start gap-2"><CalendarDays className="mt-1 shrink-0 text-[#00539d]" size={17} aria-hidden="true" /><span><span className="sr-only">When: </span>{item.period}</span></span>
                  <span className="inline-flex items-center gap-2"><TrainFront className="shrink-0 text-[#00539d]" size={17} aria-hidden="true" /><span><span className="sr-only">Affects: </span>{item.line}</span></span>
                </div>
                {item.description ? <p className="m-0 max-w-[75ch] text-sm leading-6 text-slate-600">{item.description}</p> : null}
              </article>
            ))}
          </div>
        ) : !loading ? (
          <p className="mt-3 mb-0 text-sm leading-6 text-slate-600">
            {unavailable
              ? "Try again by selecting the line, or use the official Transport Victoria source."
              : `${selectedLine?.name ?? "This line"} has no listed service or station notices right now.`}
          </p>
        ) : null}

        {!unavailable && <a className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-bold text-[#00539d] underline focus-visible:outline-2 focus-visible:outline-[#00539d]" href={sourceUrl} target="_blank" rel="noreferrer">
          View official Transport Victoria updates <ArrowUpRight size={17} />
        </a>}
      </section>
      </>}
    </div>
  );
}
