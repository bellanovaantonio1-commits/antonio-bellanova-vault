export enum UserRole {
  ADMIN = 'admin',
  CLIENT = 'client',
  VIP = 'vip',
  ROYAL = 'royal',
  BLACK = 'black',
  RESELLER = 'reseller',
  INVESTOR = 'investor',
  VIEWER = 'viewer',
  STRATEGIC_PRIVATE_ADVISOR = 'strategic_private_advisor'
}

/** Prestige tier for client loyalty (display + commission + access). */
export type PrestigeTier =
  | 'client'
  | 'private_client'
  | 'collector'
  | 'elite_collector'
  | 'royal_tier'
  | 'black_tier';

/** White-glove delivery option at checkout. */
export type DeliveryOption =
  | 'insured_global_shipping'
  | 'armored_courier'
  | 'personal_delivery_founder'
  | 'private_viewing_appointment'
  | 'vault_storage';

export enum UserStatus {
  PENDING = 'pending',
  APPROVED = 'approved'
}

export interface User {
  id: number;
  email: string;
  username?: string;
  name: string;
  address: string;
  role: UserRole;
  status: UserStatus;
  language: string;
  is_vip: number;
  created_at: string;
}

export interface Masterpiece {
  id: number;
  serial_id: string;
  title: string;
  description: string;
  materials: string;
  gemstones: string;
  valuation: number;
  rarity: string;
  deposit_pct: number;
  image_url: string;
  current_owner_id: number | null;
  status: 'available' | 'reserved' | 'sold' | 'auction' | 'resell_pending' | 'resale_review' | 'fractional_open' | 'fractional_full' | 'fractional_resale' | 'private_viewing' | 'archived_private_collection';
  blockchain_hash: string;
  nft_token_id: string | null;
  created_at: string;
  transfer_type?: 'platform' | 'external';
  warranty_void?: number;
  hide_price?: number;
  pricing_mode?: 'fixed' | 'starting_from' | 'price_on_request' | 'hidden';
  price_visibility_rules?: string;
  image_urls?: string;
}

export interface Auction {
  id: number;
  masterpiece_id: number;
  title: string;
  image_url: string;
  description: string;
  start_price: number;
  current_bid: number;
  highest_bidder_id: number | null;
  end_time: string;
  status: 'active' | 'ended';
  vip_only: number;
  terms?: string;
}

export interface Payment {
  id: number;
  user_id: number;
  masterpiece_id: number;
  type: 'deposit' | 'full';
  amount: number;
  status: 'pending' | 'paid' | 'rejected';
  iban: string;
  reference: string;
  created_at: string;
}

export interface Contract {
  id: number;
  user_id: number;
  masterpiece_id: number | null;
  type: 'purchase' | 'deposit' | 'invoice' | 'vip' | 'resale' | 'certificate';
  doc_ref: string;
  content: string;
  signed_at: string | null;
  status: 'draft' | 'signed' | 'archived';
  version: number;
  parent_id: number | null;
  metadata?: string; // JSON string
  created_at: string;
}

export interface EscrowTransaction {
  id: number;
  masterpiece_id: number;
  buyer_id: number;
  seller_id: number;
  amount: number;
  status: 'HELD' | 'RELEASED' | 'DISPUTED' | 'REFUNDED';
  dispute_window_ends: string;
  milestones: string; // JSON string
  created_at: string;
}

export interface Certificate {
  id: number;
  masterpiece_id: number;
  owner_id: number;
  cert_id: string;
  qr_code: string;
  signature: string;
  blockchain_hash: string;
  created_at: string;
  content?: string;
}

export interface Bid {
  id: number;
  auction_id: number;
  user_id: number;
  bidder_name: string;
  amount: number;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  message: string;
  type: 'info' | 'success' | 'warning';
  is_read: number;
  created_at: string;
}

export interface PurchaseWorkflow {
  id: number;
  masterpiece_id: number;
  user_id: number;
  status: string;
  approved_at: string | null;
  approved_by: number | null;
  deposit_received_at: string | null;
  production_started_at: string | null;
  production_finished_at: string | null;
  ready_for_delivery_at: string | null;
  final_payment_pending_at: string | null;
  completed_at: string | null;
  delivery_option: DeliveryOption | null;
  created_at: string;
}

export interface ProductionProgress {
  id: number;
  masterpiece_id: number;
  step_name: string;
  status: 'pending' | 'completed';
  timestamp: string | null;
  notes: string | null;
  media_url: string | null;
  staff_id: number | null;
  sequence_index: number;
}

export interface ProvenanceEvent {
  id: number;
  masterpiece_id: number;
  event_type: 'creation' | 'exhibition' | 'service' | 'ownership_transfer' | 'auction' | 'certificate' | 'vip_event';
  description: string;
  event_date: string;
  metadata?: string;
  created_at: string;
}

export interface ServiceRecord {
  id: number;
  masterpiece_id: number;
  service_type: 'repair' | 'cleaning' | 'restoration' | 'stone_replacement' | 'other';
  description: string;
  cost: number;
  service_date: string;
  provider: string;
  created_at: string;
}

export interface WaitlistEntry {
  id: number;
  masterpiece_id: number | null;
  user_id: number;
  request_type: 'waitlist' | 'commission';
  status: 'pending' | 'notified' | 'converted' | 'cancelled';
  created_at: string;
}

export interface Reservation {
  id: number;
  masterpiece_id: number;
  user_id: number;
  expires_at: string;
  type: 'vip' | 'client';
  status: 'active' | 'expired' | 'converted';
  created_at: string;
}

export interface CollectorProfile {
  id: number;
  user_id: number;
  bio: string;
  visibility: 'public' | 'private';
  metadata?: string;
  created_at: string;
}

export interface ConciergeRequest {
  id: number;
  user_id: number;
  masterpiece_id?: number;
  request_type: 'cleaning' | 'repair' | 'restoration' | 'resizing' | 'valuation_update' | 'secure_transport' | 'private_showing' | 'insurance_assistance';
  message: string;
  status: 'requested' | 'scheduled' | 'in_service' | 'completed' | 'cancelled';
  assigned_admin_id?: number;
  priority: 'standard' | 'vip';
  created_at: string;
}

export interface ConciergeMessage {
  id: number;
  request_id: number;
  sender_id: number;
  message: string;
  created_at: string;
}

export interface FractionalShare {
  id: number;
  masterpiece_id: number;
  owner_id: number;
  percentage: number;
  created_at: string;
}

export interface FractionalTransfer {
  id: number;
  masterpiece_id: number;
  from_owner_id: number;
  to_owner_id: number;
  percentage: number;
  price: number;
  created_at: string;
}

export interface RevenueRecord {
  id: number;
  type: 'resale_fee' | 'concierge_fee' | 'membership' | 'auction_commission' | 'fractional_fee' | 'subscription' | 'referral';
  amount: number;
  user_id: number;
  masterpiece_id?: number;
  reference_id?: string;
  created_at: string;
}

export interface InvestorAnalytics {
  platform_valuation: number;
  pieces_sold: number;
  appreciation_metrics: {
    avg_appreciation: number;
    top_performing_category: string;
  };
  auction_performance: {
    total_bids: number;
    avg_bid_increase: number;
  };
  rarity_distribution: Record<string, number>;
  liquidity_forecast: number;
  scarcity_index: number;
}

export interface InvestorRequest {
  id: number;
  user_id: number;
  type: 'allocation' | 'meeting' | 'preview' | 'dataroom' | 'share';
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  masterpiece_id?: number | null;
  request_metadata?: string | null;
  masterpiece_title?: string;
  masterpiece_serial?: string;
  created_at: string;
}

export interface FractionalOffer {
  id: number;
  masterpiece_id: number;
  title: string;
  serial_id: string;
  valuation: number;
  status: string;
  image_url?: string;
  available_pct: number;
  price_per_pct: number | null;
}

export interface InvestorViewLog {
  id: number;
  user_id: number;
  masterpiece_id: number;
  interest_level: number;
  created_at: string;
}

// Luxury Communication System
export type ChatThreadType = 'concierge' | 'asset' | 'investor_hub' | 'auction_live' | 'black_direct' | 'vault';

export interface ChatThread {
  id: number;
  type: ChatThreadType;
  status: string;
  priority: number;
  user_id: number | null;
  masterpiece_id: number | null;
  auction_id: number | null;
  pool_id: number | null;
  assigned_admin_id: number | null;
  first_response_at: string | null;
  created_at: string;
  updated_at: string;
  masterpiece_title?: string;
  serial_id?: string;
}

export interface ChatMessage {
  id: number;
  thread_id: number;
  sender_id: number;
  content: string;
  content_lang: string | null;
  asset_ref: string | null;
  is_system: number;
  is_moderated: number;
  created_at: string;
}

export interface ConciergeAvailability {
  id: number;
  admin_id: number;
  status: 'available' | 'busy' | 'away';
  updated_at: string;
}

export interface Appointment {
  id: number;
  request_id: number | null;
  admin_id: number;
  user_id: number;
  scheduled_at: string;
  title: string | null;
  notes: string | null;
  status: 'proposed' | 'confirmed' | 'cancelled';
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  admin_name?: string;
}

export interface VaultRequest {
  id: number;
  user_id: number;
  masterpiece_id: number;
  request_type: 'audit' | 'insurance_update' | 'transfer' | 'withdrawal';
  status: string;
  thread_id: number | null;
  details: string | null;
  created_at: string;
}

export interface LoginHistoryEntry {
  id: number;
  ip_address: string | null;
  user_agent: string | null;
  success: number;
  created_at: string;
}

// --- Strategic Private Advisor ---
export type AdvisorStatus = 'pending_nda' | 'pending_approval' | 'active' | 'suspended';
export type AdvisorCommissionStatus = 'pending' | 'confirmed' | 'paid_out';
export type AdvisorContractType = 'nda' | 'advisor_agreement' | 'commission_agreement';

export interface AdvisorProfile {
  id: number;
  user_id: number;
  status: AdvisorStatus;
  default_commission_pct: number;
  nda_signed_at: string | null;
  activated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdvisorReferral {
  id: number;
  advisor_id: number;
  user_id: number;
  created_at: string;
}

export interface AdvisorCommission {
  id: number;
  advisor_id: number;
  payment_id: number;
  masterpiece_id: number;
  client_id: number;
  sale_amount: number;
  commission_pct: number;
  commission_amount: number;
  status: AdvisorCommissionStatus;
  paid_out_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdvisorContract {
  id: number;
  advisor_id: number;
  type: AdvisorContractType;
  doc_ref: string;
  content: string;
  signed_at: string | null;
  status: 'draft' | 'signed' | 'archived';
  created_at: string;
}

// --- Imperial Core: Prestige, Drops, Private Viewing, Negotiation ---

export interface PrestigeTierMetrics {
  user_id: number;
  total_spent: number;
  holding_duration_days: number;
  resale_participation_count: number;
  investment_participation_count: number;
  updated_at: string;
}

export interface Drop {
  id: number;
  title: string;
  description: string;
  image_url: string | null;
  release_at: string;
  end_at: string;
  tier_access: string; // JSON array of PrestigeTier
  status: 'upcoming' | 'live' | 'ended';
  created_at: string;
  updated_at: string;
}

export interface DropPiece {
  id: number;
  drop_id: number;
  masterpiece_id: number;
  created_at: string;
}

export interface PrivateViewingSlot {
  id: number;
  masterpiece_id: number;
  expires_at: string;
  created_by: number;
  status: 'active' | 'expired' | 'archived';
  created_at: string;
}

export interface PrivateViewingAllowlist {
  id: number;
  slot_id: number;
  user_id: number;
  created_at: string;
}

export interface PrivateTermsRequest {
  id: number;
  user_id: number;
  masterpiece_id: number;
  status: 'pending' | 'responded' | 'accepted' | 'rejected';
  admin_notes: string | null;
  responded_at: string | null;
  created_at: string;
}
