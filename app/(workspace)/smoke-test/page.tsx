import Link from "next/link";
import type { Metadata } from "next";
import { History } from "lucide-react";
import { SmokeTestForm } from "@/app/smoke-test-form";
import { PageContent, PageHeading } from "@/app/page-template";

export const metadata: Metadata = {
  title: "Smoke testing | CPA Tools",
  description: "Quickly verify up to 100 important pages across a public website.",
};

export default function SmokeTestPage() {
  return (
    <main>

      <PageContent>
        <PageHeading title="Smoke testing"
          description="Check up to 100 priority and sitemap pages. HTTP checks cover the site; selected pages get browser verification. Nothing on the website is changed."
          actions={<Link className="inline-flex items-center gap-1.5 text-[#00539d] underline-offset-4 hover:underline" href="/smoke-test/history"><History size={15}/> Smoke-test history</Link>}/>
        <SmokeTestForm />
      </PageContent>
    </main>
  );
}
