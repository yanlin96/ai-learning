"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, LoaderCircle, RefreshCw, TrainFront } from "lucide-react";
import type { TrainLine } from "@/lib/train-lines";
import type { RegionalTrip } from "@/lib/vline-rules";

type Results = { trips: RegionalTrip[]; stale: boolean; unmatchedTrips: number; feedUpdatedAt: string | null; checkedAt: string };
const time = new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Melbourne", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
const source = "https://opendata.transport.vic.gov.au/dataset/gtfs-realtime/resource/616ebaab-b472-4715-9b31-f5f5ea37cd69";
const control = "rounded-lg border border-[#b5c5db] bg-white px-4 py-3 text-base text-[#090d46] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005aaa] disabled:opacity-50";

function delayLabel(seconds: number | null) {
  if (seconds === null) return "Delay not supplied";
  if (seconds === 0) return "On time at this stop";
  if (seconds < 0) return `${Math.ceil(-seconds / 60)} min early at this stop`;
  return `${Math.ceil(seconds / 60)} min late at this stop`;
}

export function VlineStatus() {
  const [lines, setLines] = useState<TrainLine[]>([]);
  const [lineId, setLineId] = useState(() => new URLSearchParams(window.location.search).get("lineId") ?? "");
  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [visible, setVisible] = useState(20);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true); setError(""); setResults(null); setVisible(20);
    async function load() {
      try {
        let catalog = lines;
        if (!catalog.length) {
          const response = await fetch("/api/lines?network=vline", { signal: controller.signal });
          if (!response.ok) throw new Error("The V/Line route catalog is unavailable. Try again.");
          catalog = (await response.json()).lines;
          if (!active) return;
          setLines(catalog);
        }
        const selected = catalog.find((line) => line.id === lineId) ?? catalog[0];
        if (!selected) throw new Error("No regional train routes are available in the official catalog.");
        if (!active) return;
        window.history.replaceState(null, "", `/disruptions?network=vline&lineId=${encodeURIComponent(selected.id)}`);
        if (selected.id !== lineId) { setLineId(selected.id); return; }
        const response = await fetch(`/api/vline-trips?lineId=${encodeURIComponent(selected.id)}`, { signal: controller.signal });
        if (!response.ok) throw new Error("V/Line live data is unavailable. Try again or check official notices.");
        const payload = await response.json() as Results;
        if (active) setResults(payload);
      } catch (failure) {
        if (active && !controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Unable to load V/Line data.");
      } finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; controller.abort(); };
    // Catalog is retained between route selections; refresh retries failed catalogs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineId, refresh]);

  return <section className="mt-5 text-[#090d46] selection:bg-[#a5f3fc]">
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex min-w-0 flex-1 flex-col gap-2 font-semibold" htmlFor="vline-route">V/Line train route
        <select id="vline-route" aria-label="V/Line train route" className={`${control} w-full min-w-0`} value={lines.some((line) => line.id === lineId) ? lineId : ""} onChange={(event) => setLineId(event.target.value)} disabled={!lines.length}>
          {!lines.length && <option value="">{loading ? "Loading regional routes…" : "Routes unavailable"}</option>}
          {lines.map((line) => <option key={line.id} value={line.id}>{line.name}</option>)}
        </select>
      </label>
      <button type="button" className={`${control} flex items-center gap-2 hover:bg-[#eef5ff]`} disabled={loading} onClick={() => setRefresh((value) => value + 1)}><RefreshCw size={18}/>Refresh</button>
    </div>
    {lines.some((line) => line.id === lineId) && <p className="mt-3 text-sm font-semibold text-[#284968]">{lines.find((line) => line.id === lineId)?.name}</p>}
    <p className="my-5 max-w-[75ch] rounded-lg bg-[#fff4da] p-4 text-base leading-6 text-[#704500]">Live train predictions only. This feed does not cover coaches, works, replacement buses or disruption notices. Missing predictions do not mean a service is on time.</p>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dce5f0] pb-4">
      <h2 className="m-0 text-2xl font-bold">Regional train updates</h2>
      {results && <span className="text-sm text-[#475d78]">Feed updated {results.feedUpdatedAt ? time.format(new Date(results.feedUpdatedAt)) : "time unavailable"} · Melbourne</span>}
    </div>
    <div aria-live="polite" aria-busy={loading}>
      {loading ? <p className="flex items-center gap-2 py-6"><LoaderCircle size={20} className="animate-spin motion-reduce:animate-none"/>Checking regional train predictions…</p>
        : error ? <p role="alert" className="py-6 text-[#a02719]">{error}</p>
        : results?.stale ? <p className="py-6 text-[#704500]">The feed is stale or its timestamp is missing. Predictions are hidden; refresh or check official notices.</p>
        : !results?.trips.length ? <p className="py-6 text-[#475d78]">No current predictions matched this route. This is not a complete timetable or an all-clear.</p>
        : <>
          <p className="my-4 text-sm text-[#475d78]">{results.trips.length} reported trips · Predictions apply to the listed stop, not the whole route.</p>
          <ul className="m-0 list-none divide-y divide-[#dce5f0] p-0">
            {results.trips.slice(0, visible).map((trip) => <li key={trip.id} className="grid gap-4 py-5 sm:grid-cols-[1fr_1fr_auto]">
              <div className="min-w-0"><p className="m-0 flex items-start gap-2 text-lg font-bold"><TrainFront size={20} className="mt-1 shrink-0"/>{trip.destination}</p><p className="mt-2 text-sm text-[#475d78]">Service date {trip.serviceDate ?? "not supplied"}{trip.startTime ? ` · Scheduled start ${trip.startTime}` : ""}</p></div>
              <div><p className="m-0 text-sm text-[#475d78]">{trip.nextStop ? `Next reported stop · ${trip.nextStop}` : "Next stop not supplied"}</p><p className="mt-2 font-semibold tabular-nums">{trip.predictedAt ? time.format(new Date(trip.predictedAt)) : "Prediction not supplied"}</p></div>
              <span className={`self-start rounded-md px-3 py-2 text-sm font-semibold ${trip.cancelled || (trip.delaySeconds ?? 0) > 0 ? "bg-[#fff4da] text-[#704500]" : "bg-[#edf4fc] text-[#284968]"}`}>{trip.cancelled ? "Cancelled" : delayLabel(trip.delaySeconds)}</span>
            </li>)}
          </ul>
          {visible < results.trips.length && <button type="button" className={`${control} mt-4 hover:bg-[#eef5ff]`} onClick={() => setVisible((value) => value + 20)}>Show more trips ({results.trips.length - visible} remaining)</button>}
        </>}
      {!!results?.unmatchedTrips && <p className="text-sm text-[#475d78]">Some feed trips could not be matched to the current schedule. Coverage may be incomplete.</p>}
    </div>
    <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 border-t border-[#dce5f0] pt-4 text-sm font-semibold">
      <a href="https://www.vline.com.au/Service-Changes" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[#005aaa] underline underline-offset-4">Official V/Line notices<ArrowUpRight size={16}/></a>
      <a href={source} target="_blank" rel="noreferrer" className="text-[#005aaa] underline underline-offset-4">Transport Victoria data source</a>
    </div>
  </section>;
}
