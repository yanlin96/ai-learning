"use client";

import { SiteHeader } from "@/app/site-header";
import { SiteFooter } from "@/app/site-footer";
import { WorkspaceAssistant } from "@/app/workspace-assistant";

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen flex-col xl:pl-[252px] [&>main]:!min-h-0 [&>main]:flex-1 [&>main]:!pl-0">
    <SiteHeader />
    {children}
    <SiteFooter />
    <WorkspaceAssistant />
  </div>;
}
