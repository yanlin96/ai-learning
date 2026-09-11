import { NextResponse } from "next/server";
import { getWerribeeDisruptions, SOURCE_URL } from "@/lib/disruptions";
import { getMelbourneWeather } from "@/lib/melbourne-weather";

export const dynamic = "force-dynamic";

export async function GET() {
  const [weatherResult, disruptionResult] = await Promise.allSettled([
    getMelbourneWeather(),
    getWerribeeDisruptions(),
  ]);
  const disruptions = disruptionResult.status === "fulfilled" ? disruptionResult.value : [];
  return NextResponse.json({
    weather: weatherResult.status === "fulfilled" ? weatherResult.value : null,
    train: {
      unavailable: disruptionResult.status === "rejected",
      count: disruptions.length,
      majorCount: disruptions.filter((item) => item.severity === "major").length,
      preview: disruptions[0]?.detail || null,
    },
    checkedAt: new Date().toISOString(),
    sources: { weather: "https://open-meteo.com/", transport: SOURCE_URL },
  }, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}
