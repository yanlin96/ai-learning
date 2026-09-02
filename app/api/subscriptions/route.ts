import { createSubscription, listSubscriptions } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ subscriptions: await listSubscriptions() });
}

export async function POST(request: Request) {
  try {
    const item = await createSubscription(await request.json());
    return Response.json({ subscription: item }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create reminder";
    return Response.json({ error: message }, { status: 400 });
  }
}

