"use client";

import { SiteHeader } from "@/app/site-header";

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen xl:pl-[252px] [&>main]:!pl-0">
    <SiteHeader />
    {children}
  </div>;
}
