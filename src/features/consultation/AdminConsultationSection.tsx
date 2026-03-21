import React, { useCallback, useEffect, useState } from "react";
import type { ConsultationConversationRow } from "../chat/types";

type Props = {
  onOpenConversation: (id: number, title: string) => void;
  /** Bumps when server broadcasts CONSULTATION_* over WebSocket. */
  refreshKey?: number;
};

export function AdminConsultationSection({ onOpenConversation, refreshKey = 0 }: Props) {
  const [rows, setRows] = useState<ConsultationConversationRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await fetch("/api/admin/consultation/conversations", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || "Could not load consultations");
        setRows([]);
        return;
      }
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setErr(e?.message || "Network error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (refreshKey > 0) load();
  }, [refreshKey, load]);

  if (err && rows.length === 0) {
    return (
      <section className="space-y-2">
        <h3 className="text-xl font-serif italic text-zinc-200">Consultation inbox</h3>
        <p className="text-sm text-zinc-500">{err}</p>
      </section>
    );
  }

  if (rows.length === 0) {
    return (
      <section className="space-y-2">
        <h3 className="text-xl font-serif italic text-zinc-200">Consultation inbox</h3>
        <p className="text-sm text-zinc-600 italic">No consultation threads yet.</p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h3 className="text-xl font-serif italic text-zinc-200">Consultation inbox</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {rows.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() =>
              onOpenConversation(
                c.id,
                c.masterpiece_title || c.subject || `Thread #${c.id}`
              )
            }
            className="w-full text-left rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2 hover:border-amber-600/40 transition-colors"
          >
            <p className="text-sm text-zinc-200">
              {c.client_name || "Client"} · {c.masterpiece_title || c.subject || "General"}
            </p>
            <p className="text-[10px] text-zinc-500">
              #{c.id} · {c.status} · {c.updated_at ? new Date(c.updated_at).toLocaleString() : "—"}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
