import { auditWebsite } from "@/lib/website-audit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json() as { url?: unknown };
    if (typeof body.url !== "string") {
      return Response.json({ ok: false, error: "A website URL is required" }, { status: 400 });
    }
    const report = await auditWebsite(body.url);
    return Response.json({ ok: true, report });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Website audit failed";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
