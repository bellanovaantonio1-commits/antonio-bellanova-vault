/**
 * Made-to-order consultation API (conversations, messages, proposals).
 * **Default: enabled** when `ENABLE_CONSULTATION_FLOW` is unset. Set to `false` / `0` / `no` to disable.
 * Does not alter legacy purchase/payment flows when disabled (routes return 503).
 */
import type { Application, Request, Response } from "express";
import type Stripe from "stripe";
import type { DbInterface } from "../../lib/db.js";
import { createUserOrIpRateLimiter } from "../../lib/rateLimit.js";

/** Chat messages — per user (or IP if misconfigured). */
const consultationChatPostLimiter = createUserOrIpRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 120,
  keyPrefix: ":consult:msg",
});
/** Creates, proposals, close/reopen, accept/decline, etc. */
const consultationMutatePostLimiter = createUserOrIpRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
  keyPrefix: ":consult:mut",
});

export function isConsultationFlowEnabled(): boolean {
  const raw = String(process.env.ENABLE_CONSULTATION_FLOW ?? "").trim();
  if (!raw) return true;
  const v = raw.toLowerCase();
  if (v === "false" || v === "0" || v === "no" || v === "off") return false;
  return v === "true" || v === "1" || v === "yes" || v === "on";
}

function disabled(res: Response) {
  return res.status(503).json({ error: "Consultation flow is disabled", code: "CONSULTATION_DISABLED" });
}

function isAdminUser(user: { role?: string } | null | undefined): boolean {
  return user?.role === "admin" || user?.role === "super_admin";
}

export type ConsultationNotifyHooks = {
  /** In-app notification when the atelier replies in the consultation thread */
  onAdminRepliedToClient?: (clientUserId: number, conversationId: number) => void | Promise<void>;
  /** In-app notification when a formal proposal is sent */
  onProposalSentToClient?: (clientUserId: number, conversationId: number, proposalTitle: string) => void | Promise<void>;
  /** When staff closes the thread (client can still read history) */
  onConsultationClosedByAdmin?: (clientUserId: number, conversationId: number) => void | Promise<void>;
  /** When staff reopens a closed thread */
  onConsultationReopenedByAdmin?: (clientUserId: number, conversationId: number) => void | Promise<void>;
  /** When staff unlocks deposit / contract step for a consultation-only piece */
  onPurchaseUnlockedForClient?: (clientUserId: number, conversationId: number) => void | Promise<void>;
};

type ConsultationDeps = {
  /** Lazy: `db` is assigned only after `initDb()` in `startServer()` — do not pass `db` at module load time. */
  getDb: () => DbInterface;
  broadcast?: (data: Record<string, unknown>) => void;
  logAudit?: (adminId: number, action: string, targetId: string, details: string) => Promise<void> | void;
  /** Required for consultation deposit PaymentIntents */
  getStripe?: () => Stripe;
  consultationNotify?: ConsultationNotifyHooks;
};

function stripeSecretConfigured(): boolean {
  const raw = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET;
  return !!(raw && String(raw).trim());
}

export function registerConsultationRoutes(app: Application, deps: ConsultationDeps): void {
  const { getDb, broadcast, logAudit, consultationNotify, getStripe } = deps;

  app.get("/api/consultation/enabled", (_req: Request, res: Response) => {
    res.json({
      enabled: isConsultationFlowEnabled(),
      enableConsultationFlow: isConsultationFlowEnabled(),
    });
  });

  const gate = (_req: Request, res: Response, next: () => void) => {
    if (!isConsultationFlowEnabled()) return disabled(res);
    next();
  };

  app.get("/api/consultation/conversations", gate, async (req: Request, res: Response) => {
    const userId = (req as any).userId as number;
    const user = (req as any).user;
    if (user?.role === "guest") return res.status(403).json({ error: "Account required", code: "GUEST_RESTRICTED" });
    if (isAdminUser(user)) {
      return res.status(400).json({ error: "Use GET /api/admin/consultation/conversations" });
    }
    try {
      const rows = await (
        await getDb().prepare(
          `SELECT c.*, m.title AS masterpiece_title
           FROM consultation_conversations c
           LEFT JOIN masterpieces m ON m.id = c.masterpiece_id
           WHERE c.user_id = ?
           ORDER BY c.updated_at DESC`
        )
      ).all(userId);
      res.json(rows);
    } catch (e: any) {
      console.error("[consultation/conversations]", e);
      res.status(500).json({ error: e?.message || "Failed to list conversations" });
    }
  });

  app.get("/api/admin/consultation/conversations", gate, async (req: Request, res: Response) => {
    try {
      const raw = String(req.query?.status ?? "all").toLowerCase();
      const statusFilter = raw === "open" || raw === "closed" ? raw : "all";
      const sql =
        statusFilter === "all"
          ? `SELECT c.*, u.name AS client_name, u.email AS client_email,
            m.title AS masterpiece_title
           FROM consultation_conversations c
           LEFT JOIN users u ON u.id = c.user_id
           LEFT JOIN masterpieces m ON m.id = c.masterpiece_id
           ORDER BY c.updated_at DESC LIMIT 200`
          : `SELECT c.*, u.name AS client_name, u.email AS client_email,
            m.title AS masterpiece_title
           FROM consultation_conversations c
           LEFT JOIN users u ON u.id = c.user_id
           LEFT JOIN masterpieces m ON m.id = c.masterpiece_id
           WHERE c.status = ?
           ORDER BY c.updated_at DESC LIMIT 200`;
      const rows =
        statusFilter === "all"
          ? await (await getDb().prepare(sql)).all()
          : await (await getDb().prepare(sql)).all(statusFilter);
      res.json(rows);
    } catch (e: any) {
      console.error("[admin/consultation/conversations]", e);
      res.status(500).json({ error: e?.message || "Failed to list conversations" });
    }
  });

  app.post("/api/consultation/conversations", gate, consultationMutatePostLimiter, async (req: Request, res: Response) => {
    const userId = (req as any).userId as number;
    const user = (req as any).user;
    if (user?.role === "guest") return res.status(403).json({ error: "Account required", code: "GUEST_RESTRICTED" });
    if (isAdminUser(user)) return res.status(403).json({ error: "Admins use admin consultation endpoints" });
    const masterpiece_id = req.body?.masterpiece_id != null ? Number(req.body.masterpiece_id) : null;
    const subject = req.body?.subject != null ? String(req.body.subject).slice(0, 500) : null;
    try {
      if (masterpiece_id) {
        const existing = (await (
          await getDb().prepare(
            `SELECT * FROM consultation_conversations
             WHERE user_id = ? AND masterpiece_id = ? AND status = 'open' ORDER BY id DESC LIMIT 1`
          )
        ).get(userId, masterpiece_id)) as Record<string, unknown> | undefined;
        if (existing) return res.json(existing);
      }
      const r = await (
        await getDb().prepare(
          `INSERT INTO consultation_conversations (user_id, masterpiece_id, status, subject)
           VALUES (?, ?, 'open', ?)`
        )
      ).run(userId, masterpiece_id, subject);
      const id = Number(r.lastInsertRowid);
      const row = await (await getDb().prepare(`SELECT * FROM consultation_conversations WHERE id = ?`)).get(id);
      broadcast?.({ type: "CONSULTATION_CONVERSATION_CREATED", conversationId: id, userId });
      res.json(row);
    } catch (e: any) {
      console.error("[consultation/conversations POST]", e);
      res.status(500).json({ error: e?.message || "Failed to create conversation" });
    }
  });

  async function loadConversation(id: number) {
    return (await (await getDb().prepare(`SELECT * FROM consultation_conversations WHERE id = ?`)).get(id)) as Record<string, any> | undefined;
  }

  async function bumpWorkflowInProgress(convId: number) {
    try {
      await (
        await getDb().prepare(
          `UPDATE consultation_conversations SET workflow_status = 'in_progress', updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND (workflow_status IS NULL OR workflow_status = '' OR workflow_status = 'open')`
        )
      ).run(convId);
    } catch (_) {
      /* optional column / legacy DB */
    }
  }

  /** Basis für Anzahlung: zuerst akzeptiertes Angebot (consultation_proposals.amount_eur), sonst Marktplatz-Bewertung. */
  async function conversationDepositAmountCents(conv: Record<string, any>): Promise<number | null> {
    const convId = Number(conv.id);
    const mid = conv.masterpiece_id != null ? Number(conv.masterpiece_id) : NaN;
    const proposalRow = (await (
      await getDb().prepare(
        `SELECT amount_eur FROM consultation_proposals
         WHERE conversation_id = ? AND status = 'accepted' AND amount_eur IS NOT NULL AND amount_eur > 0
         ORDER BY id DESC LIMIT 1`
      )
    ).get(convId)) as { amount_eur?: number | null } | undefined;

    let baseEur = 0;
    if (proposalRow != null && proposalRow.amount_eur != null && Number(proposalRow.amount_eur) > 0) {
      baseEur = Number(proposalRow.amount_eur);
    }

    let depositPct = 10;
    if (mid && !Number.isNaN(mid)) {
      const piece = (await (await getDb().prepare(`SELECT valuation, deposit_pct FROM masterpieces WHERE id = ?`)).get(mid)) as
        | { valuation?: number | null; deposit_pct?: number | null }
        | undefined;
      if (!piece) return null;
      depositPct = Number(piece.deposit_pct) || 10;
      if (baseEur <= 0) baseEur = Number(piece.valuation) || 0;
    } else if (baseEur <= 0) {
      return null;
    }

    const amountEur = (baseEur * depositPct) / 100;
    const amountCents = Math.round(amountEur * 100);
    if (amountCents < 100) return null;
    return amountCents;
  }

  async function hasAcceptedContractMessage(conversationId: number): Promise<boolean> {
    const row = (await (
      await getDb().prepare(
        `SELECT id FROM consultation_messages
         WHERE conversation_id = ? AND COALESCE(message_type, 'text') = 'contract' AND contract_status = 'accepted'
         LIMIT 1`
      )
    ).get(conversationId)) as { id?: number } | undefined;
    return !!row?.id;
  }

  async function canAccessConversation(conv: Record<string, any>, req: Request): Promise<boolean> {
    const userId = (req as any).userId as number;
    const user = (req as any).user;
    if (isAdminUser(user)) return true;
    if (user?.role === "guest") return false;
    return Number(conv.user_id) === Number(userId);
  }

  app.get("/api/consultation/conversations/:id", gate, async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });
    try {
      const row = (await (
        await getDb().prepare(
          `SELECT c.*, m.title AS masterpiece_title, m.status AS masterpiece_status,
            m.consultation_required AS masterpiece_consultation_required
           FROM consultation_conversations c
           LEFT JOIN masterpieces m ON m.id = c.masterpiece_id
           WHERE c.id = ?`
        )
      ).get(id)) as Record<string, unknown> | undefined;
      if (!row) return res.status(404).json({ error: "Not found" });
      const conv = row as Record<string, any>;
      if (!(await canAccessConversation(conv, req))) return res.status(403).json({ error: "Forbidden" });
      res.json(row);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed" });
    }
  });

  app.get("/api/consultation/conversations/:id/messages", gate, async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });
    try {
      const conv = await loadConversation(id);
      if (!conv) return res.status(404).json({ error: "Not found" });
      if (!(await canAccessConversation(conv, req))) return res.status(403).json({ error: "Forbidden" });
      const rows = await (
        await getDb().prepare(
          `SELECT * FROM consultation_messages WHERE conversation_id = ? ORDER BY created_at ASC`
        )
      ).all(id);
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed" });
    }
  });

  app.post("/api/consultation/conversations/:id/messages", gate, consultationChatPostLimiter, async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const userId = (req as any).userId as number;
    const user = (req as any).user;
    if (user?.role === "guest") return res.status(403).json({ error: "Account required", code: "GUEST_RESTRICTED" });
    if (isAdminUser(user)) return res.status(403).json({ error: "Use POST /api/admin/consultation/conversations/:id/messages" });
    const body = req.body?.body != null ? String(req.body.body).trim() : "";
    if (!body) return res.status(400).json({ error: "body required" });
    if (!id) return res.status(400).json({ error: "Invalid id" });
    try {
      const conv = await loadConversation(id);
      if (!conv) return res.status(404).json({ error: "Not found" });
      if (!(await canAccessConversation(conv, req))) return res.status(403).json({ error: "Forbidden" });
      if (conv.status !== "open") return res.status(400).json({ error: "Conversation is closed" });
      const r = await (
        await getDb().prepare(
          `INSERT INTO consultation_messages (conversation_id, sender_id, body, message_type) VALUES (?, ?, ?, 'text')`
        )
      ).run(id, userId, body.slice(0, 20000));
      await (await getDb().prepare(`UPDATE consultation_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`)).run(id);
      await bumpWorkflowInProgress(id);
      const msg = await (await getDb().prepare(`SELECT * FROM consultation_messages WHERE id = ?`)).get(Number(r.lastInsertRowid));
      broadcast?.({ type: "CONSULTATION_MESSAGE", conversationId: id, messageId: r.lastInsertRowid });
      res.json(msg);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed" });
    }
  });

  app.post(
    "/api/consultation/conversations/:conversationId/messages/:messageId/accept-contract",
    gate,
    consultationMutatePostLimiter,
    async (req: Request, res: Response) => {
      const conversationId = Number(req.params.conversationId);
      const messageId = Number(req.params.messageId);
      const userId = (req as any).userId as number;
      const user = (req as any).user;
      if (user?.role === "guest") return res.status(403).json({ error: "Account required", code: "GUEST_RESTRICTED" });
      if (isAdminUser(user)) return res.status(403).json({ error: "Clients only" });
      if (!conversationId || !messageId) return res.status(400).json({ error: "Invalid id" });
      try {
        const conv = await loadConversation(conversationId);
        if (!conv) return res.status(404).json({ error: "Not found" });
        if (Number(conv.user_id) !== Number(userId)) return res.status(403).json({ error: "Forbidden" });
        if (conv.status !== "open") return res.status(400).json({ error: "Conversation is closed" });
        const msg = (await (await getDb().prepare(`SELECT * FROM consultation_messages WHERE id = ? AND conversation_id = ?`)).get(
          messageId,
          conversationId
        )) as Record<string, any> | undefined;
        if (!msg) return res.status(404).json({ error: "Message not found" });
        if (String(msg.message_type || "text") !== "contract") return res.status(400).json({ error: "Not a contract message" });
        if (String(msg.contract_status || "") !== "sent") return res.status(400).json({ error: "Contract cannot be signed in current state" });
        await (
          await getDb().prepare(`UPDATE consultation_messages SET contract_status = 'accepted' WHERE id = ? AND conversation_id = ?`)
        ).run(messageId, conversationId);
        await (await getDb().prepare(`UPDATE consultation_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`)).run(conversationId);
        const updated = await (await getDb().prepare(`SELECT * FROM consultation_messages WHERE id = ?`)).get(messageId);
        broadcast?.({ type: "CONSULTATION_CONTRACT_ACCEPTED", conversationId, messageId });
        res.json(updated);
      } catch (e: any) {
        res.status(500).json({ error: e?.message || "Failed" });
      }
    }
  );

  app.post("/api/consultation/conversations/:id/deposit-intent", gate, consultationMutatePostLimiter, async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const userId = (req as any).userId as number;
    const user = (req as any).user;
    if (user?.role === "guest") return res.status(403).json({ error: "Account required", code: "GUEST_RESTRICTED" });
    if (isAdminUser(user)) return res.status(403).json({ error: "Client endpoint" });
    if (!id) return res.status(400).json({ error: "Invalid id" });
    if (!getStripe || !stripeSecretConfigured()) return res.status(503).json({ error: "Card payments are not configured" });
    try {
      const conv = await loadConversation(id);
      if (!conv) return res.status(404).json({ error: "Not found" });
      if (Number(conv.user_id) !== Number(userId)) return res.status(403).json({ error: "Forbidden" });
      if (conv.status !== "open") return res.status(400).json({ error: "Conversation is closed" });
      const accepted = await hasAcceptedContractMessage(id);
      if (!accepted) {
        return res.status(400).json({
          error: "Deposit is available only after you sign the contract sent in this chat.",
          code: "CONTRACT_NOT_ACCEPTED",
        });
      }
      if (conv.deposit_paid_at) {
        return res.status(400).json({ error: "Deposit already recorded for this consultation", code: "DEPOSIT_ALREADY_PAID" });
      }
      const amountCents = await conversationDepositAmountCents(conv);
      if (amountCents == null) {
        return res.status(400).json({ error: "No linked masterpiece or deposit amount could not be calculated" });
      }
      const mid = Number(conv.masterpiece_id);
      const stripe = getStripe();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: "eur",
        automatic_payment_methods: { enabled: true },
        metadata: {
          payment_type: "consultation_deposit",
          conversation_id: String(id),
          user_id: String(userId),
          masterpiece_id: String(mid),
        },
      });
      console.log(
        "[Consultation] Deposit intent: conversation_id=" + id + " user_id=" + userId + " amount_cents=" + amountCents + " pi=" + paymentIntent.id
      );
      res.json({
        client_secret: paymentIntent.client_secret,
        amount_cents: amountCents,
        payment_intent_id: paymentIntent.id,
      });
    } catch (e: any) {
      console.error("[consultation/deposit-intent]", e);
      res.status(500).json({ error: e?.message || "Failed to create payment" });
    }
  });

  app.post("/api/consultation/conversations/:id/confirm-deposit", gate, consultationMutatePostLimiter, async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const userId = (req as any).userId as number;
    const user = (req as any).user;
    if (user?.role === "guest") return res.status(403).json({ error: "Account required", code: "GUEST_RESTRICTED" });
    if (isAdminUser(user)) return res.status(403).json({ error: "Client endpoint" });
    const piId = String(req.body?.payment_intent || req.body?.payment_intent_id || "").trim();
    if (!piId || !piId.startsWith("pi_")) return res.status(400).json({ error: "Invalid payment_intent" });
    if (!getStripe || !stripeSecretConfigured()) return res.status(503).json({ error: "Card payments are not configured" });
    if (!id) return res.status(400).json({ error: "Invalid id" });
    try {
      const conv = await loadConversation(id);
      if (!conv) return res.status(404).json({ error: "Not found" });
      if (Number(conv.user_id) !== Number(userId)) return res.status(403).json({ error: "Forbidden" });
      const stripe = getStripe();
      const pi = await stripe.paymentIntents.retrieve(piId);
      if (pi.status !== "succeeded") {
        return res.status(200).json({ recorded: false, status: pi.status, message: "Payment not completed yet" });
      }
      const meta = pi.metadata || {};
      if (meta.payment_type !== "consultation_deposit") {
        return res.json({ recorded: false, wrong_type: true });
      }
      if (String(meta.conversation_id || "") !== String(id) || String(meta.user_id || "") !== String(userId)) {
        return res.status(403).json({ error: "Payment does not match this consultation" });
      }
      const expectedCents = await conversationDepositAmountCents(conv);
      const amountCents = pi.amount ?? 0;
      if (expectedCents != null && amountCents !== expectedCents) {
        console.warn("[Consultation] confirm-deposit amount mismatch conv=" + id + " expected=" + expectedCents + " got=" + amountCents);
        return res.status(400).json({ error: "Amount mismatch" });
      }
      if (conv.deposit_paid_at && String(conv.deposit_stripe_payment_intent_id || "") === piId) {
        return res.json({ recorded: true, already: true });
      }
      if (conv.deposit_paid_at) {
        return res.json({ recorded: true, already: true });
      }
      await (
        await getDb().prepare(
          `UPDATE consultation_conversations SET deposit_paid_at = CURRENT_TIMESTAMP, deposit_stripe_payment_intent_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`
        )
      ).run(piId, id, userId);
      broadcast?.({ type: "CONSULTATION_DEPOSIT_PAID", conversationId: id, userId });
      res.json({ recorded: true });
    } catch (e: any) {
      console.error("[consultation/confirm-deposit]", e);
      res.status(500).json({ error: e?.message || "Failed" });
    }
  });

  app.post("/api/consultation/conversations/:id/close", gate, consultationMutatePostLimiter, async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const userId = (req as any).userId as number;
    const user = (req as any).user;
    if (user?.role === "guest") return res.status(403).json({ error: "Account required", code: "GUEST_RESTRICTED" });
    if (isAdminUser(user)) return res.status(403).json({ error: "Use POST /api/admin/consultation/conversations/:id/close" });
    if (!id) return res.status(400).json({ error: "Invalid id" });
    try {
      const conv = await loadConversation(id);
      if (!conv) return res.status(404).json({ error: "Not found" });
      if (Number(conv.user_id) !== Number(userId)) return res.status(403).json({ error: "Forbidden" });
      if (conv.status !== "open") return res.status(400).json({ error: "Conversation already closed" });
      await (await getDb().prepare(`UPDATE consultation_conversations SET status = 'closed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`)).run(id);
      broadcast?.({ type: "CONSULTATION_CONVERSATION_CLOSED", conversationId: id });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed" });
    }
  });

  app.post("/api/consultation/conversations/:id/reopen", gate, consultationMutatePostLimiter, async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const userId = (req as any).userId as number;
    const user = (req as any).user;
    if (user?.role === "guest") return res.status(403).json({ error: "Account required", code: "GUEST_RESTRICTED" });
    if (isAdminUser(user)) return res.status(403).json({ error: "Use POST /api/admin/consultation/conversations/:id/reopen" });
    if (!id) return res.status(400).json({ error: "Invalid id" });
    try {
      const conv = await loadConversation(id);
      if (!conv) return res.status(404).json({ error: "Not found" });
      if (Number(conv.user_id) !== Number(userId)) return res.status(403).json({ error: "Forbidden" });
      if (conv.status === "open") return res.status(400).json({ error: "Conversation is already open" });
      await (await getDb().prepare(`UPDATE consultation_conversations SET status = 'open', updated_at = CURRENT_TIMESTAMP WHERE id = ?`)).run(id);
      broadcast?.({ type: "CONSULTATION_CONVERSATION_REOPENED", conversationId: id });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed" });
    }
  });

  app.get("/api/consultation/conversations/:id/proposals", gate, async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });
    try {
      const conv = await loadConversation(id);
      if (!conv) return res.status(404).json({ error: "Not found" });
      if (!(await canAccessConversation(conv, req))) return res.status(403).json({ error: "Forbidden" });
      const rows = await (
        await getDb().prepare(`SELECT * FROM consultation_proposals WHERE conversation_id = ? ORDER BY id DESC`)
      ).all(id);
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed" });
    }
  });

  app.post("/api/consultation/proposals/:proposalId/accept", gate, consultationMutatePostLimiter, async (req: Request, res: Response) => {
    const proposalId = Number(req.params.proposalId);
    const userId = (req as any).userId as number;
    const user = (req as any).user;
    if (user?.role === "guest") return res.status(403).json({ error: "Account required", code: "GUEST_RESTRICTED" });
    if (isAdminUser(user)) return res.status(403).json({ error: "Admins cannot accept on behalf of client" });
    if (!proposalId) return res.status(400).json({ error: "Invalid proposal" });
    try {
      const proposal = (await (await getDb().prepare(`SELECT * FROM consultation_proposals WHERE id = ?`)).get(proposalId)) as Record<string, any> | undefined;
      if (!proposal) return res.status(404).json({ error: "Proposal not found" });
      if (proposal.status !== "sent") return res.status(400).json({ error: "Proposal cannot be accepted in current state" });
      const conv = await loadConversation(Number(proposal.conversation_id));
      if (!conv || Number(conv.user_id) !== Number(userId)) return res.status(403).json({ error: "Forbidden" });
      if (conv.status !== "open") return res.status(400).json({ error: "Conversation is closed" });
      await (
        await getDb().prepare(
          `UPDATE consultation_proposals SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
        )
      ).run(proposalId);
      const updated = await (await getDb().prepare(`SELECT * FROM consultation_proposals WHERE id = ?`)).get(proposalId);
      broadcast?.({ type: "CONSULTATION_PROPOSAL_ACCEPTED", proposalId, conversationId: proposal.conversation_id });
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed" });
    }
  });

  app.post("/api/consultation/proposals/:proposalId/decline", gate, consultationMutatePostLimiter, async (req: Request, res: Response) => {
    const proposalId = Number(req.params.proposalId);
    const userId = (req as any).userId as number;
    const user = (req as any).user;
    if (user?.role === "guest") return res.status(403).json({ error: "Account required", code: "GUEST_RESTRICTED" });
    if (isAdminUser(user)) return res.status(403).json({ error: "Admins cannot decline on behalf of client" });
    if (!proposalId) return res.status(400).json({ error: "Invalid proposal" });
    try {
      const proposal = (await (await getDb().prepare(`SELECT * FROM consultation_proposals WHERE id = ?`)).get(proposalId)) as Record<string, any> | undefined;
      if (!proposal) return res.status(404).json({ error: "Proposal not found" });
      if (proposal.status !== "sent") return res.status(400).json({ error: "Proposal cannot be declined in current state" });
      const conv = await loadConversation(Number(proposal.conversation_id));
      if (!conv || Number(conv.user_id) !== Number(userId)) return res.status(403).json({ error: "Forbidden" });
      if (conv.status !== "open") return res.status(400).json({ error: "Conversation is closed" });
      await (
        await getDb().prepare(
          `UPDATE consultation_proposals SET status = 'declined', updated_at = CURRENT_TIMESTAMP WHERE id = ?`
        )
      ).run(proposalId);
      const updated = await (await getDb().prepare(`SELECT * FROM consultation_proposals WHERE id = ?`)).get(proposalId);
      broadcast?.({ type: "CONSULTATION_PROPOSAL_DECLINED", proposalId, conversationId: proposal.conversation_id });
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed" });
    }
  });

  /**
   * Optional hook after proposal acceptance — does not create payments or contracts.
   * Integrators can listen for this response or use masterpiece_id for existing deposit flows.
   */
  app.post("/api/consultation/proposals/:proposalId/request-deposit", gate, consultationMutatePostLimiter, async (req: Request, res: Response) => {
    const proposalId = Number(req.params.proposalId);
    const userId = (req as any).userId as number;
    const user = (req as any).user;
    if (user?.role === "guest") return res.status(403).json({ error: "Account required", code: "GUEST_RESTRICTED" });
    if (!proposalId) return res.status(400).json({ error: "Invalid proposal" });
    try {
      const proposal = (await (await getDb().prepare(`SELECT * FROM consultation_proposals WHERE id = ?`)).get(proposalId)) as Record<string, any> | undefined;
      if (!proposal) return res.status(404).json({ error: "Proposal not found" });
      if (proposal.status !== "accepted") return res.status(400).json({ error: "Proposal must be accepted first" });
      const conv = await loadConversation(Number(proposal.conversation_id));
      if (!conv || Number(conv.user_id) !== Number(userId)) return res.status(403).json({ error: "Forbidden" });
      res.json({
        ok: true,
        hook: "consultation_deposit_intent",
        message:
          "No payment was created. Use existing marketplace / vault deposit flows when you are ready to integrate.",
        proposal_id: proposalId,
        conversation_id: conv.id,
        masterpiece_id: conv.masterpiece_id,
        amount_eur: proposal.amount_eur,
        currency: proposal.currency || "EUR",
      });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed" });
    }
  });

  // --- Admin (global /api middleware already enforces admin for /api/admin/*) ---
  app.post("/api/admin/consultation/conversations/:id/messages", gate, consultationChatPostLimiter, async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const adminId = (req as any).userId as number;
    const body = req.body?.body != null ? String(req.body.body).trim() : "";
    if (!body) return res.status(400).json({ error: "body required" });
    if (!id) return res.status(400).json({ error: "Invalid id" });
    try {
      const conv = await loadConversation(id);
      if (!conv) return res.status(404).json({ error: "Not found" });
      if (conv.status !== "open") return res.status(400).json({ error: "Conversation is closed" });
      const r = await (
        await getDb().prepare(
          `INSERT INTO consultation_messages (conversation_id, sender_id, body, message_type) VALUES (?, ?, ?, 'text')`
        )
      ).run(id, adminId, body.slice(0, 20000));
      await (await getDb().prepare(`UPDATE consultation_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`)).run(id);
      await bumpWorkflowInProgress(id);
      const msg = await (await getDb().prepare(`SELECT * FROM consultation_messages WHERE id = ?`)).get(Number(r.lastInsertRowid));
      await logAudit?.(adminId, "CONSULTATION_MESSAGE", String(id), `Admin reply in consultation ${id}`);
      broadcast?.({ type: "CONSULTATION_MESSAGE", conversationId: id, messageId: r.lastInsertRowid, fromAdmin: true });
      try {
        await consultationNotify?.onAdminRepliedToClient?.(Number(conv.user_id), id);
      } catch (_) {}
      res.json(msg);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed" });
    }
  });

  app.post("/api/admin/consultation/proposals", gate, consultationMutatePostLimiter, async (req: Request, res: Response) => {
    const adminId = (req as any).userId as number;
    const conversation_id = Number(req.body?.conversation_id);
    const title = req.body?.title != null ? String(req.body.title).slice(0, 300) : "";
    const description = req.body?.description != null ? String(req.body.description).slice(0, 20000) : null;
    const amount_eur = req.body?.amount_eur != null ? Number(req.body.amount_eur) : null;
    const currency = req.body?.currency != null ? String(req.body.currency).slice(0, 8) : "EUR";
    if (!conversation_id || !title) return res.status(400).json({ error: "conversation_id and title required" });
    try {
      const conv = await loadConversation(conversation_id);
      if (!conv) return res.status(404).json({ error: "Conversation not found" });
      if (conv.status !== "open") return res.status(400).json({ error: "Conversation is closed" });
      const r = await (
        await getDb().prepare(
          `INSERT INTO consultation_proposals
           (conversation_id, title, description, amount_eur, currency, status, created_by)
           VALUES (?, ?, ?, ?, ?, 'sent', ?)`
        )
      ).run(conversation_id, title, description, amount_eur, currency, adminId);
      const pid = Number(r.lastInsertRowid);
      const row = await (await getDb().prepare(`SELECT * FROM consultation_proposals WHERE id = ?`)).get(pid);
      await logAudit?.(adminId, "CONSULTATION_PROPOSAL", String(pid), `Sent proposal "${title}" for conversation ${conversation_id}`);
      broadcast?.({ type: "CONSULTATION_PROPOSAL_SENT", proposalId: pid, conversationId: conversation_id });
      try {
        await consultationNotify?.onProposalSentToClient?.(Number(conv.user_id), conversation_id, title);
      } catch (_) {}
      res.json(row);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed" });
    }
  });

  app.post("/api/admin/consultation/conversations/:id/close", gate, consultationMutatePostLimiter, async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const adminId = (req as any).userId as number;
    if (!id) return res.status(400).json({ error: "Invalid id" });
    try {
      const conv = await loadConversation(id);
      if (!conv) return res.status(404).json({ error: "Not found" });
      if (conv.status !== "open") return res.status(400).json({ error: "Conversation already closed" });
      await (await getDb().prepare(`UPDATE consultation_conversations SET status = 'closed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`)).run(id);
      await logAudit?.(adminId, "CONSULTATION_CLOSE", String(id), `Closed consultation ${id} for user ${conv.user_id}`);
      broadcast?.({ type: "CONSULTATION_CONVERSATION_CLOSED", conversationId: id });
      try {
        await consultationNotify?.onConsultationClosedByAdmin?.(Number(conv.user_id), id);
      } catch (_) {}
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed" });
    }
  });

  app.post("/api/admin/consultation/conversations/:id/reopen", gate, consultationMutatePostLimiter, async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const adminId = (req as any).userId as number;
    if (!id) return res.status(400).json({ error: "Invalid id" });
    try {
      const conv = await loadConversation(id);
      if (!conv) return res.status(404).json({ error: "Not found" });
      if (conv.status === "open") return res.status(400).json({ error: "Conversation is already open" });
      await (await getDb().prepare(`UPDATE consultation_conversations SET status = 'open', updated_at = CURRENT_TIMESTAMP WHERE id = ?`)).run(id);
      await logAudit?.(adminId, "CONSULTATION_REOPEN", String(id), `Reopened consultation ${id} for user ${conv.user_id}`);
      broadcast?.({ type: "CONSULTATION_CONVERSATION_REOPENED", conversationId: id });
      try {
        await consultationNotify?.onConsultationReopenedByAdmin?.(Number(conv.user_id), id);
      } catch (_) {}
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed" });
    }
  });

  app.post("/api/admin/consultation/conversations/:id/unlock-purchase", gate, consultationMutatePostLimiter, async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const adminId = (req as any).userId as number;
    const finalRaw = req.body?.final_valuation_eur;
    const finalValuation = finalRaw != null && String(finalRaw).trim() !== "" ? Number(finalRaw) : null;
    if (!id) return res.status(400).json({ error: "Invalid id" });
    try {
      const conv = await loadConversation(id);
      if (!conv) return res.status(404).json({ error: "Not found" });
      const mid = conv.masterpiece_id != null ? Number(conv.masterpiece_id) : NaN;
      if (!mid || Number.isNaN(mid)) return res.status(400).json({ error: "Conversation has no linked masterpiece" });
      const piece = (await (await getDb().prepare("SELECT * FROM masterpieces WHERE id = ?")).get(mid)) as Record<string, unknown> | undefined;
      if (!piece) return res.status(404).json({ error: "Masterpiece not found" });
      if (Number((piece as { consultation_required?: number }).consultation_required) !== 1) {
        return res.status(400).json({
          error: "This piece is not marked as consultation-only (Erwerb nur nach Concierge).",
          code: "NOT_CONSULTATION_REQUIRED_PIECE",
        });
      }
      if (finalValuation != null && Number.isFinite(finalValuation) && finalValuation > 0) {
        await (await getDb().prepare("UPDATE masterpieces SET valuation = ? WHERE id = ?")).run(finalValuation, mid);
      }
      await (await getDb().prepare("UPDATE consultation_conversations SET purchase_unlocked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?")).run(id);
      await logAudit?.(adminId, "CONSULTATION_UNLOCK_PURCHASE", String(id), `Unlocked purchase for conversation ${id}, masterpiece ${mid}`);
      broadcast?.({
        type: "CONSULTATION_PURCHASE_UNLOCKED",
        conversationId: id,
        masterpieceId: mid,
        userId: Number(conv.user_id),
      });
      try {
        await consultationNotify?.onPurchaseUnlockedForClient?.(Number(conv.user_id), id);
      } catch (_) {}
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed" });
    }
  });

  app.post("/api/admin/consultation/conversations/:id/contract-message", gate, consultationMutatePostLimiter, async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const adminId = (req as any).userId as number;
    let title = req.body?.title != null ? String(req.body.title).trim().slice(0, 500) : "";
    let description = req.body?.description != null ? String(req.body.description).trim().slice(0, 20000) : "";
    const fileUrlRaw = req.body?.file_url != null ? String(req.body.file_url).trim().slice(0, 2000) : "";
    const proposalIdRaw = req.body?.proposal_id != null ? Number(req.body.proposal_id) : NaN;
    if (!id) return res.status(400).json({ error: "Invalid id" });
    if (!fileUrlRaw) return res.status(400).json({ error: "file_url required (PDF URL)" });
    const okUrl =
      fileUrlRaw.startsWith("https://") || fileUrlRaw.startsWith("http://") || fileUrlRaw.startsWith("/");
    if (!okUrl) return res.status(400).json({ error: "file_url must be http(s) or a path starting with /" });
    try {
      const conv = await loadConversation(id);
      if (!conv) return res.status(404).json({ error: "Not found" });
      if (conv.status !== "open") return res.status(400).json({ error: "Conversation is closed" });
      const existingContract = (await (
        await getDb().prepare(
          `SELECT id FROM consultation_messages WHERE conversation_id = ? AND COALESCE(message_type, 'text') = 'contract' LIMIT 1`
        )
      ).get(id)) as { id?: number } | undefined;
      if (existingContract?.id) {
        return res.status(400).json({ error: "A contract was already sent in this thread", code: "CONTRACT_ALREADY_SENT" });
      }

      let sourceProposalId: number | null = null;
      let contractAmountEur: number | null = null;
      if (proposalIdRaw && !Number.isNaN(proposalIdRaw)) {
        const prop = (await (await getDb().prepare(`SELECT * FROM consultation_proposals WHERE id = ?`)).get(proposalIdRaw)) as
          | Record<string, any>
          | undefined;
        if (!prop || Number(prop.conversation_id) !== id) {
          return res.status(400).json({ error: "proposal_id does not belong to this conversation" });
        }
        if (String(prop.status) !== "accepted") {
          return res.status(400).json({ error: "Proposal must be accepted by the client before sending the contract", code: "PROPOSAL_NOT_ACCEPTED" });
        }
        sourceProposalId = proposalIdRaw;
        if (prop.amount_eur != null && Number(prop.amount_eur) > 0) {
          contractAmountEur = Number(prop.amount_eur);
        }
        if (!title && prop.title) title = String(prop.title).slice(0, 500);
        const propDesc = prop.description != null ? String(prop.description).trim() : "";
        const cur = description.trim();
        const amountLine =
          contractAmountEur != null
            ? `\n\n—\nVereinbarter Gesamtpreis / Agreed total: ${contractAmountEur.toLocaleString("de-DE")} ${String(prop.currency || "EUR")}`
            : "";
        if (!cur && propDesc) description = (propDesc + amountLine).slice(0, 20000);
        else if (cur && contractAmountEur != null && !cur.includes("Vereinbarter Gesamtpreis") && !cur.includes("Agreed total")) {
          description = (cur + amountLine).slice(0, 20000);
        }
      }
      if (!title) return res.status(400).json({ error: "title required (or pass proposal_id of an accepted offer)" });

      const bodyPreview = (description || title).slice(0, 20000);
      const r = await (
        await getDb().prepare(
          `INSERT INTO consultation_messages
           (conversation_id, sender_id, body, message_type, contract_title, contract_description, contract_file_url, contract_status, contract_amount_eur, source_proposal_id)
           VALUES (?, ?, ?, 'contract', ?, ?, ?, 'sent', ?, ?)`
        )
      ).run(
        id,
        adminId,
        bodyPreview,
        title,
        description || null,
        fileUrlRaw,
        contractAmountEur,
        sourceProposalId
      );
      await (await getDb().prepare(`UPDATE consultation_conversations SET workflow_status = 'finalized', updated_at = CURRENT_TIMESTAMP WHERE id = ?`)).run(
        id
      );
      const msg = await (await getDb().prepare(`SELECT * FROM consultation_messages WHERE id = ?`)).get(Number(r.lastInsertRowid));
      await logAudit?.(adminId, "CONSULTATION_CONTRACT_MESSAGE", String(id), `Contract message in consultation ${id}`);
      broadcast?.({ type: "CONSULTATION_CONTRACT_SENT", conversationId: id, messageId: r.lastInsertRowid });
      try {
        await consultationNotify?.onAdminRepliedToClient?.(Number(conv.user_id), id);
      } catch (_) {}
      res.json(msg);
    } catch (e: any) {
      console.error("[admin/consultation/contract-message]", e);
      res.status(500).json({ error: e?.message || "Failed" });
    }
  });
}
