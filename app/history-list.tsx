"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Trash2 } from "lucide-react";
import { SEVERITY_LABEL, SEVERITY_ORDER } from "@/lib/audit-findings";
import { clearAuditHistory, readAuditHistory, type AuditHistoryEntry } from "@/lib/audit-history";

const timeFormat = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export function HistoryList() {
  const [entries, setEntries] = useState<AuditHistoryEntry[] | null>(null);

  // Session storage is only readable after mount, so the server renders nothing here.
  useEffect(() => setEntries(readAuditHistory()), []);

  if (entries === null) return null;

  if (entries.length === 0) {
    return (
      <div className="empty-reminders">
        <p>No audits have run in this tab yet.</p>
        <p><a className="source-link" href="/">Run the first one</a></p>
      </div>
    );
  }

  function clear() {
    clearAuditHistory();
    setEntries([]);
  }

  return (
    <>
      <div className="history-head">
        <p className="audit-note">{entries.length} run{entries.length === 1 ? "" : "s"} recorded in this tab.</p>
        <button className="secondary-action" onClick={clear}><Trash2 size={15} /> Clear history</button>
      </div>
      <ul className="history-list">
        {entries.map((entry) => (
          <li key={entry.id}>
            <div className="history-main">
              <strong>{entry.title || new URL(entry.url).hostname}</strong>
              <a href={entry.url} target="_blank" rel="noreferrer">{entry.url} <ExternalLink size={12} /></a>
              <small>
                {timeFormat.format(new Date(entry.ranAt))}
                {" · "}{entry.linksChecked} of {entry.linksDiscovered} links checked
                {" · "}{entry.contextual ? "with contextual analysis" : "deterministic checks only"}
              </small>
            </div>
            <div className="history-severity">
              {SEVERITY_ORDER.filter((severity) => entry.severityCounts[severity] > 0).map((severity) => (
                <b key={severity} className={severity}>
                  {entry.severityCounts[severity]} {SEVERITY_LABEL[severity]}
                </b>
              ))}
              {entry.findingsTotal === 0 && <b className="none">No findings</b>}
            </div>
            <div className="history-metrics">
              <span><small>SEO</small>{entry.seoScore}</span>
              <span><small>AI</small>{entry.aiScore}</span>
              <span className={entry.brokenLinks ? "broken" : ""}><small>Broken</small>{entry.brokenLinks}</span>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
