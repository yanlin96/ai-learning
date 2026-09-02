import { getTrainLines } from "@/lib/train-lines";

export async function GET() {
  return Response.json({
    lines: await getTrainLines(),
    source: "Transport Victoria GTFS Schedule",
    sourceUrl: "https://opendata.transport.vic.gov.au/dataset/gtfs-schedule",
  });
}
