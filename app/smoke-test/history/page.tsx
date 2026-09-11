import type { Metadata } from "next";
import { History } from "lucide-react";
import { SiteFooter } from "@/app/site-footer";
import { SiteHeader } from "@/app/site-header";
import { SmokeHistoryList } from "@/app/smoke-history-list";

export const metadata: Metadata = {
  title: "Smoke test history | PAS Website Quality Checker",
  description: "Recent smoke-test results grouped by domain in this browser.",
};

export default function SmokeHistoryPage() {
  return (
    <main>
      <SiteHeader />
      <section className="shell audit-page">
        <header className="page-intro">
          <span className="page-icon"><History size={23} /></span>
          <div><p className="eyebrow">SMOKE TEST HISTORY</p><h1>Recent runs, grouped by <em>domain.</em></h1><p>Compare the latest release checks for up to 10 websites. History stays in this browser and is never sent to a database.</p></div>
        </header>
        <nav className="report-tabs" aria-label="Report type"><a href="/history">Website audits</a><a className="active" href="/smoke-test/history">Smoke tests</a></nav>
        <SmokeHistoryList />
      </section>
      <SiteFooter />
    </main>
  );
}
