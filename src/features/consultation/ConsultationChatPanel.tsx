import React, { useCallback, useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { X, Send, FileDown } from "lucide-react";
import type { ConsultationMessageRow } from "../chat/types";
import type { ConsultationProposalRow } from "../proposals/types";
import { ConsultationContractCard } from "../contracts/ConsultationContractCard";
import { ConsultationStripeDepositForm } from "../contracts/ConsultationStripeDepositForm";

type Notify = (message: string, kind?: "success" | "error" | "warning") => void;

export type ConsultationChatPanelProps = {
  conversationId: number;
  mode: "client" | "admin";
  title?: string;
  currentUserId: number;
  onClose: () => void;
  notify: Notify;
  /** Incremented on WebSocket CONSULTATION_* events to reload thread without waiting for poll. */
  refreshKey?: number;
  /** Same delivery_option values as piece detail / marketplace buy. */
  deliveryOptions?: { value: string; label: string }[];
  /** After successful marketplace buy from this panel (refresh parent data). */
  onAfterPurchaseSuccess?: () => void;
  /** Optional UI strings (defaults English). */
  strings?: Partial<{
    proposalsHeading: string;
    acceptProposal: string;
    declineProposal: string;
    depositInfo: string;
    noMessages: string;
    proposalDeclinedToast: string;
    closeThread: string;
    confirmCloseThread: string;
    conversationClosedBanner: string;
    threadClosedSuccess: string;
    reopenThread: string;
    confirmReopenThread: string;
    threadReopenedSuccess: string;
    unlockPurchaseButton: string;
    unlockFinalValuationPlaceholder: string;
    unlockPurchaseSuccess: string;
    waitingForUnlockHint: string;
    depositAndContractButton: string;
    deliverySelectLabel: string;
    purchaseSuccess: string;
    sendProposalButton: string;
    /** Shown to clients for piece-linked threads: no contract from chat alone + what to specify */
    clientBriefingTitle: string;
    clientBriefingLegal: string;
    clientBriefingChecklist: string;
    proceedDepositTitle: string;
    payDepositButton: string;
    sendContractHeading: string;
    contractTitlePlaceholder: string;
    contractPdfUrlPlaceholder: string;
    sendContractButton: string;
    contractSentToast: string;
    contractSignedToast: string;
    depositPaidToast: string;
    contractAgreedTotalLabel: string;
    contractFromProposalHint: string;
    sendFileHeading: string;
    fileLabelPlaceholder: string;
    fileUrlPlaceholder: string;
    sendFileButton: string;
    fileSentToast: string;
    workflowPhaseLabel: string;
  }>;
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
  refreshKey = 0,
  deliveryOptions = [],
  onAfterPurchaseSuccess,
  strings: stringsProp,
}: ConsultationChatPanelProps) {
  const str = {
    proposalsHeading: "Proposals",
    acceptProposal: "Accept proposal",
    declineProposal: "Decline",
    depositInfo: "Deposit next step (info)",
    noMessages: "No messages yet.",
    proposalDeclinedToast: "Proposal declined",
    closeThread: "Close thread",
    confirmCloseThread: "Close this consultation thread? You can still read the history.",
    conversationClosedBanner: "This thread is closed — messaging is disabled.",
    threadClosedSuccess: "Thread closed.",
    reopenThread: "Reopen thread",
    confirmReopenThread: "Reopen this thread? You can send messages again.",
    threadReopenedSuccess: "Thread reopened.",
    unlockPurchaseButton: "Unlock deposit & contract for client",
    unlockFinalValuationPlaceholder: "Final price EUR (optional)",
    unlockPurchaseSuccess: "Client can now proceed with deposit.",
    waitingForUnlockHint:
      "The Atelier will unlock the deposit step here when your bespoke plan is ready.",
    depositAndContractButton: "Deposit & contract",
    deliverySelectLabel: "Delivery",
    purchaseSuccess: "Deposit contract started — check your Vault.",
    sendProposalButton: "Send proposal to client",
    clientBriefingTitle: "What to share with the Atelier",
    clientBriefingLegal:
      "The listed price refers to the reference configuration shown. Changes to materials or stones affect the offer. A binding purchase agreement is only formed after explicit confirmation and the agreed deposit step — not from this chat alone.",
    clientBriefingChecklist:
      "• Preferred metals (e.g. gold, platinum)\n• Gemstones and colours\n• Size or carat of the main stone\n• Ring size / lengths / other measurements\n• Any other wishes for the execution",
    proceedDepositTitle: "Deposit",
    payDepositButton: "Pay deposit",
    sendContractHeading: "Send contract (PDF)",
    contractTitlePlaceholder: "Contract title",
    contractPdfUrlPlaceholder: "PDF URL",
    sendContractButton: "Send contract to client",
    contractSentToast: "Contract sent",
    contractSignedToast: "Contract signed",
    depositPaidToast: "Deposit received",
    contractAgreedTotalLabel: "Vereinbarter Gesamtpreis",
    contractFromProposalHint:
      "Nach Kundenannahme eines Angebots werden Titel und Text hier mit Angebot und Preis vorbefüllt — bitte PDF-Link ergänzen und senden.",
    sendFileHeading: "Datei an Kundin senden (PDF)",
    fileLabelPlaceholder: "Bezeichnung (z. B. Anlage zum Vertrag)",
    fileUrlPlaceholder: "Datei-URL (https://… oder /pfad)",
    sendFileButton: "Datei senden",
    fileSentToast: "Datei gesendet",
    workflowPhaseLabel: "Status",
    ...stringsProp,
  };
  const [convStatus, setConvStatus] = useState<string>("open");
  const [messages, setMessages] = useState<ConsultationMessageRow[]>([]);
  const [proposals, setProposals] = useState<ConsultationProposalRow[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalDesc, setProposalDesc] = useState("");
  const [proposalAmount, setProposalAmount] = useState("");
  const [metaPieceId, setMetaPieceId] = useState<number | null>(null);
  const [metaPieceStatus, setMetaPieceStatus] = useState<string | null>(null);
  const [metaConsultationRequired, setMetaConsultationRequired] = useState(0);
  const [metaMadeToOrder, setMetaMadeToOrder] = useState(0);
  const [workflowPhase, setWorkflowPhase] = useState<string | null>(null);
  const [purchaseUnlockedAt, setPurchaseUnlockedAt] = useState<string | null>(null);
  const [depositPaidAt, setDepositPaidAt] = useState<string | null>(null);
  const [unlockValuationDraft, setUnlockValuationDraft] = useState("");
  const [deliveryOption, setDeliveryOption] = useState<string>(
    deliveryOptions[0]?.value ?? "insured_global_shipping"
  );
  const [stripePk, setStripePk] = useState<string | null>(null);
  const [depositClientSecret, setDepositClientSecret] = useState<string | null>(null);
  const [depositAmountCents, setDepositAmountCents] = useState<number | null>(null);
  const [contractTitle, setContractTitle] = useState("");
  const [contractDesc, setContractDesc] = useState("");
  const [contractFileUrl, setContractFileUrl] = useState("");
  const [fileAttachLabel, setFileAttachLabel] = useState("");
  const [fileAttachUrl, setFileAttachUrl] = useState("");

  useEffect(() => {
    if (deliveryOptions.length > 0 && !deliveryOptions.some((o) => o.value === deliveryOption)) {
      setDeliveryOption(deliveryOptions[0].value);
    }
  }, [deliveryOptions, deliveryOption]);

  const load = useCallback(async () => {
    try {
      const [cRes, mRes, pRes] = await Promise.all([
        fetch(`/api/consultation/conversations/${conversationId}`, { credentials: "include" }),
        fetch(`/api/consultation/conversations/${conversationId}/messages`, { credentials: "include" }),
        fetch(`/api/consultation/conversations/${conversationId}/proposals`, { credentials: "include" }),
      ]);
      if (cRes.ok) {
        const c = await cRes.json();
        setConvStatus(String(c?.status || "open"));
        setMetaPieceId(c?.masterpiece_id != null ? Number(c.masterpiece_id) : null);
        setMetaPieceStatus(c?.masterpiece_status != null ? String(c.masterpiece_status) : null);
        setMetaConsultationRequired(Number(c?.masterpiece_consultation_required) || 0);
        setMetaMadeToOrder(Number(c?.masterpiece_made_to_order) || 0);
        setWorkflowPhase(c?.consultation_workflow_phase != null ? String(c.consultation_workflow_phase) : null);
        setPurchaseUnlockedAt(c?.purchase_unlocked_at ? String(c.purchase_unlocked_at) : null);
        setDepositPaidAt(c?.deposit_paid_at ? String(c.deposit_paid_at) : null);
      }
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

  useEffect(() => {
    if (refreshKey > 0) load();
  }, [refreshKey, load]);

  const hasContractMessage = useMemo(
    () => messages.some((m) => String(m.message_type || "text") === "contract"),
    [messages]
  );
  const hasAcceptedContract = useMemo(
    () =>
      messages.some(
        (m) => String(m.message_type || "text") === "contract" && String(m.contract_status || "") === "accepted"
      ),
    [messages]
  );

  const metaGateDeposit = metaConsultationRequired === 1 || metaMadeToOrder === 1;

  const showStripeConsultDeposit =
    mode === "client" &&
    convStatus === "open" &&
    metaGateDeposit &&
    hasAcceptedContract &&
    !depositPaidAt &&
    metaPieceId != null;

  useEffect(() => {
    setStripePk(null);
    setDepositClientSecret(null);
    setDepositAmountCents(null);
    setContractTitle("");
    setContractDesc("");
    setContractFileUrl("");
    setFileAttachLabel("");
    setFileAttachUrl("");
    setProposalTitle("");
    setProposalDesc("");
    setProposalAmount("");
  }, [conversationId]);

  const latestAcceptedProposal = useMemo(() => {
    const accepted = proposals.filter((p) => String(p.status) === "accepted");
    if (accepted.length === 0) return null;
    return accepted.reduce((a, b) => (a.id > b.id ? a : b));
  }, [proposals]);

  useEffect(() => {
    if (mode !== "admin") return;
    if (hasContractMessage) return;
    const p = latestAcceptedProposal;
    if (!p) return;
    setContractTitle((prev) => (prev.trim() ? prev : String(p.title || "").trim()));
    setContractDesc((prev) => {
      if (prev.trim()) return prev;
      const lines: string[] = [];
      if (p.description && String(p.description).trim()) lines.push(String(p.description).trim());
      if (p.amount_eur != null && Number(p.amount_eur) > 0) {
        lines.push(
          `Vereinbarter Gesamtpreis / Agreed total: ${Number(p.amount_eur).toLocaleString("de-DE")} ${p.currency || "EUR"}`
        );
      }
      return lines.join("\n\n");
    });
  }, [mode, hasContractMessage, latestAcceptedProposal, conversationId]);

  useEffect(() => {
    if (!showStripeConsultDeposit) {
      setDepositClientSecret(null);
      setStripePk(null);
      setDepositAmountCents(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const cfgRes = await fetch("/api/stripe/config");
        const cfg = cfgRes.ok ? await cfgRes.json() : {};
        if (cancelled) return;
        const pk = cfg?.publishableKey ?? cfg?.publishable_key;
        if (pk) setStripePk(String(pk));
        const depRes = await fetch(`/api/consultation/conversations/${conversationId}/deposit-intent`, {
          method: "POST",
          credentials: "include",
        });
        const dep = await readJson(depRes);
        if (cancelled) return;
        if (!depRes.ok) {
          notify(dep.error || "Could not start deposit payment", "error");
          return;
        }
        setDepositClientSecret(dep.client_secret != null ? String(dep.client_secret) : null);
        setDepositAmountCents(dep.amount_cents != null ? Number(dep.amount_cents) : null);
      } catch {
        if (!cancelled) notify("Could not start deposit payment", "error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showStripeConsultDeposit, conversationId, notify]);

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

  const unlockPurchaseForClient = async () => {
    setLoading(true);
    try {
      const finalVal = unlockValuationDraft.trim() ? Number(unlockValuationDraft) : null;
      const res = await fetch(`/api/admin/consultation/conversations/${conversationId}/unlock-purchase`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          final_valuation_eur:
            finalVal != null && Number.isFinite(finalVal) && finalVal > 0 ? finalVal : undefined,
        }),
      });
      const data = await readJson(res);
      if (!res.ok) {
        notify(data.error || "Unlock failed", "error");
        return;
      }
      notify(str.unlockPurchaseSuccess, "success");
      setUnlockValuationDraft("");
      await load();
    } finally {
      setLoading(false);
    }
  };

  const startDepositPurchase = async () => {
    if (!metaPieceId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/marketplace/buy", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUserId,
          masterpieceId: metaPieceId,
          delivery_option: deliveryOption || null,
        }),
      });
      const data = await readJson(res);
      if (!res.ok) {
        notify(data.error || "Purchase failed", "error");
        return;
      }
      notify(str.purchaseSuccess, "success");
      onAfterPurchaseSuccess?.();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const declineProposal = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/consultation/proposals/${id}/decline`, {
        method: "POST",
        credentials: "include",
      });
      const data = await readJson(res);
      if (!res.ok) {
        notify(data.error || "Decline failed", "error");
        return;
      }
      notify(str.proposalDeclinedToast, "success");
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

  const closeThread = async () => {
    if (typeof window !== "undefined" && !window.confirm(str.confirmCloseThread)) return;
    setLoading(true);
    try {
      const url =
        mode === "admin"
          ? `/api/admin/consultation/conversations/${conversationId}/close`
          : `/api/consultation/conversations/${conversationId}/close`;
      const res = await fetch(url, { method: "POST", credentials: "include" });
      const data = await readJson(res);
      if (!res.ok) {
        notify(data.error || "Close failed", "error");
        return;
      }
      setConvStatus("closed");
      notify(str.threadClosedSuccess, "success");
      await load();
    } finally {
      setLoading(false);
    }
  };

  const reopenThread = async () => {
    if (typeof window !== "undefined" && !window.confirm(str.confirmReopenThread)) return;
    setLoading(true);
    try {
      const url =
        mode === "admin"
          ? `/api/admin/consultation/conversations/${conversationId}/reopen`
          : `/api/consultation/conversations/${conversationId}/reopen`;
      const res = await fetch(url, { method: "POST", credentials: "include" });
      const data = await readJson(res);
      if (!res.ok) {
        notify(data.error || "Reopen failed", "error");
        return;
      }
      setConvStatus("open");
      notify(str.threadReopenedSuccess, "success");
      await load();
    } finally {
      setLoading(false);
    }
  };

  const acceptContractMessage = async (messageId: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/consultation/conversations/${conversationId}/messages/${messageId}/accept-contract`,
        { method: "POST", credentials: "include" }
      );
      const data = await readJson(res);
      if (!res.ok) {
        notify(data.error || "Sign failed", "error");
        return;
      }
      notify(str.contractSignedToast, "success");
      await load();
    } finally {
      setLoading(false);
    }
  };

  const sendFileFromAdmin = async () => {
    const url = fileAttachUrl.trim();
    if (!url) {
      notify("File URL required", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/consultation/conversations/${conversationId}/file-message`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_url: url,
          title: fileAttachLabel.trim() || undefined,
        }),
      });
      const data = await readJson(res);
      if (!res.ok) {
        notify(data.error || "Send failed", "error");
        return;
      }
      setFileAttachLabel("");
      setFileAttachUrl("");
      notify(str.fileSentToast, "success");
      await load();
    } finally {
      setLoading(false);
    }
  };

  const sendContractFromAdmin = async () => {
    if (!contractTitle.trim() || !contractFileUrl.trim()) {
      notify("Title and PDF URL required", "error");
      return;
    }
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        title: contractTitle.trim(),
        description: contractDesc.trim() || null,
        file_url: contractFileUrl.trim(),
      };
      if (latestAcceptedProposal?.id) body.proposal_id = latestAcceptedProposal.id;

      const res = await fetch(`/api/admin/consultation/conversations/${conversationId}/contract-message`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await readJson(res);
      if (!res.ok) {
        notify(data.error || "Send failed", "error");
        return;
      }
      setContractTitle("");
      setContractDesc("");
      setContractFileUrl("");
      notify(str.contractSentToast, "success");
      await load();
    } finally {
      setLoading(false);
    }
  };

  const showBespokeUnlockAdmin = mode === "admin" && convStatus === "open" && metaGateDeposit && metaPieceId != null;
  const showClientDeposit =
    mode === "client" &&
    convStatus === "open" &&
    !!(purchaseUnlockedAt || depositPaidAt) &&
    metaPieceStatus === "available" &&
    metaPieceId != null &&
    metaGateDeposit;
  const showClientWaitingBespoke =
    mode === "client" &&
    convStatus === "open" &&
    metaGateDeposit &&
    !purchaseUnlockedAt &&
    !depositPaidAt &&
    metaPieceStatus === "available" &&
    !hasContractMessage &&
    !hasAcceptedContract;

  const showClientPieceBriefing =
    mode === "client" && convStatus === "open" && metaPieceId != null && !showClientDeposit;

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/95 gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-widest text-amber-600/90">Concierge</p>
            <p className="text-sm font-medium text-zinc-100 truncate max-w-[200px] sm:max-w-[240px]">
              {title || `Conversation #${conversationId}`}
            </p>
            {workflowPhase && (
              <p className="text-[10px] text-zinc-500 mt-0.5 truncate" title={workflowPhase}>
                {str.workflowPhaseLabel}: {workflowPhase.replace(/_/g, " ")}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {convStatus === "open" ? (
              <button
                type="button"
                disabled={loading}
                onClick={() => void closeThread()}
                className="text-[10px] uppercase tracking-wider px-2 py-1.5 rounded-lg text-zinc-400 border border-zinc-700 hover:text-amber-500/90 hover:border-amber-600/40 disabled:opacity-50"
              >
                {str.closeThread}
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={() => void reopenThread()}
                className="text-[10px] uppercase tracking-wider px-2 py-1.5 rounded-lg text-emerald-500/90 border border-emerald-600/40 hover:bg-emerald-600/10 disabled:opacity-50"
              >
                {str.reopenThread}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {convStatus !== "open" && (
          <div className="px-3 py-2 bg-zinc-800/90 border-b border-zinc-700 text-[11px] text-zinc-400 text-center">
            {str.conversationClosedBanner}
          </div>
        )}

        {showClientPieceBriefing && (
          <div className="px-3 py-3 border-b border-zinc-700/80 bg-zinc-950/80 space-y-2 shrink-0">
            <p className="text-[10px] uppercase tracking-widest text-amber-600/90">{str.clientBriefingTitle}</p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">{str.clientBriefingLegal}</p>
            <p className="text-[11px] text-zinc-300 leading-relaxed whitespace-pre-line">{str.clientBriefingChecklist}</p>
          </div>
        )}

        {showClientWaitingBespoke && (
          <div className="px-3 py-2 bg-amber-950/40 border-b border-amber-800/40 text-[11px] text-amber-200/90 text-center">
            {str.waitingForUnlockHint}
          </div>
        )}

        {showStripeConsultDeposit && (
          <div className="px-3 py-3 border-b border-amber-800/40 bg-zinc-950/95 space-y-2 shrink-0">
            <p className="text-[10px] uppercase tracking-widest text-amber-500/90">{str.proceedDepositTitle}</p>
            {stripePk && depositClientSecret && depositAmountCents != null && depositAmountCents > 0 ? (
              <Elements stripe={loadStripe(stripePk)} options={{ clientSecret: depositClientSecret }}>
                <ConsultationStripeDepositForm
                  conversationId={conversationId}
                  amountCents={depositAmountCents}
                  onPaid={() => {
                    notify(str.depositPaidToast, "success");
                    void load();
                  }}
                  onCancel={() => {
                    setDepositClientSecret(null);
                    setStripePk(null);
                    setDepositAmountCents(null);
                  }}
                  labels={{
                    heading: str.payDepositButton,
                    pay: str.payDepositButton,
                  }}
                />
              </Elements>
            ) : (
              <p className="text-xs text-zinc-500 text-center py-2">Preparing secure payment…</p>
            )}
          </div>
        )}

        {showClientDeposit && deliveryOptions.length > 0 && (
          <div className="px-3 py-3 border-b border-emerald-800/40 bg-emerald-950/20 space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-emerald-500/90">{str.deliverySelectLabel}</p>
            <select
              value={deliveryOption}
              onChange={(e) => setDeliveryOption(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-2 px-3 text-xs text-zinc-200"
            >
              {deliveryOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={loading}
              onClick={() => void startDepositPurchase()}
              className="w-full min-h-[44px] rounded-full text-sm font-medium bg-emerald-600/90 hover:bg-emerald-500 text-white disabled:opacity-50"
            >
              {str.depositAndContractButton}
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {messages.length === 0 && (
            <p className="text-xs text-zinc-500 text-center py-6 italic">{str.noMessages}</p>
          )}
          {messages.map((m) => {
            const mine = Number(m.sender_id) === Number(currentUserId);
            if (String(m.message_type || "text") === "file") {
              const href = m.contract_file_url || "";
              return (
                <div key={m.id} className={`flex w-full ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-[1.25rem] px-3 py-2 text-sm border ${
                      mine
                        ? "rounded-br-md bg-amber-600/15 text-amber-50 border-amber-600/35"
                        : "rounded-bl-md bg-zinc-800 text-zinc-200 border-zinc-700"
                    }`}
                  >
                    <p className="text-xs font-medium text-zinc-300 mb-1">{m.body || "Attachment"}</p>
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-amber-500/95 hover:text-amber-400 text-xs font-medium"
                      >
                        <FileDown className="w-4 h-4 shrink-0" />
                        Download
                      </a>
                    ) : null}
                    {m.created_at && (
                      <p className="text-[10px] text-zinc-500 mt-1">{new Date(m.created_at).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              );
            }
            if (String(m.message_type || "text") === "contract") {
              return (
                <div key={m.id} className={`flex w-full ${mine ? "justify-end" : "justify-start"}`}>
                  <ConsultationContractCard
                    message={m}
                    mode={mode}
                    isMine={mine}
                    loading={loading}
                    labels={{ agreedTotal: str.contractAgreedTotalLabel }}
                    onSign={
                      mode === "client" && convStatus === "open" && String(m.contract_status || "") === "sent"
                        ? () => void acceptContractMessage(m.id)
                        : undefined
                    }
                  />
                </div>
              );
            }
            return (
              <div
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-[1.25rem] px-3 py-2 text-sm ${
                    mine
                      ? "rounded-br-md bg-amber-600/20 text-amber-50 border border-amber-600/30"
                      : "rounded-bl-md bg-zinc-800 text-zinc-200 border border-zinc-700"
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
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">{str.proposalsHeading}</p>
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
                {mode === "client" && convStatus === "open" && p.status === "sent" && (
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => acceptProposal(p.id)}
                      className="flex-1 min-h-[40px] rounded-full text-xs font-medium bg-amber-600/20 text-amber-400 border border-amber-600/40 hover:bg-amber-600/30 disabled:opacity-50"
                    >
                      {str.acceptProposal}
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => declineProposal(p.id)}
                      className="flex-1 min-h-[40px] rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-600 hover:bg-zinc-700 disabled:opacity-50"
                    >
                      {str.declineProposal}
                    </button>
                  </div>
                )}
                {mode === "client" && convStatus === "open" && p.status === "accepted" && !metaGateDeposit && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => requestDepositInfo(p.id)}
                    className="mt-2 w-full min-h-[40px] rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-600 hover:bg-zinc-700 disabled:opacity-50"
                  >
                    {str.depositInfo}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {showBespokeUnlockAdmin && (
          <div className="border-t border-zinc-800 px-3 py-2 space-y-2 bg-zinc-950/60">
            <p className="text-[10px] uppercase tracking-widest text-emerald-500/90">Bespoke purchase</p>
            <input
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-200"
              placeholder={str.unlockFinalValuationPlaceholder}
              value={unlockValuationDraft}
              onChange={(e) => setUnlockValuationDraft(e.target.value)}
              inputMode="decimal"
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => void unlockPurchaseForClient()}
              className="w-full min-h-[40px] rounded-full text-xs font-medium bg-emerald-700/80 hover:bg-emerald-600 text-white disabled:opacity-50"
            >
              {str.unlockPurchaseButton}
            </button>
          </div>
        )}

        {mode === "admin" && convStatus === "open" && !hasContractMessage && (
          <div className="border-t border-zinc-800 px-3 py-2 space-y-2 bg-zinc-950/70">
            <p className="text-[10px] uppercase tracking-widest text-amber-600/90">{str.sendContractHeading}</p>
            {latestAcceptedProposal ? (
              <p className="text-[10px] text-zinc-500 leading-relaxed">{str.contractFromProposalHint}</p>
            ) : null}
            <input
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-200"
              placeholder={str.contractTitlePlaceholder}
              value={contractTitle}
              onChange={(e) => setContractTitle(e.target.value)}
            />
            <textarea
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-200 min-h-[48px]"
              placeholder="Description (optional)"
              value={contractDesc}
              onChange={(e) => setContractDesc(e.target.value)}
            />
            <input
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-200"
              placeholder={str.contractPdfUrlPlaceholder}
              value={contractFileUrl}
              onChange={(e) => setContractFileUrl(e.target.value)}
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => void sendContractFromAdmin()}
              className="w-full min-h-[40px] rounded-full text-xs font-medium bg-amber-700/90 hover:bg-amber-600 text-white disabled:opacity-50 border border-amber-600/40"
            >
              {str.sendContractButton}
            </button>
          </div>
        )}

        {mode === "admin" && convStatus === "open" && hasContractMessage && (
          <div className="border-t border-zinc-800 px-3 py-2 bg-zinc-950/50 text-[10px] text-zinc-500 text-center">
            Contract message already sent in this thread.
          </div>
        )}

        {mode === "admin" && convStatus === "open" && (
          <div className="border-t border-zinc-800 px-3 py-2 space-y-2 bg-zinc-950/55">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">{str.sendFileHeading}</p>
            <input
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-200"
              placeholder={str.fileLabelPlaceholder}
              value={fileAttachLabel}
              onChange={(e) => setFileAttachLabel(e.target.value)}
            />
            <input
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-200"
              placeholder={str.fileUrlPlaceholder}
              value={fileAttachUrl}
              onChange={(e) => setFileAttachUrl(e.target.value)}
            />
            <button
              type="button"
              disabled={loading || !fileAttachUrl.trim()}
              onClick={() => void sendFileFromAdmin()}
              className="w-full min-h-[40px] rounded-full text-xs font-medium bg-zinc-700 hover:bg-zinc-600 text-white disabled:opacity-50 border border-zinc-600/50"
            >
              {str.sendFileButton}
            </button>
          </div>
        )}

        {mode === "admin" && convStatus === "open" && (
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
              {str.sendProposalButton}
            </button>
          </div>
        )}

        {convStatus === "open" && (
          <div className="flex gap-2 p-3 border-t border-zinc-800 bg-zinc-900/95">
            <input
              className="flex-1 bg-zinc-950 border border-zinc-700 rounded-full px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-600/50"
              placeholder="Message…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <button
              type="button"
              disabled={loading || !draft.trim()}
              onClick={() => void send()}
              className="min-h-[44px] min-w-[44px] rounded-full bg-amber-600 text-white flex items-center justify-center disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
