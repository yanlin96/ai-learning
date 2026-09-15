import "server-only";
import { getServerSession } from "next-auth";
import { authOptions, isOktaConfigured } from "@/lib/auth";
export async function workspaceApiGuard() {
  const session = isOktaConfigured ? await getServerSession(authOptions) : null;
  if (!session?.user) return Response.json({ error: "Authentication required." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  return null;
}
