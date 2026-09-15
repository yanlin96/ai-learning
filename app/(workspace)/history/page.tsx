import type { Metadata } from "next";
import { History } from "lucide-react";
import { HistoryList } from "@/app/history-list";
import { PageContent, PageHeading } from "@/app/page-template";

export const metadata: Metadata = {
  title: "Audit history",
  description: "Pages checked in this browser tab.",
};

export default function HistoryPage() {
  return (
    <main>

      <PageContent>
        <PageHeading compact eyebrow="Audit records" icon={<History size={23}/>} title="Website audit history"
          description="Review page scores, specific findings and recommended fixes. History stays in this tab; closing the tab discards it."/>
        <HistoryList />
      </PageContent>
    </main>
  );
}
