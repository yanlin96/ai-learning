"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/app/site-header";

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const isHome = usePathname() === "/";
  return <div className={`min-h-screen [&>main]:!pl-0 ${isHome ? "" : "xl:pl-[252px]"}`}>
    <SiteHeader />
    {children}
  </div>;
}
