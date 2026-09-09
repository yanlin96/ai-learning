"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Trash2 } from "lucide-react";
import {
  clearSmokeHistory,
  readSmokeHistory,
  removeSmokeDomain,
  type SmokeDomainHistory,
} from "@/lib/smoke-history";

const timeFormat = new Intl.DateTimeFormat("en-AU", {
  day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
});

export function SmokeHistoryList() {
  const [groups, setGroups] = useState<SmokeDomainHistory[] | null>(null);
  useEffect(() => setGroups(readSmokeHistory()), []);

  if (groups === null) return null;
  if (groups.length === 0) {
    return <div className="empty-reminders"><p>No smoke tests have been saved in this browser.</p><p><a className="source-link" href="/smoke-test">Run the first smoke test</a></p></div>;
  }

  function clearAll() {
    clearSmokeHistory();
    setGroups([]);
  }

  return (
    <>
      <div className="history-head">
        <p className="audit-note">{groups.length} of 10 domains saved locally in this browser.</p>
        <button className="secondary-action" onClick={clearAll}><Trash2 size={15} /> Clear all</button>
      </div>
      <div className="smoke-domain-history">
        {groups.map((group) => (
          <article key={group.domain} className="smoke-domain-card">
            <header>
              <div><p className="label">DOMAIN</p><h2>{group.domain}</h2><small>{group.runs.length} recent run{group.runs.length === 1 ? "" : "s"}</small></div>
              <div className="domain-actions">
                <a href={`https://${group.domain}`} target="_blank" rel="noreferrer">Open site <ExternalLink size={13} /></a>
                <button aria-label={`Delete history for ${group.domain}`} onClick={() => setGroups(removeSmokeDomain(group.domain))}><Trash2 size={15} /></button>
              </div>
            </header>
            <div className="domain-runs">
              {group.runs.map((run) => (
                <div className="domain-run" key={run.id}>
                  <b className={run.result}>{run.result === "warning" ? "Pass with warnings" : run.result}</b>
                  <span><strong>{timeFormat.format(new Date(run.checkedAt))}</strong><small>{run.checked} checked · {run.browserChecked} browser verified{run.skipped ? ` · ${run.skipped} skipped` : ""}</small></span>
                  <span className="domain-run-counts"><i className="pass">{run.counts.pass} pass</i><i className="warning">{run.counts.warning} warn</i><i className="fail">{run.counts.fail} fail</i></span>
                  <span className="domain-run-issues">
                    {run.issueSamples.length
                      ? run.issueSamples.slice(0, 3).map((issue) => <small key={issue.url}><a href={issue.url} target="_blank" rel="noreferrer">{new URL(issue.url).pathname || "/"}</a>: {issue.issues[0] || issue.status}</small>)
                      : <small>No issues recorded.</small>}
                  </span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
