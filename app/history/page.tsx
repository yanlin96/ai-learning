import type { Metadata } from "next";
import { History } from "lucide-react";
import { HistoryList } from "@/app/history-list";
import { SiteHeader } from "@/app/site-header";
import { SiteFooter } from "@/app/site-footer";

export const metadata: Metadata = {
  title: "Audit history",
  description: "Pages checked in this browser tab.",
};

export default function HistoryPage() {
  return (
    <main>
      <SiteHeader />
      <section className="shell audit-page">
        <header className="page-intro">
          <span className="page-icon"><History size={23} /></span>
          <div>
            <p className="eyebrow">THIS SESSION</p>
            <h1>Pages we have <em>checked.</em></h1>
            <p>Every audit run from this browser tab, newest first. Kept in session storage only &mdash; nothing is sent to a server, and closing the tab discards it.</p>
          </div>
        </header>
        <HistoryList />
      </section>
      <SiteFooter />
    </main>
  );
}
