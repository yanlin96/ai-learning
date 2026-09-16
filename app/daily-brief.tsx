"use client";
import Link from "next/link";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronRight, Cloud, CloudFog, CloudLightning, CloudRain, Lock, Snowflake, Sun, TrainFront } from "lucide-react";
import type { MelbourneWeather } from "@/lib/melbourne-weather";

type DailyBriefData = {
  weather: MelbourneWeather | null;
  train: { requiresAuth: boolean; unavailable: boolean; count: number; majorCount: number; preview: string | null };
  checkedAt: string;
  sources: { weather: string; transport: string };
};

const WEATHER_ICONS = { clear: Sun, cloudy: Cloud, rain: CloudRain, storm: CloudLightning, fog: CloudFog, snow: Snowflake };

export function DailyBrief() {
  const [data, setData] = useState<DailyBriefData | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/daily-brief", { signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<DailyBriefData> : Promise.reject())
      .then(setData)
      .catch(() => setData({ weather: null, train: { requiresAuth: true, unavailable: false, count: 0, majorCount: 0, preview: null }, checkedAt: new Date().toISOString(), sources: { weather: "https://open-meteo.com/", transport: "/disruptions" } }));
    return () => controller.abort();
  }, []);

  if (!data) return <div className="grid min-h-16 grid-cols-2 gap-6 rounded-xl border border-slate-200 p-4" role="status" aria-label="Loading Melbourne daily brief"><span className="h-6 rounded bg-slate-100 motion-safe:animate-pulse" /><span className="h-6 rounded bg-slate-100 motion-safe:animate-pulse" /></div>;

  const WeatherIcon = data.weather ? WEATHER_ICONS[data.weather.tone] : Cloud;
  const trainTone = data.train.requiresAuth ? "unknown" : data.train.unavailable ? "unknown" : data.train.count ? "warning" : "clear";
  const TrainIcon = data.train.requiresAuth ? Lock : data.train.unavailable || data.train.count ? AlertTriangle : CheckCircle2;
  const trainText = data.train.requiresAuth
    ? "Sign in to view status"
    : data.train.unavailable
    ? "Live train status unavailable"
    : data.train.majorCount
      ? `${data.train.majorCount} travel change${data.train.majorCount === 1 ? "" : "s"}`
      : data.train.count
        ? `${data.train.count} station notice${data.train.count === 1 ? "" : "s"}`
        : "Running normally";

  return (
    <aside className="grid items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:gap-5 sm:px-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]" aria-label="Melbourne weather and Werribee Line status">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-[#00539d]"><WeatherIcon size={18} aria-hidden="true" /></span>
        <div className="min-w-0"><span className="block text-xs text-slate-600">Melbourne weather</span>{data.weather ? <strong className="mt-1 block text-sm text-[#090d46]">{data.weather.temperature}° · {data.weather.condition} <span className="font-normal text-slate-600">{data.weather.low}–{data.weather.high}°</span></strong> : <strong className="block text-sm text-slate-600">Weather temporarily unavailable</strong>}</div>
      </div>
      <Link className="flex min-h-11 min-w-0 items-center gap-3 rounded-lg text-[#090d46] no-underline hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00539d] sm:border-l sm:border-slate-200 sm:pl-5" href="/disruptions" title={data.train.preview || undefined}>
        <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${trainTone === "warning" ? "bg-amber-50 text-amber-800" : "bg-blue-50 text-[#00539d]"}`}><TrainFront size={18} aria-hidden="true" /></span>
        <div className="min-w-0"><span className="block text-xs text-slate-600">Werribee Line</span><strong className={`mt-1 flex items-center gap-1.5 text-sm ${trainTone === "warning" ? "text-amber-800" : "text-[#090d46]"}`}><TrainIcon className="shrink-0" size={14} aria-hidden="true" /> {trainText}</strong></div>
        <ChevronRight className="ml-auto shrink-0 text-slate-500" size={16} aria-hidden="true" />
      </Link>
      <a className="text-xs text-slate-600 underline sm:col-span-2 sm:justify-self-end lg:col-span-1" href={data.sources.weather} target="_blank" rel="noreferrer">Weather by Open-Meteo</a>
    </aside>
  );
}
