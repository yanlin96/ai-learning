import type { Metadata } from "next";
import { ScanSearch } from "lucide-react";
import { AuditForm } from "./audit-form";
import { SiteHeader } from "@/app/site-header";
import { SiteFooter } from "@/app/site-footer";

export const metadata: Metadata = {
  title: "Website Audit | Line Watch Melbourne",
  description: "Check broken links, SEO basics, and AI crawler accessibility for a public webpage.",
};

export default function WebsiteAuditPage() {
  return (
    <main>
      <SiteHeader />
      <section className="shell audit-page">
        <header className="page-intro">
          <span className="page-icon"><ScanSearch size={23} /></span>
          <div><p className="eyebrow">WEBSITE AUDIT</p><h1>Can people—and <em>AI</em>—read it?</h1><p>Inspect broken links, essential SEO signals, and whether AI crawlers can access meaningful content before and after JavaScript renders.</p></div>
        </header>
        <AuditForm />
      </section>
      <SiteFooter />
    </main>
  );
}
