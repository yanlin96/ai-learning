import { redirect } from "next/navigation";
import { workspaceCallback } from "@/lib/auth-routing";
export default async function LegacyTrainLogin({ searchParams }: { searchParams: Promise<{ error?: string; callbackUrl?: string }> }) {
  const params = await searchParams;
  const query = new URLSearchParams({ callbackUrl: workspaceCallback(params.callbackUrl || "/disruptions", process.env.NEXTAUTH_URL) });
  if (params.error) query.set("error", params.error);
  redirect(`/login?${query}`);
}
