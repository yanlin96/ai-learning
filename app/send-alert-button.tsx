"use client";

import { Check, Send, TriangleAlert } from "lucide-react";
import { useState } from "react";

type State = "idle" | "sending" | "sent" | "error";

export function SendAlertButton() {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  async function send() {
    setState("sending");
    setMessage("");

    try {
      const response = await fetch("/api/telegram/send-current", { method: "POST" });
      const result = (await response.json()) as { ok: boolean; count?: number; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "Message could not be sent.");

      setState("sent");
      setMessage(`${result.count ?? 1} commute update${result.count === 1 ? "" : "s"} sent to Telegram.`);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Message could not be sent.");
    }
  }

  return (
    <div className="manual-send">
      <button className={`send-button ${state}`} type="button" onClick={send} disabled={state === "sending"}>
        {state === "sent" ? <Check size={17} /> : state === "error" ? <TriangleAlert size={17} /> : <Send size={17} />}
        {state === "sending" ? "Sending…" : state === "sent" ? "Sent" : "Send to Telegram"}
      </button>
      {message && <span className={`send-feedback ${state}`} role="status">{message}</span>}
    </div>
  );
}
