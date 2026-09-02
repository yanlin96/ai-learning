"use client";

import { Bell, Check, Clock3, Pencil, Plus, Search, Trash2, TriangleAlert, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { LineSubscription } from "@/lib/subscriptions";
import type { TrainLine } from "@/lib/train-lines";

type Props = { initialSubscriptions: LineSubscription[]; lines: TrainLine[] };

export function ReminderManager({ initialSubscriptions, lines }: Props) {
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);
  const [query, setQuery] = useState("");
  const [lineId, setLineId] = useState("werribee");
  const [time, setTime] = useState("06:00");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<LineSubscription | null>(null);

  const availableLines = useMemo(() => {
    const used = new Set(subscriptions.filter((item) => item.id !== editingId).map((item) => item.lineId));
    return lines.filter((line) => !used.has(line.id) && line.name.toLowerCase().includes(query.toLowerCase()));
  }, [editingId, lines, query, subscriptions]);

  const lineById = (id: string) => lines.find((line) => line.id === id)!;

  function startEdit(item: LineSubscription) {
    setEditingId(item.id);
    setLineId(item.lineId);
    setTime(item.reminderTime);
    setQuery("");
    setError("");
    document.querySelector("#reminder-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function cancelEdit() {
    setEditingId(null);
    setLineId(availableLines[0]?.id ?? "werribee");
    setTime("06:00");
    setError("");
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy("save");
    setError("");
    const url = editingId ? `/api/subscriptions/${editingId}` : "/api/subscriptions";
    try {
      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineId, reminderTime: time, enabled: true }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save reminder");
      const saved = result.subscription as LineSubscription;
      setSubscriptions((items) => editingId
        ? items.map((item) => item.id === editingId ? saved : item)
        : [...items, saved]);
      setEditingId(null);
      setQuery("");
      setTime("06:00");
      const next = lines.find((line) => !subscriptions.some((item) => item.lineId === line.id) && line.id !== saved.lineId);
      if (next) setLineId(next.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save reminder");
    } finally {
      setBusy(null);
    }
  }

  async function toggle(item: LineSubscription) {
    setBusy(item.id);
    setError("");
    try {
      const response = await fetch(`/api/subscriptions/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineId: item.lineId, reminderTime: item.reminderTime, enabled: !item.enabled }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update reminder");
      setSubscriptions((items) => items.map((current) => current.id === item.id ? result.subscription : current));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update reminder");
    } finally {
      setBusy(null);
    }
  }

  async function remove(item: LineSubscription) {
    setBusy(item.id);
    setError("");
    try {
      const response = await fetch(`/api/subscriptions/${item.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not delete reminder");
      setSubscriptions((items) => items.filter((current) => current.id !== item.id));
      if (editingId === item.id) cancelEdit();
      setDeleteTarget(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete reminder");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="reminder-section shell" id="reminders">
      <div className="section-heading">
        <div>
          <p className="eyebrow">YOUR LINES</p>
          <h2>Commute reminders.</h2>
          <p>Choose any Melbourne train line and one daily check-in time.</p>
        </div>
        <span className="count-badge">{subscriptions.length} active setup{subscriptions.length === 1 ? "" : "s"}</span>
      </div>

      <div className="reminder-layout">
        <div className="reminder-list">
          {subscriptions.length === 0 && (
            <div className="empty-reminders"><Bell size={24} /><p>No reminders yet. Add your first line.</p></div>
          )}
          {subscriptions.map((item) => {
            const line = lineById(item.lineId);
            return (
              <article className={`reminder-row ${item.enabled ? "" : "disabled"}`} key={item.id}>
                <span className="line-swatch" style={{ background: line.color }} />
                <div className="reminder-name"><strong>{line.name}</strong><small>{item.enabled ? "Notifications on" : "Paused"}</small></div>
                <div className="reminder-time"><Clock3 size={16} /><strong>{item.reminderTime}</strong><small>Melbourne</small></div>
                <button className={`toggle ${item.enabled ? "on" : ""}`} onClick={() => toggle(item)} disabled={busy === item.id} aria-label={`${item.enabled ? "Pause" : "Enable"} ${line.name}`}><i /></button>
                <button className="icon-button" onClick={() => startEdit(item)} aria-label={`Edit ${line.name}`}><Pencil size={16} /></button>
                <button className="icon-button danger" onClick={() => setDeleteTarget(item)} disabled={busy === item.id} aria-label={`Delete ${line.name}`}><Trash2 size={16} /></button>
              </article>
            );
          })}
        </div>

        <form className="reminder-form" id="reminder-form" onSubmit={save}>
          <div className="form-title">
            <span><Plus size={18} /></span>
            <div><p className="label">{editingId ? "EDIT REMINDER" : "NEW REMINDER"}</p><h3>{editingId ? "Update your check-in" : "Watch another line"}</h3></div>
          </div>
          <label>Find a train line</label>
          <div className="search-field"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Melbourne lines" /></div>
          <label>Line</label>
          <select value={lineId} onChange={(event) => setLineId(event.target.value)} required>
            {availableLines.map((line) => <option value={line.id} key={line.id}>{line.name}</option>)}
          </select>
          <label>Reminder time</label>
          <input type="time" value={time} onChange={(event) => setTime(event.target.value)} required />
          {error && <p className="form-error">{error}</p>}
          <div className="form-actions">
            <button className="primary-action" disabled={busy === "save" || availableLines.length === 0}><Check size={16} />{busy === "save" ? "Saving…" : editingId ? "Save changes" : "Add reminder"}</button>
            {editingId && <button className="secondary-action" type="button" onClick={cancelEdit}><X size={16} />Cancel</button>}
          </div>
        </form>
      </div>

      {deleteTarget && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && busy !== deleteTarget.id) setDeleteTarget(null);
        }}>
          <div className="delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description">
            <button className="dialog-close" type="button" onClick={() => setDeleteTarget(null)} aria-label="Close dialog"><X size={18} /></button>
            <span className="dialog-warning"><TriangleAlert size={23} /></span>
            <p className="label">DELETE REMINDER</p>
            <h3 id="delete-title">Stop watching {lineById(deleteTarget.lineId).name}?</h3>
            <p id="delete-description">Its {deleteTarget.reminderTime} check-in will be removed. You can add the line again at any time.</p>
            <div className="dialog-actions">
              <button className="secondary-action" type="button" onClick={() => setDeleteTarget(null)} disabled={busy === deleteTarget.id}>Keep reminder</button>
              <button className="delete-action" type="button" onClick={() => remove(deleteTarget)} disabled={busy === deleteTarget.id}><Trash2 size={16} />{busy === deleteTarget.id ? "Deleting…" : "Delete reminder"}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
