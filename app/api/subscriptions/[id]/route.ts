import { deleteSubscription, updateSubscription } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const item = await updateSubscription(id, await request.json());
    return Response.json({ subscription: item });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update reminder";
    const status = message === "Reminder not found" ? 404 : 400;
    return Response.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    await deleteSubscription(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete reminder";
    return Response.json({ error: message }, { status: 404 });
  }
}
