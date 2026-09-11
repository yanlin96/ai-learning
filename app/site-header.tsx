"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, ChevronDown, ExternalLink, Gauge, Menu, ScanSearch, SearchCheck, TrainFront, X } from "lucide-react";
import { PASSCODE, UNLOCK_KEY } from "@/app/secret-gate";

type ToolboxLinksProps = { pathname: string; close?: () => void };

function ToolboxLinks({ pathname, close }: ToolboxLinksProps) {
  const active = (href: string) => href === "/" ? pathname === "/" || pathname === "/website-audit" : pathname.startsWith(href);
  const [groups, setGroups] = useState({
    google: pathname === "/" || pathname === "/website-audit",
    release: pathname.startsWith("/smoke-test") || pathname.startsWith("/history"),
    operations: pathname.startsWith("/disruptions"),
  });
  function setGroup(group: keyof typeof groups, open: boolean) {
    setGroups((current) => ({ ...current, [group]: open }));
  }
  return (
    <nav className="toolbox-nav">
      <section className="primary-audit"><p>PRIMARY TOOL</p>
        <a className={active("/") ? "active" : ""} href="/" onClick={close}><span><SearchCheck size={18} /></span><div><strong>Website audit</strong><small>SEO, GEO, links and accessibility</small></div></a>
      </section>
      <details className="tool-group" open={groups.google} onToggle={(event) => setGroup("google", event.currentTarget.open)}>
        <summary>Google SEO tools <ChevronDown size={14} /></summary>
        <div>
          <a href="https://pagespeed.web.dev/" target="_blank" rel="noreferrer"><div><strong>PageSpeed Insights</strong><small>Performance and Core Web Vitals</small></div><ExternalLink size={14} /></a>
          <a href="https://search.google.com/test/rich-results" target="_blank" rel="noreferrer"><div><strong>Rich Results Test</strong><small>Structured-data eligibility</small></div><ExternalLink size={14} /></a>
          <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer"><div><strong>Search Console</strong><small>Indexing and URL inspection</small></div><ExternalLink size={14} /></a>
        </div>
      </details>
      <details className="tool-group" open={groups.release} onToggle={(event) => setGroup("release", event.currentTarget.open)}>
        <summary>Release workflow <ChevronDown size={14} /></summary>
        <div>
          <a className={active("/smoke-test") ? "active" : ""} href="/smoke-test" onClick={close}><span><Gauge size={18} /></span><div><strong>Smoke testing</strong><small>Check up to 100 pages</small></div></a>
          <a className={active("/history") ? "active" : ""} href="/history" onClick={close}><span><BarChart3 size={18} /></span><div><strong>Reports</strong><small>Recent audit and smoke runs</small></div></a>
        </div>
      </details>
      <details className="tool-group" open={groups.operations} onToggle={(event) => setGroup("operations", event.currentTarget.open)}>
        <summary>Daily operations <ChevronDown size={14} /></summary>
        <div><a className={active("/disruptions") ? "active" : ""} href="/disruptions" onClick={close}><span><TrainFront size={18} /></span><div><strong>Train line status</strong><small>Werribee changes and notices</small></div></a></div>
      </details>
    </nav>
  );
}

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  function close() {
    setOpen(false);
    setValue("");
    setError(false);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (value !== PASSCODE) {
      setError(true);
      setValue("");
      return;
    }
    try { sessionStorage.setItem(UNLOCK_KEY, "1"); } catch {}
    close();
    router.push("/reminders");
  }

  const StaffUnlock = ({ compact = false }: { compact?: boolean }) => (
    <div className={compact ? "staff-unlock compact" : "staff-unlock"}>
      <p className="label">STAFF REMINDER ACCESS</p>
      <form onSubmit={submit}>
        <input type="password" inputMode="numeric" value={value} onChange={(event) => { setValue(event.target.value); setError(false); }} placeholder="Passcode" aria-label={compact ? "Sidebar passcode" : "Passcode"} />
        <button type="submit">{compact ? "Go" : "Unlock"}</button>
      </form>
      {error ? <p className="menu-error">Incorrect passcode.</p> : null}
    </div>
  );

  return (
    <header className="site-header">
      <aside className="desktop-sidebar" aria-label="Company tools">
        <a className="sidebar-brand" href="/" aria-label="PAS Website Quality Checker home"><span><ScanSearch size={19} /></span><strong>PAS Website<br />Audit</strong></a>
        <ToolboxLinks pathname={pathname} />
        <StaffUnlock compact />
      </aside>
      <nav className="nav shell">
        <a className="brand" href="/" aria-label="PAS Website Quality Checker home">
          <span className="brand-mark"><ScanSearch size={19} strokeWidth={2.4} /></span>
          <span>PAS Website Quality Checker</span>
        </a>
        <div className="workspace-title"><span>COMPANY WORKSPACE</span><strong>Website audit &amp; supporting tools</strong></div>
        <div className="nav-actions">
          <a href="/">Website audit</a>
          <a href="/smoke-test">Smoke test</a>
          <a href="/history">Reports</a>
          <div className="menu-wrap">
            <button className="menu-button" onClick={() => (open ? close() : setOpen(true))} aria-label="Open company toolbox" aria-expanded={open}>
              {open ? <X size={19} /> : <Menu size={19} />}<span>Tools</span>
            </button>
            {open ? <>
              <div className="menu-backdrop" onClick={close} />
              <aside className="menu-panel" onKeyDown={(event) => event.key === "Escape" && close()} aria-label="Company toolbox">
                <div className="toolbox-head"><div><p className="label">COMPANY TOOLBOX</p><h2>Everything in one place.</h2></div><button type="button" onClick={close} aria-label="Close toolbox"><X size={19} /></button></div>
                <ToolboxLinks pathname={pathname} close={close} />
                <StaffUnlock />
              </aside>
            </> : null}
          </div>
        </div>
      </nav>
    </header>
  );
}
