import express, { type Express, type Request, type Response } from "express";
import Stripe from "stripe";
import type { DbInterface } from "../../lib/db.js";

export type StripeWebhookSendMail = (to: string, subject: string, text: string, html?: string) => Promise<boolean>;

export type StripeWebhookDeps = {
  getStripe: () => Stripe;
  getDb: () => DbInterface;
  /** Wired after `sendMail` is defined in server.ts (module init order). */
  getSendMail: () => StripeWebhookSendMail | null;
};

/**
 * Idempotent wallet credit for a succeeded PaymentIntent (same rules as legacy webhook wallet branch).
 */
export async function creditWalletFromSucceededPaymentIntent(
  db: DbInterface,
  paymentIntent: Stripe.PaymentIntent
): Promise<"credited" | "duplicate" | "skipped"> {
  const amountCents = paymentIntent.amount ?? 0;
  const metadata = paymentIntent.metadata || {};
  const paymentType = metadata.payment_type;
  const userIdRaw = metadata.user_id ?? metadata.userId;
  const userId = userIdRaw != null ? Number(userIdRaw) : null;

  if (paymentType === "invoice" && metadata.invoice_id) return "skipped";
  if (paymentType === "purchase" && userId && metadata.masterpiece_id) return "skipped";
  if (paymentType === "order_deposit" || paymentType === "order_final") return "skipped";
  if (!(paymentType === "wallet" || !paymentType)) return "skipped";
  if (!userId || amountCents <= 0) return "skipped";

  const piId = paymentIntent.id;
  const insertSql = db.isMySQL
    ? "INSERT IGNORE INTO stripe_wallet_credits (stripe_payment_intent_id, user_id, amount_cents) VALUES (?, ?, ?)"
    : "INSERT OR IGNORE INTO stripe_wallet_credits (stripe_payment_intent_id, user_id, amount_cents) VALUES (?, ?, ?)";
  let didCredit = false;
  await db.transaction(async (tx) => {
    const ins = await (await tx.prepare(insertSql)).run(piId, userId, amountCents);
    if (!ins.changes) {
      console.log("[Wallet] Duplicate ignored: payment_intent=" + piId);
      return;
    }
    const insertTxnSql = db.isMySQL
      ? "INSERT INTO transactions (user_id, invoice_id, amount, status, `type`, stripe_payment_intent_id) VALUES (?, NULL, ?, 'PAID', 'deposit', ?)"
      : "INSERT INTO transactions (user_id, invoice_id, amount, status, type, stripe_payment_intent_id) VALUES (?, NULL, ?, 'PAID', 'deposit', ?)";
    await (await tx.prepare(insertTxnSql)).run(userId, amountCents, piId);
    await (await tx.prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?")).run(amountCents, userId);
    didCredit = true;
    const amountEur = amountCents / 100;
    console.log("Payment success", { kind: "wallet_deposit", userId, amountCents, amountEur, pi: piId });
    console.log("User balance updated", { userId, deltaCents: amountCents, pi: piId });
  });
  return didCredit ? "credited" : "duplicate";
}

/**
 * POST /api/stripe/webhook — raw body required for Stripe signature verification.
 * Register this before `express.json()` in server.ts.
 */
export function registerStripeWebhookRawRoute(app: Express, deps: StripeWebhookDeps): void {
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req: Request, res: Response) => {
    const stripeSecret = String(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET || "").trim();
    const webhookSecret = String(process.env.STRIPE_WEBHOOK_SECRET || "").trim();
    if (!stripeSecret || !webhookSecret) {
      console.warn("[Stripe] Webhook: STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET not set");
      return res.status(500).send("Webhook not configured");
    }
    const sig = req.headers["stripe-signature"] as string | undefined;
    const rawBody = req.body as Buffer | undefined;
    if (!sig || !rawBody) return res.status(400).send("Missing signature or body");
    let event: Stripe.Event;
    try {
      const stripe = deps.getStripe();
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err: any) {
      console.error("[Stripe] Webhook signature verification failed:", err?.message);
      return res.status(400).send(`Webhook Error: ${err?.message || "Invalid signature"}`);
    }

    console.log("Webhook received", event.type, event.id);

    const db = deps.getDb();

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const amountCents = paymentIntent.amount ?? 0;
      const metadata = paymentIntent.metadata || {};
      const paymentType = metadata.payment_type;
      const invoiceId = metadata.invoice_id ? Number(metadata.invoice_id) : null;
      const userIdRaw = metadata.user_id ?? metadata.userId;
      const userId = userIdRaw != null ? Number(userIdRaw) : null;
      const masterpieceId = metadata.masterpiece_id ? Number(metadata.masterpiece_id) : null;

      if (paymentType === "invoice" && invoiceId && db) {
        try {
          const inv = await (await db.prepare("SELECT id, user_id, amount, status FROM invoices WHERE id = ?")).get(invoiceId) as
            | { id: number; user_id: number; amount: number; status: string }
            | undefined;
          if (!inv || (inv.status !== "pending" && inv.status !== "awaiting_payment")) {
            console.log("[Invoice] Payment ignored: invoice_id=" + invoiceId + " status=" + inv?.status);
          } else if (amountCents > 0 && Number(inv.amount) === amountCents) {
            await db.transaction(async (tx) => {
              await (await tx.prepare("UPDATE invoices SET status = 'paid' WHERE id = ?")).run(invoiceId);
              await (await tx.prepare(
                "INSERT INTO transactions (user_id, invoice_id, amount, status, stripe_payment_intent_id) VALUES (?, ?, ?, 'PAID', ?)"
              )).run(inv.user_id, invoiceId, amountCents, paymentIntent.id);
            });
            console.log("[Invoice] Payment success: invoice_id=" + invoiceId + " amount_cents=" + amountCents + " (status=paid, transaction recorded)");
            const userRow = await (await db.prepare("SELECT email, name FROM users WHERE id = ?")).get(inv.user_id) as
              | { email?: string; name?: string }
              | undefined;
            const sendMail = deps.getSendMail();
            if (userRow?.email && sendMail) {
              const subject = "Payment received – Antonio Bellanova";
              const text = `Dear ${userRow.name || "Customer"},\n\nWe have received your payment.\n\nInvoice: #${invoiceId}\nAmount: ${(amountCents / 100).toFixed(2)} EUR\nDate: ${new Date().toLocaleDateString("de-DE")}\n\nThank you for your trust.\n\nAntonio Bellanova`;
              await sendMail(userRow.email.trim(), subject, text).catch((e) =>
                console.error("[Invoice] Payment confirmation email failed:", (e as any)?.message)
              );
            }
          } else {
            console.warn("[Invoice] Amount mismatch: invoice_id=" + invoiceId + " expected=" + inv.amount + " received=" + amountCents);
          }
        } catch (e) {
          console.error("[Stripe] Webhook: failed to update invoice:", e);
          return res.status(500).send("Failed to update invoice");
        }
      } else if (paymentType === "purchase" && userId && masterpieceId && amountCents > 0 && db) {
        try {
          const existing = await (await db.prepare("SELECT id FROM orders WHERE stripe_payment_intent_id = ?")).get(paymentIntent.id) as
            | { id: number }
            | undefined;
          if (existing) {
            console.log("[Purchase] Order already recorded: order_id=" + existing.id);
          } else {
            await db.transaction(async (tx) => {
              await (await tx.prepare(
                "INSERT INTO orders (user_id, masterpiece_id, amount, status, stripe_payment_intent_id) VALUES (?, ?, ?, 'paid', ?)"
              )).run(userId, masterpieceId, amountCents, paymentIntent.id);
              await (await tx.prepare("UPDATE masterpieces SET current_owner_id = ?, status = 'sold' WHERE id = ?")).run(userId, masterpieceId);
              await (await tx.prepare("INSERT INTO payments (user_id, masterpiece_id, type, amount, status) VALUES (?, ?, 'full', ?, 'paid')")).run(
                userId,
                masterpieceId,
                amountCents / 100
              );
            });
            console.log("[Purchase] Order created: user_id=" + userId + " masterpiece_id=" + masterpieceId + " amount_cents=" + amountCents);
          }
        } catch (e) {
          console.error("[Stripe] Webhook: failed to create order:", e);
          return res.status(500).send("Failed to create order");
        }
      } else if ((paymentType === "order_deposit" || paymentType === "order_final") && db) {
        const paymentId = metadata.payment_id ? Number(metadata.payment_id) : null;
        if (!paymentId) {
          console.log("[Order Payment] Webhook: missing payment_id in metadata");
        } else {
          try {
            const pay = await (await db.prepare("SELECT id, user_id, masterpiece_id, type, amount, status FROM payments WHERE id = ?")).get(paymentId) as
              | { id: number; user_id: number; amount: number; status: string }
              | undefined;
            const expectedCents = pay ? Math.round(Number(pay.amount) * 100) : 0;
            if (!pay || (pay.status !== "pending" && pay.status !== "awaiting_deposit" && pay.status !== "awaiting_payment")) {
              console.log("[Order Payment] Ignored: payment_id=" + paymentId + " status=" + pay?.status);
            } else if (amountCents > 0 && expectedCents > 0 && amountCents === expectedCents) {
              await (await db.prepare("UPDATE payments SET status = 'paid', stripe_payment_intent_id = ? WHERE id = ?")).run(paymentIntent.id, paymentId);
              console.log("[Order Payment] Success: payment_id=" + paymentId + " type=" + paymentType + " amount_cents=" + amountCents);
            } else {
              console.warn("[Order Payment] Amount mismatch: payment_id=" + paymentId + " expected_cents=" + expectedCents + " received=" + amountCents);
            }
          } catch (e) {
            console.error("[Stripe] Webhook: failed to update order payment:", e);
            return res.status(500).send("Failed to update payment");
          }
        }
      } else if (paymentType === "wallet" || !paymentType) {
        if (userId && amountCents > 0 && db) {
          try {
            const result = await creditWalletFromSucceededPaymentIntent(db, paymentIntent);
            console.log("[Wallet] Webhook credit result=" + result + " pi=" + paymentIntent.id);
          } catch (e) {
            console.error("[Stripe] Webhook: failed to update wallet_balance:", e);
            return res.status(500).send("Failed to credit wallet");
          }
        }
      }
    }

    res.json({ received: true });
  });
}
