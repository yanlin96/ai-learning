import Link from "next/link";
import { ArrowUpRight, CheckCheck, Command, ExternalLink, History, ScanSearch, ShieldCheck, Sparkles, TrainFront, Workflow } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { SiteFooter } from "@/app/site-footer";

export const metadata = { title: "Workspace | CPA Tools", description: "Your launchpad for website audits, release checks and supporting tools." };
export default async function IndexPage({ searchParams }: { searchParams: Promise<{ url?: string }> }) {
  const { url } = await searchParams;
  if (url) redirect(`/website-audit?url=${encodeURIComponent(url)}`);
  const session = await getServerSession(authOptions);
  const name = session?.user?.name?.split(/\s+/)[0] || "there";
  return <main className="!pl-0">
    <section className="mx-auto grid w-full max-w-[1280px] gap-5 px-5 pt-5 pb-12 sm:px-8">
      <div className="relative isolate overflow-hidden rounded-[28px] bg-[#071329] px-6 py-8 text-white sm:px-10 sm:py-10">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_95%_0%,rgba(0,186,181,.28),transparent_55%),radial-gradient(ellipse_at_0%_100%,rgba(50,90,230,.25),transparent_60%)]"/>
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-20 -z-10 size-[440px] rounded-full border border-cyan-200/10 shadow-[0_0_0_55px_rgba(165,243,252,.035),0_0_0_110px_rgba(165,243,252,.025)]"/>
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3"><p className="m-0 inline-flex items-center gap-2 text-xs font-bold tracking-[.16em] text-cyan-200 uppercase"><Command size={16}/> CPA Tools / Workspace</p><span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-200"><ShieldCheck size={14}/> Okta authenticated</span></div>
        <p className="m-0 mb-3 text-sm text-slate-300">Welcome back, {name}.</p>
        <h1 className="m-0 max-w-[820px] text-[clamp(38px,4.4vw,64px)] leading-[1.06] font-extrabold tracking-[-.045em] text-white">Less guesswork.<br/><span className="bg-gradient-to-r from-cyan-200 via-teal-200 to-blue-300 bg-clip-text text-transparent">More confidence.</span></h1>
        <p className="mt-5 mb-7 max-w-[600px] text-base leading-7 text-slate-300">Inspect a page. Check a release. Turn evidence into your next move — all from one focused workspace.</p>
        <div className="flex flex-wrap gap-3"><Link href="/website-audit" className="inline-flex min-h-12 items-center gap-3 rounded-xl bg-cyan-200 px-5 py-3 text-sm font-extrabold text-[#071329] no-underline transition hover:bg-cyan-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-200">Start a website audit <ArrowUpRight size={18}/></Link><Link href="/smoke-test" className="inline-flex min-h-12 items-center gap-3 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-bold text-white no-underline transition hover:bg-white/10">Check a release <Workflow size={17}/></Link></div>
        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/10 pt-4 text-xs text-slate-300"><span className="inline-flex items-center gap-2"><CheckCheck size={15} className="text-teal-200"/> Evidence before scores</span><span className="inline-flex items-center gap-2"><ShieldCheck size={15} className="text-teal-200"/> Read-only website checks</span><span className="inline-flex items-center gap-2"><Sparkles size={15} className="text-teal-200"/> Practical next steps</span></div>
      </div>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-2"><h2 className="m-0 text-xl font-extrabold text-[#090d46]">Choose your next move</h2><p className="m-0 text-sm text-slate-500">Start with a page. Go broader before release.</p></div>
      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Link href="/website-audit" className="group relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 text-[#090d46] no-underline transition hover:border-blue-400 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-blue-600">
          <div className="flex items-center justify-between"><span className="grid size-12 place-items-center rounded-xl bg-[#00539d] text-white"><ScanSearch size={25}/></span><span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-bold tracking-wider text-[#00539d]">PRIMARY TOOL</span></div>
          <h3 className="mt-5 mb-2 text-2xl font-extrabold">Website audit</h3><p className="m-0 max-w-lg text-sm leading-6 text-slate-600">SEO, GEO / AI crawler access, links and accessibility. Get concrete evidence and fixes in priority order.</p>
          <div className="mt-5 flex flex-wrap gap-2">{["One public page", "Up to 80 links", "Prioritised fixes"].map((label) => <span key={label} className="rounded-lg border border-blue-100 bg-white px-2.5 py-1.5 text-xs text-slate-600">{label}</span>)}</div>
          <span className="mt-6 flex items-center justify-between text-sm font-bold text-[#00539d]">Inspect a page <ArrowUpRight className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 motion-reduce:transform-none" size={20}/></span>
        </Link>
        <div className="grid gap-4">
          <Link href="/smoke-test" className="rounded-2xl border border-slate-200 bg-white p-5 no-underline transition hover:border-teal-300 hover:shadow-md"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><Workflow size={21}/></span><h3 className="m-0 flex-1 text-lg font-bold text-[#090d46]">Smoke testing</h3><ArrowUpRight size={18} className="text-slate-400"/></div><p className="mb-0 text-sm leading-6 text-slate-600">Check up to 100 priority and sitemap pages. Review every checked URL before a release.</p></Link>
          <div className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="m-0 flex items-center gap-2 text-base font-bold text-[#090d46]"><History size={18} className="text-[#00539d]"/> Pick up where you left off</h3><div className="mt-3 grid gap-2 sm:grid-cols-2"><Link href="/history" className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-3 text-sm font-bold text-[#00539d] no-underline hover:bg-blue-50">Audit history <ArrowUpRight size={15}/></Link><Link href="/smoke-test/history" className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-3 text-sm font-bold text-[#00539d] no-underline hover:bg-blue-50">Smoke history <ArrowUpRight size={15}/></Link></div><p className="mb-0 text-xs leading-5 text-slate-500">History is stored in this browser, not shared between accounts. Audit history lasts for this tab.</p></div>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><h2 className="m-0 text-base font-bold text-[#090d46]">Google specialist tools</h2><span className="text-xs text-slate-500">External tools</span></div><div className="mt-4 grid gap-2 sm:grid-cols-3">{[["Search Console", "Indexing & inspection", "https://search.google.com/search-console"], ["PageSpeed Insights", "Page performance", "https://pagespeed.web.dev/"], ["Rich Results Test", "Structured data", "https://search.google.com/test/rich-results"]].map(([title, detail, href]) => <a key={title} href={href} target="_blank" rel="noreferrer" className="rounded-xl bg-slate-50 p-3 no-underline transition hover:bg-blue-50"><strong className="flex items-start justify-between gap-2 text-sm text-[#090d46]">{title}<ExternalLink size={13} className="mt-1 shrink-0 text-slate-500"/></strong><span className="mt-1 block text-xs text-slate-600">{detail}</span></a>)}</div></section>
        <Link href="/disruptions" className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 no-underline transition hover:border-blue-300"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-[#00539d]"><TrainFront size={22}/></span><span className="flex-1"><strong className="block text-base text-[#090d46]">Your commute, covered.</strong><span className="mt-1 block text-sm text-slate-600">Search live notices across all Metro lines.</span></span><ArrowUpRight size={19} className="shrink-0 text-slate-400"/></Link>
      </div>
    </section><SiteFooter/>
  </main>;
}
