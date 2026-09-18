import { workspaceApiGuard } from "@/lib/workspace-auth";
import { classifyWorkspaceIntent } from "@/lib/workspace-assistant-ai";
import {
  extractPublicUrl,
  matchWorkspaceMessage,
  workspaceResultForIntent,
  type WorkspaceAssistantRunIntent,
} from "@/lib/workspace-assistant";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const RUN_INTENTS = new Set<WorkspaceAssistantRunIntent>(["website_audit", "accessibility_audit", "smoke_test"]);

export async function POST(request: Request) {
  const denied = await workspaceApiGuard();
  if (denied) return denied;

  try {
    const body = await request.json() as { message?: unknown; pendingIntent?: unknown };
    if (typeof body.message !== "string" || !body.message.trim() || body.message.length > 1_000) {
      return Response.json({ error: "A message between 1 and 1,000 characters is required." }, { status: 400 });
    }
    const pendingIntent = typeof body.pendingIntent === "string" && RUN_INTENTS.has(body.pendingIntent as WorkspaceAssistantRunIntent)
      ? body.pendingIntent as WorkspaceAssistantRunIntent
      : null;

    const deterministic = matchWorkspaceMessage(body.message, pendingIntent);
    if (deterministic) return Response.json({ result: deterministic, source: "rules" }, { headers: { "Cache-Control": "no-store" } });

    let intent = null;
    try {
      intent = await classifyWorkspaceIntent(body.message, pendingIntent);
    } catch {
      // The assistant remains usable when OpenAI is unavailable or rate limited.
    }
    const result = workspaceResultForIntent(intent || "unknown", extractPublicUrl(body.message));
    return Response.json({ result, source: intent ? "openai" : "fallback" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "The assistant could not interpret that request." }, { status: 400 });
  }
}
