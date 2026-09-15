import type { Metadata } from "next";
import { History } from "lucide-react";
import { SmokeHistoryList } from "@/app/smoke-history-list";
import { PageContent, PageHeading } from "@/app/page-template";

export const metadata: Metadata = {
  title: "Smoke test history | PAS Website Quality Checker",
  description: "Recent smoke-test results grouped by domain in this browser.",
};

export default function SmokeHistoryPage() {
  return (
    <main>

      <PageContent>
        <PageHeading compact eyebrow="Release records" icon={<History size={23}/>} title="Smoke test history"
          description="Expand a run to review every checked URL, HTTP result and browser evidence. Up to 10 websites with 10 recent runs each are kept in this browser, not a database."/>
        <SmokeHistoryList />
      </PageContent>
    </main>
  );
}
