import { NextResponse } from "next/server";
import { getLineDisruptions, SOURCE_URL } from "@/lib/disruptions";
import { getServerSession } from "next-auth";
import { authOptions, isOktaConfigured } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isOktaConfigured) {
    return NextResponse.json({ error: "Okta authentication is not configured." }, { status: 503 });
  }
  if (!await getServerSession(authOptions)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
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
