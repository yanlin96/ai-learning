import "server-only";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import { getApiKey } from "@/lib/disruptions";
import { getRegionalSchedule } from "@/lib/train-lines";
import { mapRegionalTrip, seconds } from "@/lib/vline-rules";

export const VLINE_SOURCE = "https://opendata.transport.vic.gov.au/dataset/gtfs-realtime/resource/616ebaab-b472-4715-9b31-f5f5ea37cd69";

export async function getRegionalTrips(lineId: string) {
  const schedule = await getRegionalSchedule();
  const line = schedule.lines.find((item) => item.id === lineId);
  if (!line) throw new Error("Unknown regional line");
  const key = getApiKey();
  if (!key) throw new Error("Transport Victoria is not configured");
  const response = await fetch("https://api.opendata.transport.vic.gov.au/opendata/public-transport/gtfs/realtime/v1/vline/trip-updates", {
    next: { revalidate: 30 }, signal: AbortSignal.timeout(15000),
    headers: { Accept: "application/x-protobuf", KeyID: key },
  });
  if (!response.ok) throw new Error(`Regional feed returned ${response.status}`);
  const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(await response.arrayBuffer()));
  const now = Math.floor(Date.now() / 1000);
  const generated = seconds(feed.header.timestamp);
  const stale = !generated || now - generated > 300 || generated > now + 60;
  if (feed.header.incrementality === 1) throw new Error("Differential feeds are not supported");
  let unmatchedTrips = 0;
  const trips = stale ? [] : feed.entity.flatMap((entity) => {
    const update = entity.tripUpdate;
    if (!update || entity.isDeleted) return [];
    const scheduled = schedule.trips.get(update.trip?.tripId ?? "");
    const routeId = update.trip?.routeId || scheduled?.routeId;
    if (!routeId || !schedule.routes.has(routeId)) { unmatchedTrips += 1; return []; }
    if (schedule.routes.get(routeId) !== lineId) return [];
    const trip = mapRegionalTrip(update, scheduled?.headsign || "Destination unavailable", schedule.stops, now);
    return trip ? [trip] : [];
  });
  return { line, trips: [...new Map(trips.map((trip) => [trip.id, trip])).values()]
    .sort((a, b) => (a.predictedAt ?? "9999").localeCompare(b.predictedAt ?? "9999")),
    stale, unmatchedTrips, feedUpdatedAt: generated ? new Date(generated * 1000).toISOString() : null,
    checkedAt: new Date().toISOString(), source: VLINE_SOURCE };
}
