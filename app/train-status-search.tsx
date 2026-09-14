"use client";

import { useRef, useState } from "react";
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
    <div className="train-finder">
      <div className="train-search-panel">
        <div>
          <p className="label">SELECT A LINE</p>
          <h2>Which train line are you taking?</h2>
          <p>Search all Melbourne metropolitan train lines. Live service and station notices appear below.</p>
        </div>

        <div
          className="line-combobox"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
          }}
        >
          <Search size={19} aria-hidden="true" />
          <input
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
            <div className="line-options" id="train-line-options" role="listbox">
              {filteredLines.length ? filteredLines.map((line) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={selectedLine?.id === line.id}
                  key={line.id}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => void selectLine(line)}
                >
                  <i style={{ background: line.color }} />
                  <span>{line.name}</span>
                  {selectedLine?.id === line.id ? <CheckCircle2 size={16} /> : null}
                </button>
              )) : <p>No matching train lines.</p>}
            </div>
          ) : null}
        </div>
      </div>

      <section className={`status-card train-status ${hasWarnings ? "warning" : "clear"}`} aria-live="polite" aria-busy={loading}>
        <div className="status-head">
          <span className="status-icon">
            {loading ? <LoaderCircle className="spin" size={26} /> : unavailable || hasWarnings ? <AlertTriangle size={26} /> : <CheckCircle2 size={26} />}
          </span>
          <div>
            <p className="label">{selectedLine?.name ?? "TRAIN STATUS"}</p>
            <h2>
              {loading
                ? "Checking live service updates…"
                : unavailable
                  ? "Unable to check right now"
                  : hasWarnings
                    ? `${disruptions.length} current or upcoming ${disruptions.length === 1 ? "notice" : "notices"}`
                    : "No current disruptions found"}
            </h2>
          </div>
          <span className="updated">Checked {melbourneTime.format(new Date(updatedAt))}</span>
        </div>

        {!loading && hasWarnings ? (
          <div className="disruption-list">
            {disruptions.map((item) => (
              <article className="disruption" key={item.id}>
                <span className={`severity ${item.severity}`}>{item.severity === "major" ? "SERVICE CHANGE" : "NOTICE"}</span>
                <h3>{item.detail}</h3>
                <div className="disruption-meta">
                  <div><CalendarDays size={17} /><span><small>WHEN</small><strong>{item.period}</strong></span></div>
                  <div><TrainFront size={17} /><span><small>AFFECTS</small><strong>{item.line}</strong></span></div>
                </div>
                {item.description ? <p className="disruption-description">{item.description}</p> : null}
              </article>
            ))}
          </div>
        ) : !loading ? (
          <p className="status-copy">
            {unavailable
              ? "Try again by selecting the line, or use the official Transport Victoria source."
              : `${selectedLine?.name ?? "This line"} has no listed service or station notices right now.`}
          </p>
        ) : null}

        <a className="source-link" href={sourceUrl} target="_blank" rel="noreferrer">
          View official Transport Victoria updates <ArrowUpRight size={17} />
        </a>
      </section>
    </div>
  );
}
