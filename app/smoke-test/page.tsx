import type { Metadata } from "next";
import { Gauge } from "lucide-react";
import { SiteFooter } from "@/app/site-footer";
import { SiteHeader } from "@/app/site-header";
import { SmokeTestForm } from "@/app/smoke-test-form";

export const metadata: Metadata = {
  title: "Smoke test | PAS Website Quality Checker",
  description: "Quickly verify up to 100 important pages across a public website.",
};

export default function SmokeTestPage() {
  return (
    <main>
      <SiteHeader />
      <section className="shell audit-page smoke-page">
        <header className="page-intro">
          <span className="page-icon"><Gauge size={23} /></span>
          <div>
            <p className="eyebrow">RELEASE CONFIDENCE</p>
            <h1>Check the essentials, <em>site-wide.</em></h1>
            <p>Run fast HTTP checks across priority URLs and sitemap pages, then verify priority and suspicious pages in a real browser. Built for breadth before a release, without changing anything on the target website.</p>
          </div>
        </header>
        <SmokeTestForm />
      </section>
      <SiteFooter />
    </main>
  );
}
