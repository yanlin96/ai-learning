import { runSmokeTest } from "@/lib/smoke-test";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json() as { baseUrl?: unknown; manualUrls?: unknown; limit?: unknown };
    if (typeof body.baseUrl !== "string") {
      return Response.json({ ok: false, error: "A website URL is required" }, { status: 400 });
    }
    if (body.manualUrls !== undefined && (!Array.isArray(body.manualUrls) || body.manualUrls.some((url) => typeof url !== "string"))) {
      return Response.json({ ok: false, error: "Manual URLs must be a list of strings" }, { status: 400 });
    }
    const report = await runSmokeTest({
      baseUrl: body.baseUrl,
      manualUrls: body.manualUrls as string[] | undefined,
      limit: typeof body.limit === "number" ? body.limit : undefined,
    });
    return Response.json({ ok: true, report });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Smoke test failed";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
