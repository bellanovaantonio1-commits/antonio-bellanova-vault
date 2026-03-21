import React, { useCallback, useEffect, useState } from "react";
import type { ConsultationConversationRow } from "../chat/types";

export type AdminConsultationStrings = Partial<{
  title: string;
  filterAll: string;
  filterOpen: string;
  filterClosed: string;
  emptyAll: string;
  emptyOpen: string;
  emptyClosed: string;
  loadError: string;
  reopenShort: string;
  reopenedOk: string;
  reopenFail: string;
  statusOpen: string;
  statusClosed: string;
}>;

type Filter = "all" | "open" | "closed";

type Props = {
  onOpenConversation: (id: number, title: string) => void;
  /** Bumps when server broadcasts CONSULTATION_* over WebSocket. */
  refreshKey?: number;
  strings?: AdminConsultationStrings;
  /** Called after successful reopen-from-list (e.g. toast). */
  onReopened?: () => void;
  /** Optional toasts; falls back to window.alert on errors if omitted. */
  notify?: (message: string, kind?: "success" | "error") => void;
};

const defaultStrings: Required<AdminConsultationStrings> = {
  title: "Consultation inbox",
  filterAll: "All",
  filterOpen: "Open",
  filterClosed: "Closed",
  emptyAll: "No consultation threads yet.",
  emptyOpen: "No open threads.",
  emptyClosed: "No closed threads.",
  loadError: "Could not load consultations",
  reopenShort: "Reopen",
  reopenedOk: "Thread reopened.",
  reopenFail: "Could not reopen thread.",
  statusOpen: "open",
  statusClosed: "closed",
};

export function AdminConsultationSection({ onOpenConversation, refreshKey = 0, strings: sProp, onReopened, notify }: Props) {
  const str = { ...defaultStrings, ...sProp };
  const [rows, setRows] = useState<ConsultationConversationRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [reopeningId, setReopeningId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const q = filter === "all" ? "" : `?status=${encodeURIComponent(filter)}`;
      const res = await fetch(`/api/admin/consultation/conversations${q}`, { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || str.loadError);
        setRows([]);
        return;
      }
      setRows(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setErr((e as Error)?.message || "Network error");
    }
  }, [filter, str.loadError]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (refreshKey > 0) load();
  }, [refreshKey, load]);

  const reopenFromList = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    setReopeningId(id);
    try {
      const res = await fetch(`/api/admin/consultation/conversations/${id}/reopen`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.error || str.reopenFail;
        notify ? notify(msg, "error") : window.alert(msg);
        return;
      }
      onReopened?.();
      await load();
    } catch {
      notify ? notify(str.reopenFail, "error") : window.alert(str.reopenFail);
    } finally {
      setReopeningId(null);
    }
  };

  const emptyMsg =
    filter === "open" ? str.emptyOpen : filter === "closed" ? str.emptyClosed : str.emptyAll;

  const statusLabel = (status: string) =>
    String(status).toLowerCase() === "closed" ? str.statusClosed : str.statusOpen;

  if (err && rows.length === 0) {
    return (
      <section className="space-y-2">
        <h3 className="text-xl font-serif italic text-zinc-200">{str.title}</h3>
        <p className="text-sm text-zinc-500">{err}</p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-xl font-serif italic text-zinc-200">{str.title}</h3>
        <div className="flex flex-wrap gap-1 rounded-lg border border-zinc-800 bg-zinc-950/50 p-0.5">
          {(
            [
              ["all", str.filterAll],
              ["open", str.filterOpen],
              ["closed", str.filterClosed],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                filter === key
                  ? "bg-amber-600/25 text-amber-100 border border-amber-600/40"
                  : "text-zinc-500 hover:text-zinc-300 border border-transparent"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-zinc-600 italic">{emptyMsg}</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {rows.map((c) => (
            <div
              key={c.id}
              className="flex gap-2 items-stretch rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden hover:border-amber-600/40 transition-colors"
            >
              <button
                type="button"
                onClick={() =>
                  onOpenConversation(c.id, c.masterpiece_title || c.subject || `Thread #${c.id}`)
                }
                className="flex-1 min-w-0 text-left px-3 py-2"
              >
                <p className="text-sm text-zinc-200 truncate">
                  {c.client_name || "Client"} · {c.masterpiece_title || c.subject || "General"}
                </p>
                <p className="text-[10px] text-zinc-500">
                  #{c.id} · {statusLabel(String(c.status))} ·{" "}
                  {c.updated_at ? new Date(c.updated_at).toLocaleString() : "—"}
                </p>
              </button>
              {String(c.status).toLowerCase() === "closed" && (
                <button
                  type="button"
                  disabled={reopeningId === c.id}
                  onClick={(e) => void reopenFromList(e, c.id)}
                  className="shrink-0 px-2.5 py-2 text-[11px] font-medium uppercase tracking-wide text-amber-200/90 bg-zinc-950/80 border-l border-zinc-800 hover:bg-amber-950/30 disabled:opacity-50"
                >
                  {reopeningId === c.id ? "…" : str.reopenShort}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
