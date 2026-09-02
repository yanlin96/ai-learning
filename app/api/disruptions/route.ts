import { NextResponse } from "next/server";
import { getLineDisruptions, SOURCE_URL } from "@/lib/disruptions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const lineId = new URL(request.url).searchParams.get("lineId") ?? "werribee";
    const disruptions = await getLineDisruptions(lineId);
    return NextResponse.json({ disruptions, source: SOURCE_URL, checkedAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json(
      { disruptions: [], source: SOURCE_URL, checkedAt: new Date().toISOString(), error: "Live data is temporarily unavailable." },
      { status: 502 },
    );
  }
}
