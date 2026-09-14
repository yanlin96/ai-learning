import { getTrainLines } from "@/lib/train-lines";
import { getServerSession } from "next-auth";
import { authOptions, isOktaConfigured } from "@/lib/auth";

export async function GET() {
  if (!isOktaConfigured) {
    return Response.json({ error: "Okta authentication is not configured." }, { status: 503 });
  }
  if (!await getServerSession(authOptions)) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }
  return Response.json({
    lines: await getTrainLines(),
    source: "Transport Victoria GTFS Schedule",
    sourceUrl: "https://opendata.transport.vic.gov.au/dataset/gtfs-schedule",
  });
}
