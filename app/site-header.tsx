"use client";
import Link from "next/link";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ChevronDown,
  ExternalLink,
  Gauge,
  LogIn,
  LogOut,
  Menu,
  MonitorCheck,
  SearchCheck,
  TrainFront,
  X,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { DailyBrief } from "@/app/daily-brief";

type ToolboxLinksProps = { pathname: string; close?: () => void };
type HeaderSession = { user?: { name?: string | null; email?: string | null; image?: string | null } };

const toolLinkBase =
  "flex min-h-14 items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 no-underline transition-colors hover:border-white/20 hover:bg-white/10";
const toolIcon =
  "grid size-9 shrink-0 place-items-center rounded-lg border border-white/15 bg-[#10213a] text-cyan-200";

function toolLinkClass(isActive = false) {
  return `${toolLinkBase} ${isActive ? "border-cyan-200/40 bg-cyan-200/15" : ""}`;
}

function HeaderAccount() {
  const [session, setSession] = useState<HeaderSession | null | undefined>(undefined);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/session", { credentials: "same-origin", signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<HeaderSession> : Promise.reject())
      .then((value) => setSession(value?.user ? value : null))
      .catch(() => setSession(null));
    return () => controller.abort();
  }, []);

  if (session === undefined) {
    return <span className="block h-10 w-24 animate-pulse rounded-full bg-white/10" aria-label="Loading account" />;
  }

  if (!session?.user) {
    return (
      <Link
        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/20 bg-[#10213a] px-4 text-xs font-extrabold text-cyan-200 no-underline transition-colors hover:border-cyan-200/50 hover:bg-white/10 max-[520px]:size-10 max-[520px]:justify-center max-[520px]:px-0"
        href="/login"
      >
        <LogIn size={16} /> <span className="max-[520px]:sr-only">Sign in</span>
      </Link>
    );
  }

  const label = session.user.name || session.user.email || "Signed-in user";
  const initials = label.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const avatar = (
    <span
      className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#00539d] to-[#1688bd] text-[11px] font-extrabold tracking-wide text-white"
      aria-hidden="true"
    >
      {session.user.image ? <img className="size-full object-cover" src={session.user.image} alt="" /> : initials || "U"}
    </span>
  );

  return (
    <details className="group/account relative">
      <summary
        className="grid min-h-11 cursor-pointer list-none grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-full border border-white/20 bg-[#10213a] py-1 pr-3 pl-1 transition hover:border-cyan-200/50 hover:shadow-[0_5px_16px_rgba(9,13,70,.07)] [&::-webkit-details-marker]:hidden max-[700px]:grid-cols-1 max-[700px]:p-1"
        aria-label={`Account menu for ${label}`}
      >
        {avatar}
        <span className="min-w-0 max-w-44 max-[700px]:hidden">
          <small className="block text-[8px] font-extrabold tracking-[.12em] text-slate-300">SIGNED IN</small>
          <strong className="block overflow-hidden text-xs font-extrabold text-ellipsis whitespace-nowrap text-white">{label}</strong>
        </span>
        <ChevronDown className="text-slate-300 transition-transform group-open/account:rotate-180 max-[700px]:hidden" size={15} />
      </summary>
      <div className="absolute top-[calc(100%+9px)] right-0 z-50 w-[290px] overflow-hidden rounded-2xl border border-white/15 bg-[#10213a] p-3 shadow-[0_18px_46px_rgba(9,13,70,.16)] max-[700px]:fixed max-[700px]:top-16 max-[700px]:right-4 max-[700px]:w-[min(290px,calc(100vw-32px))]">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 px-2 pt-1 pb-3">
          {avatar}
          <p className="m-0 min-w-0">
            <strong className="block overflow-hidden text-sm font-extrabold text-ellipsis whitespace-nowrap text-white">{session.user.name || "CPA Tools user"}</strong>
            <small className="mt-0.5 block overflow-hidden text-[11px] text-ellipsis whitespace-nowrap text-slate-300">{session.user.email}</small>
          </p>
        </div>
        <button
          className="flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-lg border-0 bg-red-400/10 px-3 text-xs font-extrabold text-red-200 transition-colors hover:bg-red-400/20"
          type="button"
          onClick={() => void signOut({ callbackUrl: "/" })}
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </details>
  );
}

function ToolCopy({ title, detail }: { title: string; detail: string }) {
  return (
    <span className="min-w-0 flex-1">
      <strong className="block text-sm leading-5 font-extrabold text-white">{title}</strong>
      <small className="mt-0.5 block text-[11px] leading-4 font-semibold text-slate-300">{detail}</small>
    </span>
  );
}

function ToolboxLinks({ pathname, close }: ToolboxLinksProps) {
  const active = (href: string) => href === "/" ? pathname === "/" || pathname === "/website-audit" : pathname.startsWith(href);
  const [groups, setGroups] = useState({
    google: pathname === "/" || pathname === "/website-audit",
    release: true,
    operations: pathname.startsWith("/disruptions"),
  });

  function setGroup(group: keyof typeof groups, open: boolean) {
    setGroups((current) => ({ ...current, [group]: open }));
  }

  const summaryClass =
    "flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-2 text-[11px] font-extrabold tracking-[.08em] text-slate-300 uppercase [&::-webkit-details-marker]:hidden";
  const groupClass = "group border-t border-white/15";

  return (
    <nav className="grid content-start gap-4 py-5" aria-label="Workspace tools">
      <section className="grid gap-1.5">
        <p className="m-0 px-3 pb-1 text-[10px] font-extrabold tracking-[.11em] text-cyan-200 uppercase">Primary tool</p>
        <Link className={toolLinkClass(pathname === "/website-audit")} href="/website-audit" onClick={close}>
          <span className={toolIcon}><SearchCheck size={19} /></span>
          <ToolCopy title="Website audit" detail="SEO, GEO, links and accessibility" />
        </Link>
        <Link className={toolLinkClass(active("/history"))} href="/history" onClick={close}>
          <span className={toolIcon}><BarChart3 size={19} /></span>
          <ToolCopy title="Audit history" detail="Page findings and recommended fixes" />
        </Link>
      </section>

      <details className={groupClass} open={groups.release} onToggle={(event) => setGroup("release", event.currentTarget.open)}>
        <summary className={summaryClass}>Release workflow <ChevronDown className="transition-transform group-open:rotate-180" size={15} /></summary>
        <div className="grid gap-1 pb-3">
          <Link className={toolLinkClass(pathname === "/smoke-test")} href="/smoke-test" onClick={close}>
            <span className={toolIcon}><Gauge size={19} /></span>
            <ToolCopy title="Smoke testing" detail="Check up to 100 pages" />
          </Link>
          <Link className={toolLinkClass(active("/smoke-test/history"))} href="/smoke-test/history" onClick={close}>
            <span className={toolIcon}><BarChart3 size={19} /></span>
            <ToolCopy title="Smoke test history" detail="Release runs and URL results" />
          </Link>
        </div>
      </details>

      <details className={groupClass} open={groups.google} onToggle={(event) => setGroup("google", event.currentTarget.open)}>
        <summary className={summaryClass}>Google search tools <ChevronDown className="transition-transform group-open:rotate-180" size={15} /></summary>
        <div className="grid gap-1 pb-3">
          <a className={toolLinkClass()} href="https://search.google.com/search-console" target="_blank" rel="noreferrer">
            <ToolCopy title="Search Console" detail="Indexing and URL inspection" /><ExternalLink className="shrink-0 text-slate-300" size={15} />
          </a>
          <a className={toolLinkClass()} href="https://pagespeed.web.dev/" target="_blank" rel="noreferrer">
            <ToolCopy title="PageSpeed Insights" detail="Performance and Core Web Vitals" /><ExternalLink className="shrink-0 text-slate-300" size={15} />
          </a>
          <a className={toolLinkClass()} href="https://search.google.com/test/rich-results" target="_blank" rel="noreferrer">
            <ToolCopy title="Rich Results Test" detail="Structured-data eligibility" /><ExternalLink className="shrink-0 text-slate-300" size={15} />
          </a>
        </div>
      </details>

      <details className={groupClass} open={groups.operations} onToggle={(event) => setGroup("operations", event.currentTarget.open)}>
        <summary className={summaryClass}>Commuter tools <ChevronDown className="transition-transform group-open:rotate-180" size={15} /></summary>
        <div className="grid gap-1 pb-3">
          <Link className={toolLinkClass(active("/disruptions"))} href="/disruptions" onClick={close}>
            <span className={toolIcon}><TrainFront size={19} /></span>
            <ToolCopy title="Train line status" detail="All Metro lines · Okta sign-in" />
          </Link>
        </div>
      </details>
    </nav>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  useEffect(() => { setOpen(false); }, [pathname]);
  function close() { setOpen(false); }
  return <header className="relative z-20 bg-[#071226] text-white xl:sticky xl:top-0">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[252px] flex-col overflow-y-auto border-r border-white/15 bg-[#071226] px-4 py-5 text-white xl:flex" aria-label="Company tools">
      <Link className="flex items-center gap-3 border-b border-white/15 px-2 pb-5 text-white no-underline" href="/website-audit" aria-label="CPA Tools home">
        <span className="grid size-11 place-items-center rounded-xl bg-cyan-200 text-[#071226]"><MonitorCheck size={22}/></span>
        <strong className="text-[15px] leading-tight font-extrabold">CPA Tools<br/>Website Audit</strong>
      </Link>
      <ToolboxLinks pathname={pathname}/>
    </aside>
    <nav className="shell flex h-[76px] items-center justify-between gap-5 border-b border-white/15 xl:h-[70px] xl:w-full xl:max-w-none xl:px-8" aria-label="Top navigation">
      <Link href="/website-audit" aria-label="CPA Tools home" className="flex items-center gap-3 text-white no-underline xl:hidden">
        <span className="grid size-10 place-items-center rounded-xl bg-cyan-200 text-[#071226]"><MonitorCheck size={20}/></span>
        <strong className="max-[600px]:hidden">CPA Tools</strong>
      </Link>
      <div className="hidden gap-0.5 xl:grid">
        <span className="text-[9px] font-extrabold tracking-[.13em] text-cyan-200">COMPANY WORKSPACE</span>
        <strong className="text-[15px] text-white">Website audit &amp; supporting tools</strong>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <HeaderAccount/>
        <button type="button" onClick={() => setOpen(!open)} aria-label={open ? "Close company toolbox" : "Open company toolbox"} aria-expanded={open} className="inline-flex h-10 min-w-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 text-xs font-bold text-white hover:bg-white/10 xl:hidden">
          {open ? <X size={19}/> : <Menu size={19}/>}<span className="max-[520px]:hidden">Tools</span>
        </button>
      </div>
    </nav>
    {open && <>
      <button className="fixed inset-0 z-30 border-0 bg-black/50 backdrop-blur-sm xl:hidden" onClick={close} aria-label="Close company toolbox"/>
      <aside className="fixed inset-y-0 right-0 z-[31] w-[min(410px,100vw)] overflow-y-auto border-l border-white/15 bg-[#071226] p-6 text-white shadow-2xl xl:hidden" onKeyDown={event => event.key === "Escape" && close()} aria-label="Company toolbox" role="dialog" aria-modal="true">
        <div className="flex items-start justify-between gap-5 border-b border-white/15 pb-5">
          <div><p className="m-0 text-[10px] font-bold tracking-wider text-cyan-200">COMPANY TOOLBOX</p><h2 className="mt-1.5 mb-0 text-2xl font-extrabold text-white">Everything in one place.</h2></div>
          <button type="button" onClick={close} aria-label="Close toolbox" className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-lg border border-white/20 bg-white/5 text-white hover:bg-white/10"><X size={19}/></button>
        </div>
        <ToolboxLinks pathname={pathname} close={close}/>
      </aside>
    </>}
    <div className="shell pb-2 [&_.daily-brief]:mt-3"><DailyBrief/></div>
  </header>;
}
