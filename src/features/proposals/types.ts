/** Proposal records linked only to consultation conversations. */
export type ConsultationProposalRow = {
  id: number;
  conversation_id: number;
  title: string | null;
  description: string | null;
  amount_eur: number | null;
  currency: string | null;
  status: string;
  metadata: string | null;
  created_by: number;
  created_at?: string;
  updated_at?: string;
  accepted_at?: string | null;
};
