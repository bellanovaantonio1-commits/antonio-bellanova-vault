import React from "react";
import { Download, FileText, PenLine } from "lucide-react";
import type { ConsultationMessageRow } from "../chat/types";

export type ConsultationContractCardProps = {
  message: ConsultationMessageRow;
  mode: "client" | "admin";
  isMine: boolean;
  loading?: boolean;
  onSign?: () => void;
  labels?: Partial<{
    contractBadge: string;
    download: string;
    sign: string;
    signed: string;
    awaitingSign: string;
    agreedTotal: string;
  }>;
};

function absoluteFileUrl(url: string): string {
  if (url.startsWith("/uploads/private-clients/")) {
    const secure = `/api/consultation/secure-file?url=${encodeURIComponent(url)}`;
    if (typeof window !== "undefined") return `${window.location.origin}${secure}`;
    return secure;
  }
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (typeof window !== "undefined" && url.startsWith("/")) return `${window.location.origin}${url}`;
  return url;
}

/**
 * Highlighted in-chat contract message (luxury dark + gold accents).
 */
export function ConsultationContractCard({
  message,
  mode,
  isMine,
  loading,
  onSign,
  labels = {},
}: ConsultationContractCardProps) {
  const l = {
    contractBadge: "Contract",
    download: "Download contract",
    sign: "Sign contract",
    signed: "Signed",
    awaitingSign: "Awaiting your signature",
    agreedTotal: "Agreed total",
    ...labels,
  };
  const title = message.contract_title || "Contract";
  const desc = message.contract_description || message.body || "";
  const fileUrl = message.contract_file_url || "";
  const amountEur =
    message.contract_amount_eur != null && Number(message.contract_amount_eur) > 0
      ? Number(message.contract_amount_eur)
      : null;
  const status = String(message.contract_status || "sent");

  return (
    <div
      className={`max-w-[92%] rounded-2xl border-2 px-4 py-3 shadow-lg ${
        isMine
          ? "border-amber-500/50 bg-gradient-to-br from-amber-950/50 to-zinc-900/90 ml-auto"
          : "border-amber-600/40 bg-gradient-to-br from-zinc-900 to-zinc-950 mr-auto"
      }`}
    >
      <div className="flex items-center gap-2 text-amber-500/95 mb-2">
        <FileText className="w-4 h-4 shrink-0" />
        <span className="text-[10px] uppercase tracking-[0.2em] font-semibold">{l.contractBadge}</span>
      </div>
      <p className="text-sm font-semibold text-amber-100/95">{title}</p>
      {amountEur != null ? (
        <p className="text-xs font-semibold text-amber-400/95 mt-2">
          {l.agreedTotal}: {amountEur.toLocaleString("de-DE")} €
        </p>
      ) : null}
      {desc ? <p className="text-xs text-zinc-300/95 mt-2 whitespace-pre-wrap break-words leading-relaxed">{desc}</p> : null}
      {message.created_at && (
        <p className="text-[10px] text-zinc-500 mt-2">{new Date(message.created_at).toLocaleString()}</p>
      )}
      <div className="mt-3 flex flex-col gap-2">
        {fileUrl ? (
          <a
            href={absoluteFileUrl(fileUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 min-h-[40px] rounded-full text-xs font-medium border border-amber-600/50 text-amber-400 hover:bg-amber-600/10"
          >
            <Download className="w-3.5 h-3.5" />
            {l.download}
          </a>
        ) : null}
        {mode === "client" && status === "sent" && onSign ? (
          <button
            type="button"
            disabled={loading}
            onClick={onSign}
            className="inline-flex items-center justify-center gap-2 min-h-[40px] rounded-full text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-zinc-950 disabled:opacity-50"
          >
            <PenLine className="w-3.5 h-3.5" />
            {l.sign}
          </button>
        ) : null}
        {mode === "client" && status === "accepted" ? (
          <p className="text-center text-[11px] text-emerald-400/95 font-medium py-1">{l.signed}</p>
        ) : null}
        {mode === "client" && status === "sent" && !onSign ? (
          <p className="text-center text-[10px] text-zinc-500">{l.awaitingSign}</p>
        ) : null}
        {mode === "admin" ? (
          <p className="text-[10px] text-zinc-500 text-center">
            {status === "accepted" ? l.signed : "Sent — awaiting client"}
          </p>
        ) : null}
      </div>
    </div>
  );
}
