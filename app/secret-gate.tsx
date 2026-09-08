"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";

const PASSCODE = "910906";
const UNLOCK_KEY = "reminders-unlocked";

/**
 * Hides the reminder tools behind a passcode. Client-side only, so it keeps the
 * feature out of sight rather than actually securing it — the API routes are still open.
 */
export function SecretGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [ready, setReady] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      setUnlocked(sessionStorage.getItem(UNLOCK_KEY) === "1");
    } catch {}
    setReady(true);
  }, []);

  // Render nothing until we know, so the tools never flash on screen.
  if (!ready) return null;
  if (unlocked) return <>{children}</>;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (value !== PASSCODE) {
      setError(true);
      setValue("");
      return;
    }
    try {
      sessionStorage.setItem(UNLOCK_KEY, "1");
    } catch {}
    setUnlocked(true);
  }

  return (
    <section className="gate shell">
      <span className="gate-icon"><Lock size={22} /></span>
      <h2>Restricted</h2>
      <p>This area is not part of the public site. Enter the passcode to continue.</p>
      <form onSubmit={submit}>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={value}
          onChange={(event) => { setValue(event.target.value); setError(false); }}
          placeholder="Passcode"
          aria-label="Passcode"
        />
        <button type="submit">Unlock</button>
      </form>
      {error ? <p className="gate-error">Incorrect passcode.</p> : null}
    </section>
  );
}
