"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ChevronDown,
  ExternalLink,
  Gauge,
  Home,
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
  "flex min-h-14 items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 no-underline transition-colors hover:border-[#d5e4f4] hover:bg-[#f0f5fe]";
const toolIcon =
  "grid size-9 shrink-0 place-items-center rounded-lg border border-[#dce6f2] bg-white text-[#00539d]";

function toolLinkClass(isActive = false) {
  return `${toolLinkBase} ${isActive ? "border-[#bed4ee] bg-[#eaf2fe]" : ""}`;
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
    return <span className="block h-10 w-24 animate-pulse rounded-full bg-slate-100" aria-label="Loading account" />;
  }

  if (!session?.user) {
    return (
      <a
        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#cbd8e7] bg-white px-4 text-xs font-extrabold text-[#00539d] no-underline transition-colors hover:border-[#00539d] hover:bg-[#f0f5fe] max-[520px]:size-10 max-[520px]:justify-center max-[520px]:px-0"
        href="/login"
      >
        <LogIn size={16} /> <span className="max-[520px]:sr-only">Sign in</span>
      </a>
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
        className="grid min-h-11 cursor-pointer list-none grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-full border border-[#d9e1eb] bg-white py-1 pr-3 pl-1 transition hover:border-[#adc4dc] hover:shadow-[0_5px_16px_rgba(9,13,70,.07)] [&::-webkit-details-marker]:hidden max-[700px]:grid-cols-1 max-[700px]:p-1"
        aria-label={`Account menu for ${label}`}
      >
        {avatar}
        <span className="min-w-0 max-w-44 max-[700px]:hidden">
          <small className="block text-[8px] font-extrabold tracking-[.12em] text-[#767676]">SIGNED IN</small>
          <strong className="block overflow-hidden text-xs font-extrabold text-ellipsis whitespace-nowrap text-[#090d46]">{label}</strong>
        </span>
        <ChevronDown className="text-[#767676] transition-transform group-open/account:rotate-180 max-[700px]:hidden" size={15} />
      </summary>
      <div className="absolute top-[calc(100%+9px)] right-0 z-50 w-[290px] overflow-hidden rounded-2xl border border-[#dce3ec] bg-white p-3 shadow-[0_18px_46px_rgba(9,13,70,.16)] max-[700px]:fixed max-[700px]:top-16 max-[700px]:right-4 max-[700px]:w-[min(290px,calc(100vw-32px))]">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 px-2 pt-1 pb-3">
          {avatar}
          <p className="m-0 min-w-0">
            <strong className="block overflow-hidden text-sm font-extrabold text-ellipsis whitespace-nowrap text-[#090d46]">{session.user.name || "CPA Tools user"}</strong>
            <small className="mt-0.5 block overflow-hidden text-[11px] text-ellipsis whitespace-nowrap text-[#767676]">{session.user.email}</small>
          </p>
        </div>
        <button
          className="flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-lg border-0 bg-[#ffeded] px-3 text-xs font-extrabold text-[#8b2023] transition-colors hover:bg-[#ffe1e1]"
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
      <strong className="block text-sm leading-5 font-extrabold text-[#090d46]">{title}</strong>
      <small className="mt-0.5 block text-[11px] leading-4 font-semibold text-[#667181]">{detail}</small>
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
    "flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-2 text-[11px] font-extrabold tracking-[.08em] text-[#697485] uppercase [&::-webkit-details-marker]:hidden";
  const groupClass = "group border-t border-[#e1e6ed]";

  return (
    <nav className="grid content-start gap-4 py-5" aria-label="Workspace tools">
      <section className="grid gap-1.5">
        <p className="m-0 px-3 pb-1 text-[10px] font-extrabold tracking-[.11em] text-[#00539d] uppercase">Primary tool</p>
        <a className={toolLinkClass(pathname === "/")} href="/" onClick={close}>
          <span className={toolIcon}><Home size={19} /></span>
          <ToolCopy title="Workspace home" detail="Your tools and next steps" />
        </a>
        <a className={toolLinkClass(pathname === "/website-audit")} href="/website-audit" onClick={close}>
          <span className={toolIcon}><SearchCheck size={19} /></span>
          <ToolCopy title="Website audit" detail="SEO, GEO, links and accessibility" />
        </a>
        <a className={toolLinkClass(active("/history"))} href="/history" onClick={close}>
          <span className={toolIcon}><BarChart3 size={19} /></span>
          <ToolCopy title="Audit history" detail="Page findings and recommended fixes" />
        </a>
      </section>

      <details className={groupClass} open={groups.release} onToggle={(event) => setGroup("release", event.currentTarget.open)}>
        <summary className={summaryClass}>Release workflow <ChevronDown className="transition-transform group-open:rotate-180" size={15} /></summary>
        <div className="grid gap-1 pb-3">
          <a className={toolLinkClass(pathname === "/smoke-test")} href="/smoke-test" onClick={close}>
            <span className={toolIcon}><Gauge size={19} /></span>
            <ToolCopy title="Smoke testing" detail="Check up to 100 pages" />
          </a>
          <a className={toolLinkClass(active("/smoke-test/history"))} href="/smoke-test/history" onClick={close}>
            <span className={toolIcon}><BarChart3 size={19} /></span>
            <ToolCopy title="Smoke test history" detail="Release runs and URL results" />
          </a>
        </div>
      </details>

      <details className={groupClass} open={groups.google} onToggle={(event) => setGroup("google", event.currentTarget.open)}>
        <summary className={summaryClass}>Google search tools <ChevronDown className="transition-transform group-open:rotate-180" size={15} /></summary>
        <div className="grid gap-1 pb-3">
          <a className={toolLinkClass()} href="https://search.google.com/search-console" target="_blank" rel="noreferrer">
            <ToolCopy title="Search Console" detail="Indexing and URL inspection" /><ExternalLink className="shrink-0 text-[#8b96a5]" size={15} />
          </a>
          <a className={toolLinkClass()} href="https://pagespeed.web.dev/" target="_blank" rel="noreferrer">
            <ToolCopy title="PageSpeed Insights" detail="Performance and Core Web Vitals" /><ExternalLink className="shrink-0 text-[#8b96a5]" size={15} />
          </a>
          <a className={toolLinkClass()} href="https://search.google.com/test/rich-results" target="_blank" rel="noreferrer">
            <ToolCopy title="Rich Results Test" detail="Structured-data eligibility" /><ExternalLink className="shrink-0 text-[#8b96a5]" size={15} />
          </a>
        </div>
      </details>

      <details className={groupClass} open={groups.operations} onToggle={(event) => setGroup("operations", event.currentTarget.open)}>
        <summary className={summaryClass}>Commuter tools <ChevronDown className="transition-transform group-open:rotate-180" size={15} /></summary>
        <div className="grid gap-1 pb-3">
          <a className={toolLinkClass(active("/disruptions"))} href="/disruptions" onClick={close}>
            <span className={toolIcon}><TrainFront size={19} /></span>
            <ToolCopy title="Train line status" detail="All Metro lines · Okta sign-in" />
          </a>
        </div>
      </details>
    </nav>
  );
}

export function SiteHeader({ variant = "workspace" }: { variant?: "home" | "workspace" }) {
  const isHome = variant === "home";
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open || isHome) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open, isHome]);

  useEffect(() => {
    setOpen(false);
  }, [pathname, variant]);

  function close() {
    setOpen(false);
  }

  return (
    <header className="relative z-20 bg-white/95 xl:sticky xl:top-0 xl:bg-white">
      {!isHome && <aside className="fixed inset-y-0 left-0 z-40 hidden w-[252px] flex-col overflow-y-auto border-r border-[#e2e7ef] bg-[#f8fafc] px-4 py-5 xl:flex" aria-label="Company tools">
        <a className="flex items-center gap-3 border-b border-[#dfe4ec] px-2 pb-5 text-[#090d46] no-underline" href="/" aria-label="PAS Website Quality Checker home">
          <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-[#00539d] to-[#0878bd] text-white shadow-sm"><MonitorCheck size={22} strokeWidth={2.2} /></span>
          <strong className="text-[15px] leading-[1.25] font-extrabold tracking-[-.01em]">PAS Website<br />Audit</strong>
        </a>
        <ToolboxLinks pathname={pathname} />
      </aside>}

      <nav className={`${isHome ? "mx-auto w-full max-w-[1280px] px-5 sm:px-8" : "shell xl:w-full xl:max-w-none xl:px-8"} flex h-[76px] items-center justify-between gap-5 border-b border-[#dddddd] xl:h-[70px]`} aria-label="Top navigation">
        <a className={`flex items-center gap-3 text-[17px] font-extrabold tracking-[-.2px] text-[#090d46] no-underline ${isHome ? "" : "xl:hidden"}`} href="/" aria-label="PAS Website Quality Checker home">
          <span className="grid size-10 place-items-center rounded-[11px] bg-gradient-to-br from-[#00539d] to-[#0878bd] text-white"><MonitorCheck size={20} strokeWidth={2.2} /></span>
          <span className={isHome ? "" : "max-[600px]:hidden"}>{isHome ? "CPA Tools" : "PAS Website Quality Checker"}</span>
        </a>
        {!isHome && <div className="hidden gap-0.5 xl:grid">
          <span className="text-[9px] font-extrabold tracking-[.13em] text-[#00539d]">COMPANY WORKSPACE</span>
          <strong className="text-[15px] text-[#090d46]">Website audit &amp; supporting tools</strong>
        </div>}
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center"><HeaderAccount /></div>
          {!isHome && <button
            className="inline-flex h-10 min-w-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#d7dee8] bg-white px-3 text-xs font-extrabold text-[#090d46] transition-colors hover:border-[#00539d] hover:text-[#00539d] xl:hidden max-[520px]:px-0"
            onClick={() => (open ? close() : setOpen(true))}
            aria-label={open ? "Close company toolbox" : "Open company toolbox"}
            aria-expanded={open}
          >
            {open ? <X size={19} /> : <Menu size={19} />}<span className="max-[520px]:hidden">Tools</span>
          </button>}
        </div>
      </nav>

      {!isHome && open ? (
        <>
          <button className="fixed inset-0 z-30 cursor-default border-0 bg-[#090d46]/30 backdrop-blur-[2px] xl:hidden" onClick={close} aria-label="Close company toolbox" />
          <aside className="fixed inset-y-0 right-0 z-[31] w-[min(410px,100vw)] overflow-y-auto border-l border-[#dddddd] bg-[#f8fafc] p-6 shadow-[-22px_0_60px_rgba(9,13,70,.16)] xl:hidden" onKeyDown={(event) => event.key === "Escape" && close()} aria-label="Company toolbox" role="dialog" aria-modal="true">
            <div className="flex items-start justify-between gap-5 border-b border-[#dddddd] pb-5">
              <div><p className="m-0 text-[10px] font-extrabold tracking-[.11em] text-[#00539d]">COMPANY TOOLBOX</p><h2 className="mt-1.5 mb-0 text-2xl font-extrabold text-[#090d46]">Everything in one place.</h2></div>
              <button className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-lg border border-[#d7dee8] bg-white text-[#090d46] hover:border-[#00539d] hover:text-[#00539d]" type="button" onClick={close} aria-label="Close toolbox"><X size={19} /></button>
            </div>
            <ToolboxLinks pathname={pathname} close={close} />
          </aside>
        </>
      ) : null}

      <div className={`${isHome ? "mx-auto w-full max-w-[1280px] px-5 sm:px-8" : "shell"} pb-2 [&_.daily-brief]:mt-3`}>
        <DailyBrief />
      </div>
    </header>
  );
}
