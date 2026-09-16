import { workspaceApiGuard } from "@/lib/workspace-auth";
import { getRegionalTrips } from "@/lib/vline";

export async function GET(request: Request) {
  const denied = await workspaceApiGuard();
  if (denied) return denied;
  const lineId = new URL(request.url).searchParams.get("lineId");
  if (!lineId) return Response.json({ error: "Select a V/Line route." }, { status: 400 });
  try {
    return Response.json(await getRegionalTrips(lineId));
  } catch {
    return Response.json({ error: "V/Line live data is unavailable. Retry or check official updates." }, { status: 502 });
  }
}
