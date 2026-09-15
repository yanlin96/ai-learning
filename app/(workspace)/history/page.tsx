import type { Metadata } from "next";
import { History } from "lucide-react";
import { HistoryList } from "@/app/history-list";

export const metadata: Metadata = {
  title: "Audit history",
  description: "Pages checked in this browser tab.",
};

export default function HistoryPage() {
  return (
    <main>

      <section className="shell pt-8 pb-16">
        <header className="mb-7 flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#00539d]"><History size={23} /></span>
          <div>
            <h1 className="max-w-none text-[clamp(28px,3vw,40px)]">Website audit history</h1>
            <p className="mt-3 mb-0 max-w-2xl text-sm leading-6 text-slate-500">Review page scores, specific findings and recommended fixes. History stays in this tab; closing the tab discards it.</p>
          </div>
        </header>
        <HistoryList />
      </section>
    </main>
  );
}
