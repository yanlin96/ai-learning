"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { signIn } from "next-auth/react";
export function WorkspaceSignInButton({ callbackUrl, autoStart = false }: { callbackUrl: string; autoStart?: boolean }) {
  const [busy, setBusy] = useState(autoStart);
  const [error, setError] = useState(false);
  const started = useRef(false);
  const start = useCallback(async () => {
    setBusy(true);
    setError(false);
    try { await signIn("okta", { callbackUrl }); }
    catch { setError(true); setBusy(false); }
  }, [callbackUrl]);
  useEffect(() => {
    if (autoStart && !started.current) {
      started.current = true;
      void start();
    }
  }, [autoStart, start]);
  return <div className="mt-5">
    {busy && <p role="status" className="text-sm leading-6 text-slate-600">Opening secure sign-in…</p>}
    <button type="button" disabled={busy} onClick={() => void start()} className="flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 rounded-xl border-0 bg-[#00539d] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#084697] disabled:opacity-60">{busy ? "Connecting to Okta…" : "Continue with Okta"}<ArrowRight size={18}/></button>
    {error && <p role="alert" className="mt-4 text-sm text-red-800">Could not start sign-in. Please try again.</p>}
  </div>;
}
