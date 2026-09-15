import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authOptions, isOktaConfigured } from "@/lib/auth";
import { workspaceCallback } from "@/lib/auth-routing";
import { WorkspaceShell } from "@/app/workspace-shell";
export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const session = isOktaConfigured ? await getServerSession(authOptions) : null;
  if (!session?.user) redirect(`/login?callbackUrl=${encodeURIComponent(workspaceCallback((await headers()).get("x-workspace-path") || "/"))}`);
  return <WorkspaceShell>{children}</WorkspaceShell>;
}
