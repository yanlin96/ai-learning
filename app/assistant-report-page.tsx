"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, FileWarning, LoaderCircle } from "lucide-react";
import { AccessibilityForm } from "@/app/accessibility-form";
import { AuditForm } from "@/app/audit-form";
import { PageContent, PageHeading } from "@/app/page-template";
import { SmokeTestForm } from "@/app/smoke-test-form";
import { readAssistantReport, type StoredAssistantReport } from "@/lib/assistant-reports";
import { recordAuditRun } from "@/lib/audit-history";
import { recordSmokeRun } from "@/lib/smoke-history";

const TOOL_PATH = {
  website_audit: "/website-audit",
  accessibility_audit: "/accessibility",
  smoke_test: "/smoke-test",
} as const;

const TOOL_NAME = {
  website_audit: "Website Audit",
  accessibility_audit: "Accessibility Estimate",
  smoke_test: "Smoke Test",
} as const;

export function AssistantReportPage({ reportId }: { reportId: string }) {
  const [stored, setStored] = useState<StoredAssistantReport | null | undefined>(undefined);

  useEffect(() => {
    const report = readAssistantReport(reportId);
    setStored(report);
    if (!report) return;
    const historyMarker = `cpa-tools-assistant-history-recorded-v1:${report.id}`;
    if (sessionStorage.getItem(historyMarker)) return;
    if (report.kind === "website_audit") recordAuditRun(report.report);
    if (report.kind === "smoke_test") recordSmokeRun(report.report);
    sessionStorage.setItem(historyMarker, "1");
  }, [reportId]);

  if (stored === undefined) return <PageContent><div className="flex min-h-52 items-center justify-center gap-3 text-sm text-slate-600" role="status"><LoaderCircle className="animate-spin text-[#00539d] motion-reduce:animate-none" size={20}/>Loading your completed report…</div></PageContent>;

  if (!stored) return <PageContent>
    <PageHeading title="Report unavailable" description="This report is stored only in the browser tab that created it. It may have expired, been cleared, or belong to another browser." icon={<FileWarning size={28}/>}/>
    <a className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#00539d] px-5 text-sm font-bold text-white no-underline hover:bg-[#003f78] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00539d]" href="/website-audit"><ArrowLeft size={17}/>Return to Website Audit</a>
  </PageContent>;

  const toolName = TOOL_NAME[stored.kind];
  return <PageContent>
    <PageHeading
      title={`${toolName} report`}
      description={`Completed for ${new URL(stored.targetUrl).hostname}. This private result is available only in the current signed-in browser tab.`}
      actions={<><a href={TOOL_PATH[stored.kind]}><ArrowLeft size={15}/>Run another check</a><a href={stored.targetUrl} target="_blank" rel="noreferrer">Open checked page <ExternalLink size={14}/></a></>}
    />
    {stored.kind === "website_audit" && <AuditForm initialReport={stored.report} reportOnly/>}
    {stored.kind === "accessibility_audit" && <AccessibilityForm initialReport={stored.report} reportOnly/>}
    {stored.kind === "smoke_test" && <SmokeTestForm initialReport={stored.report} reportOnly/>}
  </PageContent>;
}
