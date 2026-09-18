"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, Bot, LoaderCircle, MessageCircle, Send, X } from "lucide-react";
import Link from "next/link";
import { ASSISTANT_SUGGESTIONS, matchWorkspaceMessage, type WorkspaceAssistantAction, type WorkspaceAssistantResult, type WorkspaceAssistantRunIntent } from "@/lib/workspace-assistant";
import { saveAssistantReport } from "@/lib/assistant-reports";
import type { AccessibilityEstimateReport } from "@/lib/accessibility-estimate";
import type { SmokeTestReport } from "@/lib/smoke-test";
import type { WebsiteAudit } from "@/lib/website-audit";

type ChatAction = { href: string; label: string; detail: string };
type ChatMessage = { id: number; role: "assistant" | "user"; text: string; action?: ChatAction };

const INITIAL_MESSAGE: ChatMessage = {
  id: 1,
  role: "assistant",
  text: "Hi — give me a public URL and the check you need. I’ll run the protected tool and post a private report link here when it is ready.",
};

const responseDelay = () => new Promise((resolve) => setTimeout(resolve, 400));

async function interpretMessage(message: string, pendingIntent: WorkspaceAssistantRunIntent | null): Promise<WorkspaceAssistantResult> {
  const deterministic = matchWorkspaceMessage(message, pendingIntent);
  if (deterministic) return deterministic;
  const response = await fetch("/api/assistant/interpret", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message, pendingIntent }),
  });
  const payload = await response.json() as { result?: WorkspaceAssistantResult; error?: string };
  if (!response.ok || !payload.result) throw new Error(payload.error || "Semantic interpretation is unavailable");
  return payload.result;
}

function presentAction(action: WorkspaceAssistantAction): ChatAction {
  if (action.type === "run_website_audit") return { href: action.href, label: "Review & run Website Audit", detail: new URL(action.url).hostname };
  if (action.type === "run_accessibility_audit") return { href: action.href, label: "Review & run Accessibility Estimate", detail: new URL(action.url).hostname };
  if (action.type === "run_smoke_test") return { href: action.href, label: "Review & run Smoke Test", detail: new URL(action.url).hostname };
  const labels = { audit_history: "Open Audit History", smoke_history: "Open Smoke Test History", train_status: "Open Train Line Status" };
  return { href: action.href, label: labels[action.destination], detail: "CPA Tools workspace" };
}

async function runWorkspaceAction(action: Exclude<WorkspaceAssistantAction, { type: "navigate" }>) {
  if (action.type === "run_website_audit") {
    const response = await fetch("/api/audits", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: action.url }) });
    const payload = await response.json() as { report?: WebsiteAudit; error?: string };
    if (!response.ok || !payload.report) throw new Error(payload.error || "Website Audit failed");
    return saveAssistantReport({ kind: "website_audit", targetUrl: action.url, report: payload.report });
  }
  if (action.type === "run_accessibility_audit") {
    const response = await fetch("/api/accessibility-audits", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: action.url }) });
    const payload = await response.json() as { report?: AccessibilityEstimateReport; error?: string };
    if (!response.ok || !payload.report) throw new Error(payload.error || "Accessibility Estimate failed");
    return saveAssistantReport({ kind: "accessibility_audit", targetUrl: action.url, report: payload.report });
  }
  const response = await fetch("/api/smoke-tests", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ baseUrl: action.url, manualUrls: [], limit: 30 }) });
  const payload = await response.json() as { report?: SmokeTestReport; error?: string };
  if (!response.ok || !payload.report) throw new Error(payload.error || "Smoke Test failed");
  return saveAssistantReport({ kind: "smoke_test", targetUrl: action.url, report: payload.report });
}

function runningCopy(action: Exclude<WorkspaceAssistantAction, { type: "navigate" }>) {
  const host = new URL(action.url).hostname;
  if (action.type === "run_accessibility_audit") return `Running Accessibility Estimate for ${host}. I’ll post the report link here when it is ready.`;
  if (action.type === "run_smoke_test") return `Running the standard Smoke Test for ${host}. I’ll post the report link here when it is ready.`;
  return `Running Website Audit for ${host}. I’ll post the report link here when it is ready.`;
}

function completedReportAction(action: Exclude<WorkspaceAssistantAction, { type: "navigate" }>, reportId: string): ChatAction {
  const label = action.type === "run_accessibility_audit"
    ? "View Accessibility Estimate report"
    : action.type === "run_smoke_test"
      ? "View Smoke Test report"
      : "View Website Audit report";
  return { href: `/reports/${reportId}`, label, detail: `/reports/${reportId}` };
}

export function WorkspaceAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [pendingIntent, setPendingIntent] = useState<WorkspaceAssistantRunIntent | null>(null);
  const [activity, setActivity] = useState<"thinking" | "running" | null>(null);
  const nextId = useRef(2);
  const inputRef = useRef<HTMLInputElement>(null);
  const latestActionRef = useRef<HTMLAnchorElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const processingRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, activity]);

  function close() {
    setOpen(false);
    requestAnimationFrame(() => launcherRef.current?.focus());
  }

  async function sendMessage(raw: string) {
    const value = raw.trim();
    if (!value || processingRef.current) return;
    processingRef.current = true;
    setMessages((current) => [...current, { id: nextId.current++, role: "user", text: value }]);
    setInput("");
    setActivity("thinking");
    requestAnimationFrame(() => closeButtonRef.current?.focus());
    await responseDelay();
    let result: WorkspaceAssistantResult;
    try {
      result = await interpretMessage(value, pendingIntent);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Semantic interpretation is unavailable";
      setMessages((current) => [...current, { id: nextId.current++, role: "assistant", text: `${message}. Please try a more direct request, such as “Audit example.com”.` }]);
      setActivity(null);
      processingRef.current = false;
      requestAnimationFrame(() => inputRef.current?.focus());
      return;
    }
    setPendingIntent(result.nextIntent);
    if (!result.action) {
      setMessages((current) => [...current, { id: nextId.current++, role: "assistant", text: result.reply }]);
      setActivity(null);
      processingRef.current = false;
      requestAnimationFrame(() => inputRef.current?.focus());
      return;
    }
    const action = result.action;
    if (action.type === "navigate") {
      setMessages((current) => [...current, { id: nextId.current++, role: "assistant", text: result.reply, action: presentAction(action) }]);
      setActivity(null);
      processingRef.current = false;
      requestAnimationFrame(() => latestActionRef.current?.focus());
      return;
    }
    setMessages((current) => [...current, { id: nextId.current++, role: "assistant", text: runningCopy(action) }]);
    setActivity("running");
    try {
      const reportId = await runWorkspaceAction(action);
      setMessages((current) => [...current, {
        id: nextId.current++,
        role: "assistant",
        text: "Your report is ready. Use the private link below when you want to review it.",
        action: completedReportAction(action, reportId),
      }]);
      setActivity(null);
      requestAnimationFrame(() => latestActionRef.current?.focus());
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "The check could not be completed";
      setMessages((current) => [...current, { id: nextId.current++, role: "assistant", text: `${message}. You can open the dedicated tool and try again.`, action: presentAction(action) }]);
      setActivity(null);
      requestAnimationFrame(() => latestActionRef.current?.focus());
    } finally {
      processingRef.current = false;
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void sendMessage(input);
  }

  return <>
    {open && <><button type="button" tabIndex={-1} aria-label="Close assistant backdrop" className="fixed inset-0 z-40 cursor-default border-0 bg-black/25 sm:bg-black/10" onClick={close}/><section
      ref={panelRef}
      id="workspace-assistant-panel"
      className="fixed right-4 bottom-20 z-50 flex h-[min(620px,calc(100dvh-104px))] w-[min(390px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_22px_60px_rgba(7,18,38,.24)] sm:right-6 sm:bottom-24"
      aria-label="CPA Tools assistant"
      aria-modal="true"
      role="dialog"
      onKeyDown={(event) => {
        if (event.key === "Escape") { event.preventDefault(); close(); return; }
        if (event.key !== "Tab") return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), a[href]')).filter(element => element.getClientRects().length > 0);
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}
    >
      <header className="flex items-center justify-between gap-4 bg-[#071226] px-4 py-3 text-white">
        <div className="flex min-w-0 items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-cyan-200 text-[#071226]"><Bot size={19}/></span><span className="min-w-0"><strong className="block text-sm font-extrabold">CPA Tools assistant</strong><small className="block text-xs leading-5 text-slate-300">Runs protected workspace checks</small></span></div>
        <button ref={closeButtonRef} className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-lg border border-white/20 bg-white/5 text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200" type="button" aria-label="Close assistant" onClick={close}><X size={18}/></button>
      </header>
      <div ref={logRef} className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4" role="log" aria-live="polite" aria-relevant="additions">
        <div className="space-y-3">
          {messages.map((message) => <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`} key={message.id}>
            <div className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-sm leading-6 ${message.role === "user" ? "bg-[#00539d] text-white" : "border border-slate-200 bg-white text-slate-700"}`}>
              <p className="m-0">{message.text}</p>
              {message.action && <Link ref={latestActionRef} className="mt-3 flex min-h-12 items-center justify-between gap-3 rounded-lg bg-[#00539d] px-3 py-2.5 font-bold text-white no-underline hover:bg-[#003f78] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00539d]" href={message.action.href} onClick={() => setOpen(false)}>
                <span className="min-w-0"><span className="block">{message.action.label}</span><small className="block truncate font-normal text-blue-100">{message.action.detail}</small></span><ArrowRight className="shrink-0" size={17}/>
              </Link>}
            </div>
          </div>)}
          {activity && <div className="flex justify-start" role="status" aria-live="polite"><p className="m-0 inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-3.5 py-2.5 text-sm leading-6 text-[#00539d]"><LoaderCircle className="animate-spin motion-reduce:animate-none" size={16}/>{activity === "thinking" ? "Understanding your request…" : "Running the protected check…"}</p></div>}
        </div>
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Suggested questions">
          {ASSISTANT_SUGGESTIONS.map((suggestion) => <button className="min-h-10 cursor-pointer rounded-lg border border-blue-200 bg-white px-3 text-left text-xs font-bold text-[#00539d] hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00539d] disabled:cursor-wait disabled:opacity-50" type="button" key={suggestion} disabled={Boolean(activity)} onClick={() => void sendMessage(suggestion)}>{suggestion}</button>)}
        </div>
      </div>
      <form className="border-t border-slate-200 bg-white p-3" onSubmit={submit}>
        <label className="sr-only" htmlFor="workspace-assistant-input">Ask CPA Tools</label>
        <div className="flex items-center gap-2 rounded-xl border border-slate-300 p-1.5 pl-3 focus-within:border-[#00539d] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#00539d]">
          <input ref={inputRef} id="workspace-assistant-input" className="h-10 min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-500 disabled:cursor-wait disabled:bg-transparent" value={input} onChange={(event) => setInput(event.target.value)} placeholder={activity ? "Please wait…" : "Ask or paste a website URL…"} autoComplete="off" disabled={Boolean(activity)}/>
          <button className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-lg border-0 bg-[#00539d] text-white hover:bg-[#003f78] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00539d] disabled:cursor-not-allowed disabled:opacity-50" type="submit" disabled={!input.trim() || Boolean(activity)} aria-label="Send message">{activity ? <LoaderCircle className="animate-spin motion-reduce:animate-none" size={17}/> : <Send size={17}/>}</button>
        </div>
        <p className="mt-2 mb-0 flex items-center gap-1.5 text-xs leading-5 text-slate-600"><ArrowRight size={13}/> Completed reports appear here as private links.</p>
      </form>
    </section></>}
    <button
      ref={launcherRef}
      className="fixed right-4 bottom-4 z-50 inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-cyan-200/30 bg-[#071226] px-4 text-sm font-extrabold text-white shadow-[0_12px_30px_rgba(7,18,38,.24)] hover:bg-[#10213a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00539d] sm:right-6 sm:bottom-6"
      type="button"
      aria-label={open ? "Close CPA Tools assistant" : "Open CPA Tools assistant"}
      aria-expanded={open}
      aria-controls="workspace-assistant-panel"
      tabIndex={open ? -1 : 0}
      onClick={() => open ? close() : setOpen(true)}
    >
      {open ? <X size={18}/> : <MessageCircle size={18}/>}<span className="max-[420px]:sr-only">Ask CPA Tools</span>
    </button>
  </>;
}
