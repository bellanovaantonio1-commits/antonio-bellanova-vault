import React, { useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";

export type ConsultationStripeDepositFormProps = {
  conversationId: number;
  amountCents: number;
  onPaid: () => void;
  onCancel: () => void;
  labels?: Partial<{
    heading: string;
    pay: string;
    cancel: string;
    loading: string;
  }>;
};

/**
 * Stripe Elements payment for consultation deposit (after in-chat contract accepted).
 */
export function ConsultationStripeDepositForm({
  conversationId,
  amountCents,
  onPaid,
  onCancel,
  labels = {},
}: ConsultationStripeDepositFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const l = {
    heading: "Pay deposit",
    pay: "Pay now",
    cancel: "Cancel",
    loading: "…",
    ...labels,
  };
  const eur = (amountCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="rounded-2xl border border-amber-600/35 bg-gradient-to-b from-amber-950/40 to-zinc-950/80 p-4 space-y-3">
      <p className="text-[10px] uppercase tracking-widest text-amber-500/90">{l.heading}</p>
      <p className="text-lg font-semibold text-amber-100/95 tabular-nums">{eur} EUR</p>
      <PaymentElement options={{ layout: "tabs" }} />
      {err && <p className="text-xs text-red-400">{err}</p>}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 min-h-[44px] rounded-full text-xs font-medium border border-zinc-600 text-zinc-300 hover:bg-zinc-800/80"
        >
          {l.cancel}
        </button>
        <button
          type="button"
          disabled={!stripe || !elements || busy}
          onClick={async () => {
            if (!stripe || !elements) return;
            setErr(null);
            setBusy(true);
            try {
              const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                redirect: "if_required",
              });
              if (error) {
                setErr(error.message || "Payment failed");
                return;
              }
              const piId = paymentIntent?.id;
              if (paymentIntent?.status === "succeeded" && piId) {
                await fetch(`/api/consultation/conversations/${conversationId}/confirm-deposit`, {
                  method: "POST",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ payment_intent: piId }),
                });
                onPaid();
              }
            } finally {
              setBusy(false);
            }
          }}
          className="flex-1 min-h-[44px] rounded-full text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-zinc-950 disabled:opacity-50"
        >
          {busy ? l.loading : l.pay}
        </button>
      </div>
    </div>
  );
}
