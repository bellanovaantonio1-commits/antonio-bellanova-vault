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
};

export type ConsultationMessageRow = {
  id: number;
  conversation_id: number;
  sender_id: number;
  body: string;
  created_at?: string;
};
