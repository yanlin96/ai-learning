import Link from "next/link";
import { CheckCircle2, ShieldCheck, History } from "lucide-react";
import { AuditForm } from "@/app/audit-form";
import { SiteFooter } from "@/app/site-footer";

export default function WebsiteAuditPage() {
  return (
    <main>

      <section className="shell pb-16">
        <div className="mx-auto max-w-[920px] pt-7 sm:pt-10">
          <header className="mb-6">
            <p className="m-0 mb-3 text-xs font-extrabold tracking-widest text-[#00539d] uppercase">Website audit</p>
            <h1 className="max-w-none text-[clamp(32px,3.5vw,48px)] leading-tight">Check your website.<br /><em>Know what to fix next.</em></h1>
            <p className="mt-4 mb-4 max-w-2xl text-base leading-7 text-slate-600">Start with any public page. Get evidence for SEO, GEO / AI crawler access, broken links and accessibility — with practical fixes in priority order.</p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-600">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="text-teal-600" size={15} /> Evidence-led checks</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="text-teal-600" size={15} /> Read-only checks</span>
              <Link className="inline-flex items-center gap-1.5 text-[#00539d] underline-offset-4 hover:underline" href="/history"><History size={15} /> Audit history</Link>
            </div>
          </header>
          <AuditForm />
          <ol className="mt-7 mb-0 grid list-none gap-4 p-0 text-sm sm:grid-cols-3" aria-label="How website audit works">
            {[
              ["Paste a page URL", "Use a homepage or an important landing page."],
              ["Run the checks", "We inspect the page without changing anything."],
              ["Act on the evidence", "Review priority fixes and what still needs a human."],
            ].map(([title, detail], index) => (
              <li key={title} className="flex gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#edf4fd] text-xs font-extrabold text-[#00539d]">{index + 1}</span>
                <span><strong className="block text-[#090d46]">{title}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{detail}</span></span>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
