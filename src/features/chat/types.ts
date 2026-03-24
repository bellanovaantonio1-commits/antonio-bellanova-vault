/** Isolated types for the optional consultation chat layer (not wired to legacy chat_threads). */
export type ConsultationConversationRow = {
  id: number;
  user_id: number;
  masterpiece_id: number | null;
  status: string;
  subject: string | null;
  created_at?: string;
  updated_at?: string;
  masterpiece_title?: string | null;
  client_name?: string | null;
  client_email?: string | null;
  purchase_unlocked_at?: string | null;
  /** open | in_progress | finalized (consultation workflow; thread open/closed is `status`) */
  workflow_status?: string | null;
  deposit_paid_at?: string | null;
  deposit_stripe_payment_intent_id?: string | null;
  masterpiece_status?: string | null;
  masterpiece_consultation_required?: number | null;
  masterpiece_made_to_order?: number | null;
  /** consultation_open | specification_in_progress | contract_sent | contract_accepted | deposit_pending | in_production */
  consultation_workflow_phase?: string | null;
};

export type ConsultationMessageRow = {
  id: number;
  conversation_id: number;
  sender_id: number;
  body: string;
  created_at?: string;
  /** text | contract | file | system | verification_document */
  message_type?: string | null;
  contract_title?: string | null;
  contract_description?: string | null;
  contract_file_url?: string | null;
  /** sent | accepted */
  contract_status?: string | null;
  /** Agreed total from linked consultation proposal (EUR), not marketplace list price */
  contract_amount_eur?: number | null;
  source_proposal_id?: number | null;
  /** contract | certificate | verification | general | verification_request | verification_status */
  file_kind?: string | null;
};

export type VerificationDocumentRow = {
  id: number;
  user_id: number;
  conversation_id: number;
  type: "id" | "selfie" | "address" | "funds";
  file_url: string;
  status: "pending" | "verified" | "rejected";
  created_at?: string;
};
