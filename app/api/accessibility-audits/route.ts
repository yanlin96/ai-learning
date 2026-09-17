import { estimateAccessibility } from "@/lib/accessibility-estimate";
import { workspaceApiGuard } from "@/lib/workspace-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 45;

export async function POST(request: Request) {
  const denied = await workspaceApiGuard();
  if (denied) return denied;
  try {
    const body = await request.json() as { url?: unknown };
    if (typeof body.url !== "string") return Response.json({ ok: false, error: "A website URL is required" }, { status: 400 });
    return Response.json({ ok: true, report: await estimateAccessibility(body.url) });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Accessibility estimate failed" }, { status: 400 });
  }
}
