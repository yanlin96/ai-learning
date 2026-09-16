import Link from "next/link";
import { CheckCircle2, ShieldCheck, History } from "lucide-react";
import { AuditForm } from "@/app/audit-form";
import { PageContent, PageHeading } from "@/app/page-template";

export default function WebsiteAuditPage() {
  return (
    <main>

      <PageContent>
          <PageHeading title="Website audit"
            description="Start with any public page. Get evidence for SEO, GEO / AI crawler access, broken links and accessibility — with practical fixes in priority order."
            actions={<>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="text-teal-600" size={15} /> Evidence-led checks</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="text-teal-600" size={15} /> Read-only checks</span>
              <Link className="inline-flex items-center gap-1.5 text-[#00539d] underline-offset-4 hover:underline" href="/history"><History size={15} /> Audit history</Link>
            </>} />
          <AuditForm />
          <ol className="mt-7 mb-0 grid list-none gap-4 p-0 text-sm sm:grid-cols-3" aria-label="How website audit works">
            {[
              ["Paste a page URL", "Use a homepage or an important landing page."],
              ["Run the checks", "We inspect the page without changing anything."],
              ["Act on the evidence", "Review priority fixes and what still needs a human."],
            ].map(([title, detail], index) => (
              <li key={title} className="flex gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#edf4fd] text-xs font-extrabold text-[#00539d]">{index + 1}</span>
                <span><strong className="block text-[#090d46]">{title}</strong><span className="mt-1 block text-sm leading-5 text-slate-600">{detail}</span></span>
              </li>
            ))}
          </ol>
      </PageContent>
    </main>
  );
}
