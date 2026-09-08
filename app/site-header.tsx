"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, TrainFront, X } from "lucide-react";
import { PASSCODE, UNLOCK_KEY } from "@/app/secret-gate";

export function SiteHeader() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

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
    try {
      sessionStorage.setItem(UNLOCK_KEY, "1");
    } catch {}
    close();
    router.push("/reminders");
  }

  return (
    <header className="site-header">
      <nav className="nav shell">
        <a className="brand" href="/" aria-label="Line Watch Melbourne home">
          <span className="brand-mark"><TrainFront size={19} strokeWidth={2.4} /></span>
          <span>Line Watch Melbourne</span>
        </a>
        <div className="nav-actions">
          <a href="/">Website audit</a>
          <div className="menu-wrap">
            <button
              className="menu-button"
              onClick={() => (open ? close() : setOpen(true))}
              aria-label="Menu"
              aria-expanded={open}
            >
              {open ? <X size={19} /> : <Menu size={19} />}
            </button>
            {open ? (
              <>
                <div className="menu-backdrop" onClick={close} />
                <div className="menu-panel" onKeyDown={(event) => event.key === "Escape" && close()}>
                  <p className="label">Staff access</p>
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
                    <button type="submit">Go</button>
                  </form>
                  {error ? <p className="menu-error">Incorrect passcode.</p> : null}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </nav>
    </header>
  );
}
