import type { Metadata } from "next";
import { History } from "lucide-react";
import { SmokeHistoryList } from "@/app/smoke-history-list";

export const metadata: Metadata = {
  title: "Smoke test history | PAS Website Quality Checker",
  description: "Recent smoke-test results grouped by domain in this browser.",
};

export default function SmokeHistoryPage() {
  return (
    <main>

      <section className="shell pt-8 pb-16">
        <header className="mb-7 flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#00539d]"><History size={23} /></span>
          <div><h1 className="max-w-none text-[clamp(28px,3vw,40px)]">Smoke test history</h1><p className="mt-3 mb-0 max-w-2xl text-sm leading-6 text-slate-500">Expand a run to review every checked URL, HTTP result and browser evidence. Up to 10 websites with 10 recent runs each are kept in this browser, not a database.</p></div>
        </header>
        <SmokeHistoryList />
      </section>
    </main>
  );
}
