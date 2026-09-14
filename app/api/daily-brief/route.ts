import { NextResponse } from "next/server";
import { getWerribeeDisruptions, SOURCE_URL } from "@/lib/disruptions";
import { getMelbourneWeather } from "@/lib/melbourne-weather";
import { getServerSession } from "next-auth";
import { authOptions, isOktaConfigured } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = isOktaConfigured ? await getServerSession(authOptions) : null;
  const canViewTrainStatus = Boolean(session);
  const [weatherResult, disruptionResult] = await Promise.allSettled([
    getMelbourneWeather(),
    canViewTrainStatus ? getWerribeeDisruptions() : Promise.resolve([]),
  ]);
  const disruptions = disruptionResult.status === "fulfilled" ? disruptionResult.value : [];
  return NextResponse.json({
    weather: weatherResult.status === "fulfilled" ? weatherResult.value : null,
    train: {
      requiresAuth: !canViewTrainStatus,
      unavailable: canViewTrainStatus && disruptionResult.status === "rejected",
      count: disruptions.length,
      majorCount: disruptions.filter((item) => item.severity === "major").length,
      preview: disruptions[0]?.detail || null,
    },
    checkedAt: new Date().toISOString(),
    sources: { weather: "https://open-meteo.com/", transport: SOURCE_URL },
  }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
