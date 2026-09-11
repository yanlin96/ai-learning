"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronRight, Cloud, CloudFog, CloudLightning, CloudRain, Snowflake, Sun, TrainFront } from "lucide-react";
import type { MelbourneWeather } from "@/lib/melbourne-weather";

type DailyBriefData = {
  weather: MelbourneWeather | null;
  train: { unavailable: boolean; count: number; majorCount: number; preview: string | null };
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
      .catch(() => setData({ weather: null, train: { unavailable: true, count: 0, majorCount: 0, preview: null }, checkedAt: new Date().toISOString(), sources: { weather: "https://open-meteo.com/", transport: "/disruptions" } }));
    return () => controller.abort();
  }, []);

  if (!data) return <div className="daily-brief loading" aria-label="Loading Melbourne daily brief"><span /><span /></div>;

  const WeatherIcon = data.weather ? WEATHER_ICONS[data.weather.tone] : Cloud;
  const trainTone = data.train.unavailable ? "unknown" : data.train.count ? "warning" : "clear";
  const TrainIcon = data.train.unavailable || data.train.count ? AlertTriangle : CheckCircle2;
  const trainText = data.train.unavailable
    ? "Live train status unavailable"
    : data.train.majorCount
      ? `${data.train.majorCount} travel change${data.train.majorCount === 1 ? "" : "s"}`
      : data.train.count
        ? `${data.train.count} station notice${data.train.count === 1 ? "" : "s"}`
        : "Running normally";

  return (
    <aside className="daily-brief" aria-label="Melbourne weather and Werribee Line status">
      <div className="brief-item weather-item">
        <span className={`brief-icon ${data.weather?.tone || "unknown"}`}><WeatherIcon size={18} /></span>
        <div><small>MELBOURNE WEATHER</small>{data.weather ? <strong>{data.weather.temperature}° · {data.weather.condition} <em>{data.weather.low}–{data.weather.high}°</em></strong> : <strong>Weather temporarily unavailable</strong>}</div>
      </div>
      <i className="brief-divider" />
      <a className="brief-item train-item" href="/disruptions" title={data.train.preview || undefined}>
        <span className={`brief-icon ${trainTone}`}><TrainFront size={18} /></span>
        <div><small>WERRIBEE LINE</small><strong className={trainTone}><TrainIcon size={13} /> {trainText}</strong></div>
        <ChevronRight size={16} />
      </a>
      <a className="brief-source" href={data.sources.weather} target="_blank" rel="noreferrer">Weather by Open-Meteo</a>
    </aside>
  );
}
