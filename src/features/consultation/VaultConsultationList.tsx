import React, { useCallback, useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import type { ConsultationConversationRow } from "../chat/types";

type Props = {
  onOpenThread: (id: number, title: string) => void;
  refreshKey?: number;
  labels: {
    title: string;
    empty: string;
    updated: string;
    piece: string;
  };
};

export function VaultConsultationList({ onOpenThread, refreshKey = 0, labels }: Props) {
  const [rows, setRows] = useState<ConsultationConversationRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await fetch("/api/consultation/conversations", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((data as { error?: string }).error || "Failed to load");
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
    return <p className="text-sm text-red-400/90">{err}</p>;
  }

  if (rows.length === 0) {
    return <p className="text-sm text-zinc-500 italic">{labels.empty}</p>;
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm uppercase tracking-widest text-zinc-500 font-bold">{labels.title}</h4>
      <ul className="space-y-2">
        {rows.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() =>
                onOpenThread(
                  c.id,
                  c.masterpiece_title || c.subject || `${labels.piece} #${c.id}`
                )
              }
              className="w-full text-left rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 hover:border-amber-600/35 transition-colors flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate">
                  {c.masterpiece_title || c.subject || `Thread #${c.id}`}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {labels.updated}{" "}
                  {c.updated_at ? new Date(c.updated_at).toLocaleString() : "—"} · {c.status}
                </p>
              </div>
              <MessageCircle className="w-5 h-5 text-amber-600/80 shrink-0" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
