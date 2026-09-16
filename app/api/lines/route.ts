import { getTrainLines, getRegionalSchedule } from "@/lib/train-lines";
import { getServerSession } from "next-auth";
import { authOptions, isOktaConfigured } from "@/lib/auth";

export async function GET(request: Request) {
  if (!isOktaConfigured) {
    return Response.json({ error: "Okta authentication is not configured." }, { status: 503 });
  }
  if (!await getServerSession(authOptions)) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }
  try { return Response.json({
    lines: new URL(request.url).searchParams.get("network") === "vline"
      ? (await getRegionalSchedule()).lines : await getTrainLines(),
    source: "Transport Victoria GTFS Schedule",
    sourceUrl: "https://opendata.transport.vic.gov.au/dataset/gtfs-schedule",
  }); } catch {
    return Response.json({ error: "The official line catalog is unavailable. Try again." }, { status: 502 });
  }
}
