import { workspaceApiGuard } from "@/lib/workspace-auth";
import { createSubscription, listSubscriptions } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await workspaceApiGuard();
  if (denied) return denied;
  return Response.json({ subscriptions: await listSubscriptions() });
}

export async function POST(request: Request) {
  const denied = await workspaceApiGuard();
  if (denied) return denied;
  try {
    const item = await createSubscription(await request.json());
    return Response.json({ subscription: item }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create reminder";
    return Response.json({ error: message }, { status: 400 });
  }
}
