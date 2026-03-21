/**
 * Optional made-to-order consultation API (conversations, messages, proposals).
 * Gated by ENABLE_CONSULTATION_FLOW — does not alter existing purchase/payment flows.
 */
import type { Application, Request, Response } from "express";
import type { DbInterface } from "../../lib/db.js";

export function isConsultationFlowEnabled(): boolean {
  const v = String(process.env.ENABLE_CONSULTATION_FLOW ?? "").trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

function disabled(res: Response) {
  return res.status(503).json({ error: "Consultation flow is disabled", code: "CONSULTATION_DISABLED" });
}

function isAdminUser(user: { role?: string } | null | undefined): boolean {
  return user?.role === "admin" || user?.role === "super_admin";
}

type ConsultationDeps = {
  db: DbInterface;
  broadcast?: (data: Record<string, unknown>) => void;
  logAudit?: (adminId: number, action: string, targetId: string, details: string) => Promise<void> | void;
};

export function registerConsultationRoutes(app: Application, deps: ConsultationDeps): void {
  const { db, broadcast, logAudit } = deps;

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
        await db.prepare(
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

  app.get("/api/admin/consultation/conversations", gate, async (_req: Request, res: Response) => {
    try {
      const rows = await (
        await db.prepare(
          `SELECT c.*, u.name AS client_name, u.email AS client_email,
            m.title AS masterpiece_title
           FROM consultation_conversations c
           LEFT JOIN users u ON u.id = c.user_id
           LEFT JOIN masterpieces m ON m.id = c.masterpiece_id
           ORDER BY c.updated_at DESC LIMIT 200`
        )
      ).all();
      res.json(rows);
    } catch (e: any) {
      console.error("[admin/consultation/conversations]", e);
      res.status(500).json({ error: e?.message || "Failed to list conversations" });
    }
  });

  app.post("/api/consultation/conversations", gate, async (req: Request, res: Response) => {
    const userId = (req as any).userId as number;
    const user = (req as any).user;
    if (user?.role === "guest") return res.status(403).json({ error: "Account required", code: "GUEST_RESTRICTED" });
    if (isAdminUser(user)) return res.status(403).json({ error: "Admins use admin consultation endpoints" });
    const masterpiece_id = req.body?.masterpiece_id != null ? Number(req.body.masterpiece_id) : null;
    const subject = req.body?.subject != null ? String(req.body.subject).slice(0, 500) : null;
    try {
      if (masterpiece_id) {
        const existing = (await (
          await db.prepare(
            `SELECT * FROM consultation_conversations
             WHERE user_id = ? AND masterpiece_id = ? AND status = 'open' ORDER BY id DESC LIMIT 1`
          )
        ).get(userId, masterpiece_id)) as Record<string, unknown> | undefined;
        if (existing) return res.json(existing);
      }
      const r = await (
        await db.prepare(
          `INSERT INTO consultation_conversations (user_id, masterpiece_id, status, subject)
           VALUES (?, ?, 'open', ?)`
        )
      ).run(userId, masterpiece_id, subject);
      const id = Number(r.lastInsertRowid);
      const row = await (await db.prepare(`SELECT * FROM consultation_conversations WHERE id = ?`)).get(id);
      broadcast?.({ type: "CONSULTATION_CONVERSATION_CREATED", conversationId: id, userId });
      res.json(row);
    } catch (e: any) {
      console.error("[consultation/conversations POST]", e);
      res.status(500).json({ error: e?.message || "Failed to create conversation" });
    }
  });

  async function loadConversation(id: number) {
    return (await (await db.prepare(`SELECT * FROM consultation_conversations WHERE id = ?`)).get(id)) as Record<string, any> | undefined;
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
      const conv = await loadConversation(id);
      if (!conv) return res.status(404).json({ error: "Not found" });
      if (!(await canAccessConversation(conv, req))) return res.status(403).json({ error: "Forbidden" });
      res.json(conv);
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
        await db.prepare(
          `SELECT * FROM consultation_messages WHERE conversation_id = ? ORDER BY created_at ASC`
        )
      ).all(id);
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed" });
    }
  });

  app.post("/api/consultation/conversations/:id/messages", gate, async (req: Request, res: Response) => {
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
        await db.prepare(
          `INSERT INTO consultation_messages (conversation_id, sender_id, body) VALUES (?, ?, ?)`
        )
      ).run(id, userId, body.slice(0, 20000));
      await (await db.prepare(`UPDATE consultation_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`)).run(id);
      const msg = await (await db.prepare(`SELECT * FROM consultation_messages WHERE id = ?`)).get(Number(r.lastInsertRowid));
      broadcast?.({ type: "CONSULTATION_MESSAGE", conversationId: id, messageId: r.lastInsertRowid });
      res.json(msg);
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
        await db.prepare(`SELECT * FROM consultation_proposals WHERE conversation_id = ? ORDER BY id DESC`)
      ).all(id);
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed" });
    }
  });

  app.post("/api/consultation/proposals/:proposalId/accept", gate, async (req: Request, res: Response) => {
    const proposalId = Number(req.params.proposalId);
    const userId = (req as any).userId as number;
    const user = (req as any).user;
    if (user?.role === "guest") return res.status(403).json({ error: "Account required", code: "GUEST_RESTRICTED" });
    if (isAdminUser(user)) return res.status(403).json({ error: "Admins cannot accept on behalf of client" });
    if (!proposalId) return res.status(400).json({ error: "Invalid proposal" });
    try {
      const proposal = (await (await db.prepare(`SELECT * FROM consultation_proposals WHERE id = ?`)).get(proposalId)) as Record<string, any> | undefined;
      if (!proposal) return res.status(404).json({ error: "Proposal not found" });
      if (proposal.status !== "sent") return res.status(400).json({ error: "Proposal cannot be accepted in current state" });
      const conv = await loadConversation(Number(proposal.conversation_id));
      if (!conv || Number(conv.user_id) !== Number(userId)) return res.status(403).json({ error: "Forbidden" });
      await (
        await db.prepare(
          `UPDATE consultation_proposals SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
        )
      ).run(proposalId);
      const updated = await (await db.prepare(`SELECT * FROM consultation_proposals WHERE id = ?`)).get(proposalId);
      broadcast?.({ type: "CONSULTATION_PROPOSAL_ACCEPTED", proposalId, conversationId: proposal.conversation_id });
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed" });
    }
  });

  /**
   * Optional hook after proposal acceptance — does not create payments or contracts.
   * Integrators can listen for this response or use masterpiece_id for existing deposit flows.
   */
  app.post("/api/consultation/proposals/:proposalId/request-deposit", gate, async (req: Request, res: Response) => {
    const proposalId = Number(req.params.proposalId);
    const userId = (req as any).userId as number;
    const user = (req as any).user;
    if (user?.role === "guest") return res.status(403).json({ error: "Account required", code: "GUEST_RESTRICTED" });
    if (!proposalId) return res.status(400).json({ error: "Invalid proposal" });
    try {
      const proposal = (await (await db.prepare(`SELECT * FROM consultation_proposals WHERE id = ?`)).get(proposalId)) as Record<string, any> | undefined;
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
  app.post("/api/admin/consultation/conversations/:id/messages", gate, async (req: Request, res: Response) => {
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
        await db.prepare(
          `INSERT INTO consultation_messages (conversation_id, sender_id, body) VALUES (?, ?, ?)`
        )
      ).run(id, adminId, body.slice(0, 20000));
      await (await db.prepare(`UPDATE consultation_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`)).run(id);
      const msg = await (await db.prepare(`SELECT * FROM consultation_messages WHERE id = ?`)).get(Number(r.lastInsertRowid));
      await logAudit?.(adminId, "CONSULTATION_MESSAGE", String(id), `Admin reply in consultation ${id}`);
      broadcast?.({ type: "CONSULTATION_MESSAGE", conversationId: id, messageId: r.lastInsertRowid, fromAdmin: true });
      res.json(msg);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed" });
    }
  });

  app.post("/api/admin/consultation/proposals", gate, async (req: Request, res: Response) => {
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
      const r = await (
        await db.prepare(
          `INSERT INTO consultation_proposals
           (conversation_id, title, description, amount_eur, currency, status, created_by)
           VALUES (?, ?, ?, ?, ?, 'sent', ?)`
        )
      ).run(conversation_id, title, description, amount_eur, currency, adminId);
      const pid = Number(r.lastInsertRowid);
      const row = await (await db.prepare(`SELECT * FROM consultation_proposals WHERE id = ?`)).get(pid);
      await logAudit?.(adminId, "CONSULTATION_PROPOSAL", String(pid), `Sent proposal "${title}" for conversation ${conversation_id}`);
      broadcast?.({ type: "CONSULTATION_PROPOSAL_SENT", proposalId: pid, conversationId: conversation_id });
      res.json(row);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed" });
    }
  });
}
