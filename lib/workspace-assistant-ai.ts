import "server-only";
import OpenAI from "openai";
import type { WorkspaceAssistantRunIntent, WorkspaceAssistantSemanticIntent } from "@/lib/workspace-assistant";

const ALLOWED_INTENTS = new Set<WorkspaceAssistantSemanticIntent>([
  "website_audit",
  "accessibility_audit",
  "smoke_test",
  "audit_history",
  "smoke_history",
  "train_status",
  "capabilities",
  "unknown",
]);

export async function classifyWorkspaceIntent(message: string, pendingIntent: WorkspaceAssistantRunIntent | null) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const client = new OpenAI({ apiKey });
  const response = await client.responses.create({
    model: process.env.OPENAI_ASSISTANT_MODEL?.trim() || process.env.OPENAI_MODEL?.trim() || "gpt-5.4-mini",
    store: false,
    instructions: `Classify a signed-in CPA Tools workspace request into exactly one intent.

Intent definitions:
- website_audit: one-page website quality, SEO, GEO/AI crawler visibility, content quality, or broken-link checking.
- accessibility_audit: accessibility, WCAG, disability, screen-reader, keyboard, focus, contrast, readable or inclusive-use questions.
- smoke_test: release confidence, multi-page checking, regression checks, or whether a deployment/site broadly works.
- audit_history: requests to view previous Website Audit runs.
- smoke_history: requests to view previous Smoke Test runs.
- train_status: Melbourne Metro or V/Line status, disruptions, delays, routes, or predictions.
- capabilities: asks what this assistant or CPA Tools can do.
- unknown: unrelated requests or requests that cannot be mapped safely.

Use the supplied pending intent only when the new message is a continuation. Do not invent a URL, action, capability, or result. Return only the schema.`,
    input: JSON.stringify({ message, pendingIntent }),
    text: {
      format: {
        type: "json_schema",
        name: "workspace_intent",
        strict: true,
        schema: {
          type: "object",
          properties: {
            intent: { type: "string", enum: [...ALLOWED_INTENTS] },
          },
          required: ["intent"],
          additionalProperties: false,
        },
      },
    },
    max_output_tokens: 80,
  }, { signal: AbortSignal.timeout(15_000) });

  const parsed = JSON.parse(response.output_text) as { intent?: unknown };
  return typeof parsed.intent === "string" && ALLOWED_INTENTS.has(parsed.intent as WorkspaceAssistantSemanticIntent)
    ? parsed.intent as WorkspaceAssistantSemanticIntent
    : null;
}
