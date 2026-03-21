import React, { useCallback, useEffect, useState } from "react";
import { X, Send } from "lucide-react";
import type { ConsultationMessageRow } from "../chat/types";
import type { ConsultationProposalRow } from "../proposals/types";

type Notify = (message: string, kind?: "success" | "error" | "warning") => void;

export type ConsultationChatPanelProps = {
  conversationId: number;
  mode: "client" | "admin";
  title?: string;
  currentUserId: number;
  onClose: () => void;
  notify: Notify;
};

async function readJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: text || res.statusText };
  }
}

export function ConsultationChatPanel({
  conversationId,
  mode,
  title,
  currentUserId,
  onClose,
  notify,
}: ConsultationChatPanelProps) {
  const [messages, setMessages] = useState<ConsultationMessageRow[]>([]);
  const [proposals, setProposals] = useState<ConsultationProposalRow[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalDesc, setProposalDesc] = useState("");
  const [proposalAmount, setProposalAmount] = useState("");

  const load = useCallback(async () => {
    try {
      const [mRes, pRes] = await Promise.all([
        fetch(`/api/consultation/conversations/${conversationId}/messages`, { credentials: "include" }),
        fetch(`/api/consultation/conversations/${conversationId}/proposals`, { credentials: "include" }),
      ]);
      if (mRes.ok) setMessages(await mRes.json());
      if (pRes.ok) setProposals(await pRes.json());
    } catch {
      /* ignore */
    }
  }, [conversationId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 12000);
    return () => clearInterval(t);
  }, [load]);

  const send = async () => {
    const body = draft.trim();
    if (!body) return;
    setLoading(true);
    try {
      const url =
        mode === "admin"
          ? `/api/admin/consultation/conversations/${conversationId}/messages`
          : `/api/consultation/conversations/${conversationId}/messages`;
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await readJson(res);
      if (!res.ok) {
        notify(data.error || "Send failed", "error");
        return;
      }
      setDraft("");
      setMessages((prev) => [...prev, data]);
    } finally {
      setLoading(false);
    }
  };

  const sendProposal = async () => {
    if (!proposalTitle.trim()) {
      notify("Title required", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/consultation/proposals", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversationId,
          title: proposalTitle.trim(),
          description: proposalDesc.trim() || null,
          amount_eur: proposalAmount ? Number(proposalAmount) : null,
        }),
      });
      const data = await readJson(res);
      if (!res.ok) {
        notify(data.error || "Proposal failed", "error");
        return;
      }
      setProposalTitle("");
      setProposalDesc("");
      setProposalAmount("");
      notify("Proposal sent", "success");
      load();
    } finally {
      setLoading(false);
    }
  };

  const acceptProposal = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/consultation/proposals/${id}/accept`, {
        method: "POST",
        credentials: "include",
      });
      const data = await readJson(res);
      if (!res.ok) {
        notify(data.error || "Accept failed", "error");
        return;
      }
      notify("Proposal accepted", "success");
      load();
    } finally {
      setLoading(false);
    }
  };

  const requestDepositInfo = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/consultation/proposals/${id}/request-deposit`, {
        method: "POST",
        credentials: "include",
      });
      const data = await readJson(res);
      if (!res.ok) {
        notify(data.error || "Request failed", "error");
        return;
      }
      notify(
        data.message ||
          "Deposit hook: use existing platform payment flow when integrating.",
        "success"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/95">
          <div>
            <p className="text-xs uppercase tracking-widest text-amber-600/90">Concierge</p>
            <p className="text-sm font-medium text-zinc-100 truncate max-w-[240px]">
              {title || `Conversation #${conversationId}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {messages.length === 0 && (
            <p className="text-xs text-zinc-500 text-center py-6 italic">No messages yet.</p>
          )}
          {messages.map((m) => {
            const mine = Number(m.sender_id) === Number(currentUserId);
            return (
              <div
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    mine
                      ? "bg-amber-600/20 text-amber-50 border border-amber-600/30"
                      : "bg-zinc-800 text-zinc-200 border border-zinc-700"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  {m.created_at && (
                    <p className="text-[10px] text-zinc-500 mt-1">
                      {new Date(m.created_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {proposals.length > 0 && (
          <div className="border-t border-zinc-800 px-3 py-2 max-h-40 overflow-y-auto space-y-2 bg-zinc-950/50">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">Proposals</p>
            {proposals.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-zinc-700/80 p-2 text-xs text-zinc-300"
              >
                <p className="font-medium text-zinc-100">{p.title}</p>
                {p.description && <p className="mt-1 text-zinc-400">{p.description}</p>}
                {p.amount_eur != null && (
                  <p className="mt-1 text-amber-500/90">
                    {Number(p.amount_eur).toLocaleString()} {p.currency || "EUR"}
                  </p>
                )}
                <p className="text-[10px] text-zinc-500 mt-1">Status: {p.status}</p>
                {mode === "client" && p.status === "sent" && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => acceptProposal(p.id)}
                    className="mt-2 w-full min-h-[40px] rounded-full text-xs font-medium bg-amber-600/20 text-amber-400 border border-amber-600/40 hover:bg-amber-600/30 disabled:opacity-50"
                  >
                    Accept proposal
                  </button>
                )}
                {mode === "client" && p.status === "accepted" && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => requestDepositInfo(p.id)}
                    className="mt-2 w-full min-h-[40px] rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-600 hover:bg-zinc-700 disabled:opacity-50"
                  >
                    Deposit next step (info)
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {mode === "admin" && (
          <div className="border-t border-zinc-800 px-3 py-2 space-y-2 bg-zinc-950/40">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">New proposal</p>
            <input
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-200"
              placeholder="Title"
              value={proposalTitle}
              onChange={(e) => setProposalTitle(e.target.value)}
            />
            <textarea
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-200 min-h-[48px]"
              placeholder="Description (optional)"
              value={proposalDesc}
              onChange={(e) => setProposalDesc(e.target.value)}
            />
            <input
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-200"
              placeholder="Amount EUR (optional)"
              value={proposalAmount}
              onChange={(e) => setProposalAmount(e.target.value)}
            />
            <button
              type="button"
              disabled={loading}
              onClick={sendProposal}
              className="w-full min-h-[40px] rounded-full text-xs font-medium bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50"
            >
              Send proposal to client
            </button>
          </div>
        )}

        <div className="flex gap-2 p-3 border-t border-zinc-800 bg-zinc-900/95">
          <input
            className="flex-1 bg-zinc-950 border border-zinc-700 rounded-full px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-600/50"
            placeholder="Message…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button
            type="button"
            disabled={loading || !draft.trim()}
            onClick={send}
            className="min-h-[44px] min-w-[44px] rounded-full bg-amber-600 text-white flex items-center justify-center disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
