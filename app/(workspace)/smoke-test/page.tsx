import Link from "next/link";
import type { Metadata } from "next";
import { History } from "lucide-react";
import { SmokeTestForm } from "@/app/smoke-test-form";
import { PageContent, PageHeading } from "@/app/page-template";

export const metadata: Metadata = {
  title: "Smoke test | PAS Website Quality Checker",
  description: "Quickly verify up to 100 important pages across a public website.",
};

export default function SmokeTestPage() {
  return (
    <main>

      <PageContent>
        <PageHeading eyebrow="Release confidence" title={<>Check the essentials,<br/><em>site-wide.</em></>}
          description="Run fast HTTP checks across priority URLs and sitemap pages, then verify priority and suspicious pages in a real browser. Built for breadth before a release, without changing anything on the target website."
          actions={<Link className="inline-flex items-center gap-1.5 text-[#00539d] underline-offset-4 hover:underline" href="/smoke-test/history"><History size={15}/> Smoke-test history</Link>}/>
        <SmokeTestForm />
      </PageContent>
    </main>
  );
}
