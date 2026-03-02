import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import { fileURLToPath } from "url";

const BCRYPT_ROUNDS = 10;
function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, BCRYPT_ROUNDS);
}
function checkPassword(plain: string, stored: string): boolean {
  if (!stored) return false;
  if (stored.startsWith("$2") && stored.length > 20) return bcrypt.compareSync(plain, stored);
  if (plain === stored) return true; // legacy plaintext
  return false;
}
function upgradePasswordIfNeeded(userId: number, plain: string): void {
  const user = db.prepare("SELECT password FROM users WHERE id = ?").get(userId) as { password: string };
  if (!user?.password || user.password.startsWith("$2")) return;
  db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashPassword(plain), userId);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
const PORT = Number(process.env.PORT) || 3000;
const db = new Database(process.env.DATABASE_PATH || "vault.db");

app.use(express.json({ limit: '50mb' }));

// --- Database Initialization ---
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    address TEXT,
    role TEXT DEFAULT 'client', -- admin, client, vip, reseller, investor, seller, gallery, partner, institution
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    language TEXT DEFAULT 'de',
    is_vip INTEGER DEFAULT 0,
    account_type TEXT DEFAULT 'private', -- private, business
    business_data TEXT, -- JSON for company info
    reputation_score INTEGER DEFAULT 100,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS masterpieces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    serial_id TEXT UNIQUE,
    title TEXT,
    category TEXT,
    description TEXT,
    materials TEXT,
    gemstones TEXT,
    valuation REAL,
    rarity TEXT,
    production_time TEXT,
    cert_data TEXT,
    deposit_pct REAL DEFAULT 10,
    image_url TEXT,
    current_owner_id INTEGER,
    status TEXT DEFAULT 'available', -- available, reserved, sold, auction, resell_pending, reserved_vip, reserved_client, listed_private, negotiation, escrow_pending
    rarity_score INTEGER DEFAULT 0,
    blockchain_hash TEXT,
    nft_token_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(current_owner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS ownership_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    masterpiece_id INTEGER,
    owner_id INTEGER,
    acquired_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    price REAL,
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id),
    FOREIGN KEY(owner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS auctions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    masterpiece_id INTEGER,
    start_price REAL,
    current_bid REAL,
    highest_bidder_id INTEGER,
    end_time DATETIME,
    status TEXT DEFAULT 'active', -- active, ended
    vip_only INTEGER DEFAULT 0,
    terms TEXT,
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id),
    FOREIGN KEY(highest_bidder_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS bids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    auction_id INTEGER,
    user_id INTEGER,
    amount REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(auction_id) REFERENCES auctions(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    masterpiece_id INTEGER,
    type TEXT, -- deposit, full
    amount REAL,
    status TEXT DEFAULT 'pending', -- pending, paid, rejected
    iban TEXT,
    reference TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id)
  );

  CREATE TABLE IF NOT EXISTS contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    masterpiece_id INTEGER,
    type TEXT, -- purchase, deposit, invoice, vip, resale, certificate
    doc_ref TEXT UNIQUE,
    content TEXT,
    signed_at DATETIME,
    status TEXT DEFAULT 'draft', -- draft, signed, archived
    version INTEGER DEFAULT 1,
    parent_id INTEGER,
    metadata TEXT, -- JSON for versioning info, client ref, etc.
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id),
    FOREIGN KEY(parent_id) REFERENCES contracts(id)
  );

  CREATE TABLE IF NOT EXISTS escrow_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    masterpiece_id INTEGER,
    buyer_id INTEGER,
    seller_id INTEGER,
    amount REAL,
    status TEXT DEFAULT 'HELD', -- HELD, RELEASED, DISPUTED, REFUNDED
    dispute_window_ends DATETIME,
    milestones TEXT, -- JSON array of timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id),
    FOREIGN KEY(buyer_id) REFERENCES users(id),
    FOREIGN KEY(seller_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    masterpiece_id INTEGER,
    owner_id INTEGER,
    cert_id TEXT UNIQUE,
    content TEXT,
    qr_code TEXT,
    signature TEXT,
    blockchain_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id),
    FOREIGN KEY(owner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS purchase_workflow (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    masterpiece_id INTEGER UNIQUE,
    user_id INTEGER,
    status TEXT DEFAULT 'PENDING_APPROVAL',
    approved_at DATETIME,
    approved_by INTEGER,
    deposit_contract_sent_at DATETIME,
    deposit_paid_at DATETIME,
    production_started_at DATETIME,
    production_finished_at DATETIME,
    ready_for_delivery_at DATETIME,
    final_payment_pending_at DATETIME,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(approved_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    message TEXT,
    type TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER,
    action TEXT,
    target_id TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(admin_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS provenance_timeline (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    masterpiece_id INTEGER,
    event_type TEXT, -- creation, exhibition, service, ownership_transfer, auction, certificate, vip_event
    description TEXT,
    event_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id)
  );

  CREATE TABLE IF NOT EXISTS service_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    masterpiece_id INTEGER,
    service_type TEXT, -- repair, cleaning, restoration, stone_replacement, polishing, inspection, other
    description TEXT,
    cost REAL,
    service_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    provider TEXT,
    attachments TEXT, -- JSON array of image/doc URLs
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id)
  );

  CREATE TABLE IF NOT EXISTS waitlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    masterpiece_id INTEGER,
    user_id INTEGER,
    request_type TEXT, -- waitlist, commission
    preferred_budget REAL,
    preferred_materials TEXT,
    status TEXT DEFAULT 'waiting', -- waiting, contacted, converted, expired
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    masterpiece_id INTEGER,
    user_id INTEGER,
    expires_at DATETIME,
    type TEXT, -- vip, client
    status TEXT DEFAULT 'active', -- active, expired, converted
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS collector_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    bio TEXT,
    visibility TEXT DEFAULT 'private', -- public, private
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS concierge_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    masterpiece_id INTEGER,
    request_type TEXT, -- cleaning, repair, restoration, resizing, valuation_update, secure_transport, private_showing, insurance_assistance
    message TEXT,
    status TEXT DEFAULT 'requested', -- requested, scheduled, in_service, completed, cancelled
    assigned_admin_id INTEGER,
    priority TEXT DEFAULT 'standard', -- standard, vip
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id),
    FOREIGN KEY(assigned_admin_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS concierge_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER,
    sender_id INTEGER,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(request_id) REFERENCES concierge_requests(id),
    FOREIGN KEY(sender_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS fractional_shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    masterpiece_id INTEGER,
    owner_id INTEGER,
    percentage REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id),
    FOREIGN KEY(owner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS fractional_transfers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    masterpiece_id INTEGER,
    from_owner_id INTEGER,
    to_owner_id INTEGER,
    percentage REAL,
    price REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id),
    FOREIGN KEY(from_owner_id) REFERENCES users(id),
    FOREIGN KEY(to_owner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS revenue_ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT, -- resale_fee, concierge_fee, membership, auction_commission, fractional_fee, subscription, referral
    amount REAL,
    user_id INTEGER,
    masterpiece_id INTEGER,
    reference_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id)
  );

  CREATE TABLE IF NOT EXISTS production_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    masterpiece_id INTEGER,
    step_index INTEGER,
    step_name TEXT,
    status TEXT DEFAULT 'pending', -- pending, completed
    timestamp DATETIME,
    notes TEXT,
    media_url TEXT,
    staff_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id),
    FOREIGN KEY(staff_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS delivery_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    masterpiece_id INTEGER UNIQUE,
    courier_name TEXT,
    tracking_number TEXT,
    scheduled_at DATETIME,
    status TEXT DEFAULT 'scheduled', -- scheduled, transit, delivered
    signature_data TEXT,
    delivery_photo_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id)
  );

  CREATE TABLE IF NOT EXISTS atelier_moments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    masterpiece_id INTEGER,
    title TEXT,
    caption TEXT,
    media_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id)
  );

  CREATE TABLE IF NOT EXISTS user_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT, -- investor, seller, partner, reseller
    portfolio_url TEXT,
    budget_range TEXT,
    interests TEXT,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    verification_docs TEXT, -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS crm_interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    admin_id INTEGER,
    type TEXT, -- note, call, meeting, email
    content TEXT,
    priority TEXT DEFAULT 'normal', -- normal, high, urgent
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(admin_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS shipping_orchestration (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    masterpiece_id INTEGER,
    status TEXT DEFAULT 'pending', -- pending, pickup_scheduled, in_transit, customs, delivered
    courier TEXT,
    tracking_number TEXT,
    insurance_value REAL,
    white_glove INTEGER DEFAULT 0,
    custody_log TEXT, -- JSON array of events
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id)
  );

  CREATE TABLE IF NOT EXISTS insurance_policies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    masterpiece_id INTEGER,
    provider TEXT,
    policy_number TEXT,
    coverage_amount REAL,
    premium REAL,
    expires_at DATETIME,
    status TEXT DEFAULT 'active', -- active, expired, pending
    document_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id)
  );

  CREATE TABLE IF NOT EXISTS service_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    masterpiece_id INTEGER,
    type TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id)
  );

  CREATE TABLE IF NOT EXISTS private_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    location TEXT,
    event_date DATETIME,
    min_vip_tier INTEGER DEFAULT 0,
    max_attendees INTEGER,
    status TEXT DEFAULT 'upcoming', -- upcoming, completed, cancelled
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS event_rsvps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER,
    user_id INTEGER,
    status TEXT DEFAULT 'pending', -- pending, confirmed, declined
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(event_id) REFERENCES private_events(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS collaborations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    partner_id INTEGER,
    masterpiece_id INTEGER,
    type TEXT, -- co-creation, limited_edition, press_launch
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(partner_id) REFERENCES users(id),
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id)
  );

  CREATE TABLE IF NOT EXISTS resale_negotiations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    masterpiece_id INTEGER,
    seller_id INTEGER,
    buyer_id INTEGER,
    offered_price REAL,
    platform_fee REAL,
    status TEXT DEFAULT 'negotiation', -- negotiation, accepted, rejected, escrow
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id),
    FOREIGN KEY(seller_id) REFERENCES users(id),
    FOREIGN KEY(buyer_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS private_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    negotiation_id INTEGER,
    sender_id INTEGER,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(negotiation_id) REFERENCES resale_negotiations(id),
    FOREIGN KEY(sender_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS investor_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT, -- allocation, meeting, preview, dataroom, share
    message TEXT,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    masterpiece_id INTEGER,
    request_metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id)
  );
  CREATE TABLE IF NOT EXISTS fractional_availability (
    masterpiece_id INTEGER PRIMARY KEY,
    available_pct REAL NOT NULL DEFAULT 0,
    price_per_pct REAL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id)
  );

  CREATE TABLE IF NOT EXISTS investor_view_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    masterpiece_id INTEGER,
    interest_level INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id)
  );

  -- Luxury Communication System (modular extension)
  CREATE TABLE IF NOT EXISTS chat_threads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    priority INTEGER DEFAULT 1,
    user_id INTEGER,
    masterpiece_id INTEGER,
    auction_id INTEGER,
    pool_id INTEGER,
    assigned_admin_id INTEGER,
    first_response_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id),
    FOREIGN KEY(auction_id) REFERENCES auctions(id),
    FOREIGN KEY(assigned_admin_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    content_lang TEXT,
    asset_ref TEXT,
    is_system INTEGER DEFAULT 0,
    is_moderated INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(thread_id) REFERENCES chat_threads(id),
    FOREIGN KEY(sender_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS concierge_availability (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER UNIQUE NOT NULL,
    status TEXT DEFAULT 'away',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(admin_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER,
    admin_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    scheduled_at TEXT NOT NULL,
    title TEXT,
    notes TEXT,
    status TEXT DEFAULT 'proposed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(request_id) REFERENCES investor_requests(id),
    FOREIGN KEY(admin_id) REFERENCES users(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS investor_hub_write_access (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    can_write INTEGER DEFAULT 1,
    granted_by_admin_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(thread_id) REFERENCES chat_threads(id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(granted_by_admin_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS auction_chat_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    auction_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    invited INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(auction_id) REFERENCES auctions(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS login_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    ip_address TEXT,
    user_agent TEXT,
    success INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS communication_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    thread_id INTEGER,
    message_id INTEGER,
    user_id INTEGER,
    target_id TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(thread_id) REFERENCES chat_threads(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS vault_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    masterpiece_id INTEGER NOT NULL,
    request_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    thread_id INTEGER,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id),
    FOREIGN KEY(thread_id) REFERENCES chat_threads(id)
  );

  -- AI Sales Psychology Engine
  CREATE TABLE IF NOT EXISTS asset_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    masterpiece_id INTEGER NOT NULL,
    viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    duration_seconds INTEGER DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id)
  );
  CREATE TABLE IF NOT EXISTS user_favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    masterpiece_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, masterpiece_id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id)
  );
  CREATE TABLE IF NOT EXISTS interest_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    interest_type TEXT NOT NULL,
    reference_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS design_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    masterpiece_id INTEGER,
    request_type TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id)
  );

  -- Resale & Maison Commission System
  CREATE TABLE IF NOT EXISTS resale_listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    masterpiece_id INTEGER NOT NULL,
    seller_id INTEGER NOT NULL,
    asking_price REAL NOT NULL,
    min_price REAL,
    commission_pct REAL NOT NULL,
    sale_method TEXT DEFAULT 'marketplace',
    contract_id INTEGER,
    status TEXT DEFAULT 'pending_signature',
    signed_at DATETIME,
    final_sale_price REAL,
    commission_amount REAL,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id),
    FOREIGN KEY(seller_id) REFERENCES users(id),
    FOREIGN KEY(contract_id) REFERENCES contracts(id)
  );
  CREATE TABLE IF NOT EXISTS resale_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resale_listing_id INTEGER,
    action TEXT NOT NULL,
    admin_id INTEGER,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(resale_listing_id) REFERENCES resale_listings(id),
    FOREIGN KEY(admin_id) REFERENCES users(id)
  );
`);

try {
  db.prepare("ALTER TABLE masterpieces ADD COLUMN nft_token_id TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE masterpieces ADD COLUMN prestige_score REAL").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE masterpieces ADD COLUMN prestige_category TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE resale_listings ADD COLUMN original_valuation_at_listing REAL").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE resale_listings ADD COLUMN prestige_score_at_listing REAL").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE resale_listings ADD COLUMN market_stability_score REAL").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE resale_listings ADD COLUMN price_recommendation REAL").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE resale_listings ADD COLUMN value_floor_pct REAL").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE resale_listings ADD COLUMN admin_decision TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE resale_listings ADD COLUMN decided_at DATETIME").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE resale_listings ADD COLUMN decided_by INTEGER REFERENCES users(id)").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE masterpieces ADD COLUMN transfer_type TEXT DEFAULT 'platform'").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE masterpieces ADD COLUMN warranty_void INTEGER DEFAULT 0").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE masterpieces ADD COLUMN registry_id TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE investor_requests ADD COLUMN masterpiece_id INTEGER").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE investor_requests ADD COLUMN request_metadata TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE users ADD COLUMN notification_prefs TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE users ADD COLUMN username TEXT").run();
} catch (e) {}
db.exec(`
  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    token TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS user_portfolio_hidden (
    user_id INTEGER NOT NULL,
    masterpiece_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, masterpiece_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (masterpiece_id) REFERENCES masterpieces(id)
  );
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS contact_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS maison_buyback_offers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resale_listing_id INTEGER NOT NULL,
    offered_amount REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    offered_by INTEGER NOT NULL,
    offered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    responded_at DATETIME,
    FOREIGN KEY(resale_listing_id) REFERENCES resale_listings(id),
    FOREIGN KEY(offered_by) REFERENCES users(id)
  );
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS consent_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    consent_type TEXT NOT NULL,
    granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    version TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS data_access_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    request_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    response_details TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);
try {
  db.prepare("ALTER TABLE auctions ADD COLUMN terms TEXT").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE auctions ADD COLUMN vip_only INTEGER DEFAULT 0").run();
} catch (e) {
  // Column might already exist
}

// --- Automatic Number Systems (International Luxury Maison) ---
db.exec(`
  CREATE TABLE IF NOT EXISTS number_sequences (
    seq_key TEXT NOT NULL,
    seq_year INTEGER NOT NULL,
    seq_type TEXT,
    last_value INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (seq_key, seq_year, seq_type)
  );
`);
function nextProductSerial(category: string): string {
  const year = new Date().getFullYear();
  const catCode = (category || 'GEN').replace(/\s+/g, '').substring(0, 3).toUpperCase() || 'GEN';
  const key = `product_${catCode}_${year}`;
  const row = db.prepare("SELECT last_value FROM number_sequences WHERE seq_key = ? AND seq_year = ? AND (seq_type IS NULL OR seq_type = '')").get(key, year) as { last_value: number } | undefined;
  const nextVal = (row ? row.last_value + 1 : 1);
  db.prepare(`
    INSERT INTO number_sequences (seq_key, seq_year, seq_type, last_value) VALUES (?, ?, '', ?)
    ON CONFLICT(seq_key, seq_year, seq_type) DO UPDATE SET last_value = excluded.last_value
  `).run(key, year, nextVal);
  return `AB-${year}-${catCode}-${String(nextVal).padStart(4, '0')}`;
}
function nextContractRef(contractType: string): string {
  const year = new Date().getFullYear();
  const typeMap: Record<string, string> = {
    deposit: 'DEP', purchase: 'SALE', sale: 'SALE', invoice: 'INV', final_payment: 'FPT',
    resale: 'RSL', resale_commission: 'RSL', vip: 'VIP', vip_membership: 'VIP',
    fractional: 'FRA', digital_registry: 'REG', service: 'SVC', extended_warranty: 'WAR',
    platform_terms: 'TC', certificate: 'CERT'
  };
  const code = typeMap[contractType] || 'CTR';
  const key = `contract_${code}_${year}`;
  const row = db.prepare("SELECT last_value FROM number_sequences WHERE seq_key = ? AND seq_year = ? AND seq_type = ?").get(key, year, code) as { last_value: number } | undefined;
  const nextVal = (row ? row.last_value + 1 : 1);
  db.prepare(`
    INSERT INTO number_sequences (seq_key, seq_year, seq_type, last_value) VALUES (?, ?, ?, ?)
    ON CONFLICT(seq_key, seq_year, seq_type) DO UPDATE SET last_value = excluded.last_value
  `).run(key, year, code, nextVal);
  return `CTR-${code}-${year}-${String(nextVal).padStart(4, '0')}`;
}
function nextCertRef(): string {
  const year = new Date().getFullYear();
  const key = `cert_${year}`;
  const row = db.prepare("SELECT last_value FROM number_sequences WHERE seq_key = ? AND seq_year = ? AND (seq_type IS NULL OR seq_type = '')").get(key, year) as { last_value: number } | undefined;
  const nextVal = (row ? row.last_value + 1 : 1);
  db.prepare(`
    INSERT INTO number_sequences (seq_key, seq_year, seq_type, last_value) VALUES (?, ?, '', ?)
    ON CONFLICT(seq_key, seq_year, seq_type) DO UPDATE SET last_value = excluded.last_value
  `).run(key, year, nextVal);
  return `CERT-${year}-${String(nextVal).padStart(4, '0')}`;
}
function nextRegRef(): string {
  const year = new Date().getFullYear();
  const key = `reg_${year}`;
  const row = db.prepare("SELECT last_value FROM number_sequences WHERE seq_key = ? AND seq_year = ? AND (seq_type IS NULL OR seq_type = '')").get(key, year) as { last_value: number } | undefined;
  const nextVal = (row ? row.last_value + 1 : 1);
  db.prepare(`
    INSERT INTO number_sequences (seq_key, seq_year, seq_type, last_value) VALUES (?, ?, '', ?)
    ON CONFLICT(seq_key, seq_year, seq_type) DO UPDATE SET last_value = excluded.last_value
  `).run(key, year, nextVal);
  return `REG-${year}-${String(nextVal).padStart(4, '0')}`;
}

// Seed Admin: immer admin@bellanova.com / admin123 und Anmeldename "admin" verfügbar
const adminEmail = "admin@bellanova.com";
const adminUsername = "admin";
const adminExists = db.prepare("SELECT id FROM users WHERE LOWER(TRIM(email)) = ?").get(adminEmail.toLowerCase()) as { id: number } | undefined;
if (!adminExists) {
  db.prepare("INSERT INTO users (email, username, password, name, role, status) VALUES (?, ?, ?, ?, ?, ?)").run(
    adminEmail, adminUsername, hashPassword("admin123"), "Antonio Bellanova", "admin", "approved"
  );
} else {
  db.prepare("UPDATE users SET password = ?, status = 'approved', username = ? WHERE id = ?").run(hashPassword("admin123"), adminUsername, adminExists.id);
}

// --- WebSocket Logic ---
const clients = new Set<WebSocket>();
wss.on("connection", (ws) => {
  clients.add(ws);
  ws.on("close", () => clients.delete(ws));
});

function broadcast(data: any) {
  const msg = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

// --- Luxury PDF Design Engine (Black/Gold, Serif, Watermark, Digital Signature) ---
const LUXURY_GOLD = '#c9a227';
const LUXURY_GOLD_DIM = 'rgba(201, 162, 39, 0.25)';
const LUXURY_BLACK = '#0a0a0a';
const LUXURY_BG = '#0d0d0d';
const LUXURY_TEXT = '#e8e6e3';
const LUXURY_MUTED = '#8a8784';

function generateLuxuryDocument(type: string, content: string, user: any, piece: any, options: any = {}) {
  const date = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
  const version = options.version || 1;
  const docRef = options.docRef || `${type.substring(0, 3).toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  const clientRef = options.clientRef || `CL-${user.id}-${(user.name || '').substring(0, 3).toUpperCase()}`;
  const serialNumber = (piece && piece.serial_id) ? piece.serial_id : 'AB-VAULT-000';
  const jurisdiction = options.jurisdiction || 'Federal Republic of Germany';
  const isCertificate = type.toUpperCase().includes('CERTIFICATE');
  const isInvoice = type.toUpperCase().includes('INVOICE');
  const title = options.title || type;
  const pieceTitle = (piece && piece.title) ? piece.title : '—';
  const pieceMaterials = (piece && piece.materials) ? piece.materials : '—';
  const pieceGemstones = (piece && piece.gemstones) ? piece.gemstones : '—';
  const pieceValuation = (piece && piece.valuation != null) ? Number(piece.valuation).toLocaleString() : '—';
  const pieceStatus = (piece && piece.status) ? piece.status : '—';
  const pieceDescription = (piece && piece.description) ? piece.description.substring(0, 220) : '';
  const pieceImage = (piece && piece.image_url) ? String(piece.image_url).trim() : '';
  const hasPiece = piece && (piece.title || piece.serial_id);
  const blockchainHash = (piece && piece.blockchain_hash) ? piece.blockchain_hash : 'PENDING_VERIFICATION';
  const productImageBlock = hasPiece
    ? (pieceImage
        ? `<div style="margin-bottom: 18px;">
            <div style="font-size: 8px; letter-spacing: 4px; color: ${LUXURY_GOLD}; text-transform: uppercase; margin-bottom: 10px;">Produktbild / Asset</div>
            <img src="${pieceImage}" style="width: 100%; max-height: 320px; object-fit: contain; border: 1px solid ${LUXURY_GOLD_DIM}; background: ${LUXURY_BG};" alt="${pieceTitle}" />
          </div>`
        : `<div style="margin-bottom: 18px;">
            <div style="font-size: 8px; letter-spacing: 4px; color: ${LUXURY_GOLD}; text-transform: uppercase; margin-bottom: 10px;">Produktbild / Asset</div>
            <div style="width: 100%; height: 200px; border: 1px dashed ${LUXURY_GOLD_DIM}; background: rgba(201, 162, 39, 0.04); display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 10px; color: ${LUXURY_MUTED}; letter-spacing: 2px;">Kein Bild hinterlegt · Serial: ${serialNumber}</span>
            </div>
          </div>`)
    : '';

  return `
    <div style="font-family: 'Georgia', 'Times New Roman', serif; padding: 40px 36px; color: ${LUXURY_TEXT}; background: ${LUXURY_BG}; max-width: 720px; margin: auto; position: relative; line-height: 1.5; box-sizing: border-box;">
      <div style="position: fixed; left: 50%; top: 45%; transform: translate(-50%, -50%) rotate(-18deg); font-size: 56px; letter-spacing: 8px; color: ${LUXURY_GOLD_DIM}; text-transform: uppercase; white-space: nowrap; pointer-events: none; font-weight: 300;">Antonio Bellanova</div>
      <div style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%) rotate(-90deg); font-size: 8px; letter-spacing: 3px; color: ${LUXURY_MUTED}; text-transform: uppercase; white-space: nowrap;">Atelier • Private Vault</div>
      <div style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%) rotate(90deg); font-size: 8px; letter-spacing: 3px; color: ${LUXURY_MUTED}; text-transform: uppercase; white-space: nowrap;">Haute Joaillerie • Köln</div>

      <div style="text-align: center; margin-bottom: 28px; border-bottom: 1px solid ${LUXURY_GOLD_DIM}; padding-bottom: 18px;">
        <div style="font-size: 9px; letter-spacing: 8px; color: ${LUXURY_GOLD}; margin-bottom: 8px; text-transform: uppercase;">Antonio Bellanova</div>
        <h1 style="font-size: 26px; font-weight: 300; margin: 0; color: ${LUXURY_TEXT}; letter-spacing: 1px;">${title}</h1>
        <div style="display: flex; justify-content: center; gap: 20px; margin-top: 14px; flex-wrap: wrap;">
          <div><div style="font-size: 7px; color: ${LUXURY_MUTED}; text-transform: uppercase; letter-spacing: 1px;">Document Ref</div><div style="font-size: 10px; font-weight: 600; color: ${LUXURY_GOLD};">${docRef}</div></div>
          <div><div style="font-size: 7px; color: ${LUXURY_MUTED}; text-transform: uppercase; letter-spacing: 1px;">Client Ref</div><div style="font-size: 10px; color: ${LUXURY_TEXT};">${clientRef}</div></div>
          <div><div style="font-size: 7px; color: ${LUXURY_MUTED}; text-transform: uppercase; letter-spacing: 1px;">Version</div><div style="font-size: 10px; color: ${LUXURY_TEXT};">v${version}.0</div></div>
          <div><div style="font-size: 7px; color: ${LUXURY_MUTED}; text-transform: uppercase; letter-spacing: 1px;">Date</div><div style="font-size: 10px; color: ${LUXURY_TEXT};">${date}</div></div>
        </div>
      </div>

      <div style="margin-bottom: 24px;">
        ${productImageBlock}
        <div style="text-align: center;">
          <h2 style="font-size: 18px; font-weight: 400; margin-bottom: 4px; color: ${LUXURY_TEXT};">${pieceTitle}</h2>
          <div style="font-size: 8px; letter-spacing: 3px; color: ${LUXURY_GOLD}; text-transform: uppercase;">Serial: ${serialNumber}</div>
          ${pieceDescription ? `<p style="font-size: 11px; color: ${LUXURY_MUTED}; font-style: italic; margin-top: 8px; line-height: 1.5;">${pieceDescription}${pieceDescription.length >= 220 ? '…' : ''}</p>` : ''}
        </div>
      </div>

      <div style="background: rgba(201, 162, 39, 0.06); padding: 18px 20px; margin-bottom: 24px; border: 1px solid ${LUXURY_GOLD_DIM};">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <div style="font-size: 8px; letter-spacing: 1px; color: ${LUXURY_GOLD}; text-transform: uppercase; margin-bottom: 8px;">Asset Specifications</div>
            <div style="margin-bottom: 6px;"><div style="font-size: 9px; color: ${LUXURY_MUTED};">Materials</div><div style="font-size: 11px; color: ${LUXURY_TEXT};">${pieceMaterials}</div></div>
            <div><div style="font-size: 9px; color: ${LUXURY_MUTED};">Gemstones</div><div style="font-size: 11px; color: ${LUXURY_TEXT};">${pieceGemstones}</div></div>
          </div>
          <div>
            <div style="font-size: 8px; letter-spacing: 1px; color: ${LUXURY_GOLD}; text-transform: uppercase; margin-bottom: 8px;">Financial Summary</div>
            <div style="margin-bottom: 6px;"><div style="font-size: 9px; color: ${LUXURY_MUTED};">Total Valuation</div><div style="font-size: 14px; font-weight: 600; color: ${LUXURY_GOLD};">${pieceValuation} EUR</div></div>
            ${isInvoice ? `<div><div style="font-size: 9px; color: ${LUXURY_MUTED};">Balance Due</div><div style="font-size: 14px; font-weight: 600; color: ${LUXURY_GOLD};">${Number(options.balanceDue || 0).toLocaleString()} EUR</div></div>` : `<div><div style="font-size: 9px; color: ${LUXURY_MUTED};">Status</div><div style="font-size: 10px; color: ${LUXURY_TEXT}; text-transform: uppercase; letter-spacing: 1px;">${pieceStatus}</div></div>`}
          </div>
        </div>
      </div>

      <div style="margin-bottom: 28px; font-size: 12px; color: ${LUXURY_TEXT}; line-height: 1.6; text-align: justify;">
        ${content.split('\n\n').map(p => `<p style="margin-bottom: 12px;">${String(p).replace(/\n/g, '<br>')}</p>`).join('')}
        ${options.escrowEnabled ? `<div style="margin-top: 18px; padding: 12px; border: 1px dashed ${LUXURY_GOLD}; background: rgba(201, 162, 39, 0.08);"><div style="font-size: 9px; font-weight: 700; color: ${LUXURY_GOLD}; text-transform: uppercase; margin-bottom: 4px;">Escrow Protection</div><div style="font-size: 10px; color: ${LUXURY_MUTED};">Funds held by Antonio Bellanova Vault Escrow until verified delivery.</div></div>` : ''}
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 36px; align-items: end;">
        <div>
          <div style="font-size: 16px; color: ${LUXURY_GOLD}; margin-bottom: 4px; font-style: italic;">Antonio Bellanova</div>
          <div style="width: 100%; height: 1px; background: ${LUXURY_GOLD}; opacity: 0.5;"></div>
          <div style="font-size: 7px; color: ${LUXURY_MUTED}; letter-spacing: 1px; text-transform: uppercase; margin-top: 4px;">Atelier Director — Digital Signature</div>
        </div>
        <div>
          <div style="height: 24px; border-bottom: 1px solid rgba(201, 162, 39, 0.4); margin-bottom: 4px;"></div>
          <div style="font-size: 7px; color: ${LUXURY_MUTED}; letter-spacing: 1px; text-transform: uppercase;">Client: ${(user && user.name) ? user.name : '________________'}</div>
        </div>
      </div>

      <div style="margin-top: 36px; border-top: 1px solid ${LUXURY_GOLD_DIM}; padding-top: 18px;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap; margin-bottom: 12px;">
          <div style="width: 36px; height: 36px; border: 1px solid ${LUXURY_GOLD}; border-radius: 50%; line-height: 36px; text-align: center; font-size: 9px; color: ${LUXURY_GOLD}; letter-spacing: 1px; font-weight: 700;">AB</div>
          ${options.registryId ? `<div style="text-align: center;"><img src="https://api.qrserver.com/v1/create-qr-code/?size=64x64&data=${encodeURIComponent(options.registryUrl || options.registryId)}" width="64" height="64" alt="Registry" style="border: 1px solid ${LUXURY_GOLD_DIM};" /><div style="font-size: 6px; color: ${LUXURY_MUTED}; margin-top: 2px;">Registry: ${options.registryId}</div></div>` : ''}
        </div>
        <div style="font-size: 7px; color: ${LUXURY_MUTED}; letter-spacing: 1px;">Blockchain: ${blockchainHash}</div>
        <div style="font-size: 6px; color: ${LUXURY_MUTED}; margin-top: 8px; line-height: 1.5; text-align: left; max-width: 640px; margin-left: auto; margin-right: auto;">
          <strong style="color: ${LUXURY_GOLD};">Governing Law:</strong> Germany. Jurisdiction: Cologne. &bull;
          <strong style="color: ${LUXURY_GOLD};">Shipping:</strong> Risk/title per order. &bull;
          <strong style="color: ${LUXURY_GOLD};">Customs/VAT:</strong> Recipient unless agreed. &bull;
          <strong style="color: ${LUXURY_GOLD};">Arbitration:</strong> ICC/DIS Cologne. &bull;
          <strong style="color: ${LUXURY_GOLD};">Export:</strong> Client warrants compliance.
        </div>
        <div style="font-size: 6px; color: ${LUXURY_MUTED}; margin-top: 8px;">DSGVO/GDPR: per Platform Terms. Save as PDF.</div>
      </div>
    </div>
  `;
}

/** Regenerates contract HTML content from current user/piece data. Returns new content or null if not supported. */
function regenerateContractContent(c: any): string | null {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(c.user_id) as any;
  if (!user) return null;
  const piece = c.masterpiece_id ? (db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(c.masterpiece_id) as any) : null;
  const docRef = c.doc_ref || nextContractRef(c.type);
  const dummyPiece = { id: 0, title: '—', serial_id: '—', materials: '—', gemstones: '—', valuation: 0, status: '—', description: '', image_url: '', blockchain_hash: '—' };

  switch (c.type) {
    case 'deposit':
      if (!piece) return null;
      const depositAmount = (piece.valuation * (piece.deposit_pct || 10)) / 100;
      const depositContent = `This binding instrument confirms the formal reservation of the Masterpiece identified as "${piece.title}" (Serial: ${piece.serial_id}).\n\nBy executing this agreement, the Client acknowledges a commitment to the acquisition of the aforementioned asset at a total valuation of ${Number(piece.valuation).toLocaleString()} EUR.\n\nA non-refundable commitment deposit of ${depositAmount.toLocaleString()} EUR (${piece.deposit_pct || 10}% of total valuation) is required to initiate the bespoke production phase and secure the asset within the Antonio Bellanova Vault.\n\nUpon receipt of funds, the Atelier shall commence the handcrafted realization of the piece. Ownership remains with the Atelier until final settlement.\n\nRESALE RECOMMENDATION: The Client is encouraged to conduct any future resale of this asset through the Antonio Bellanova Vault platform. Platform resale ensures Registry update, issuance of a new Certificate of Authenticity, continuity of warranty benefits, and preservation of Prestige Score and linked Service History. These benefits do not apply to transfers made outside the platform.`;
      return generateLuxuryDocument("Deposit Agreement", depositContent, user, piece, { docRef, title: "Deposit Agreement" });

    case 'invoice':
      if (!piece) return null;
      const balanceDue = piece.valuation - (piece.valuation * (piece.deposit_pct || 10) / 100);
      const invContent = `FINAL INVOICE FOR ACQUISITION\n\nThis invoice represents the final settlement for the Masterpiece "${piece.title}".\n\nTotal Valuation: ${Number(piece.valuation).toLocaleString()} EUR\nDeposit Paid: ${(piece.valuation * (piece.deposit_pct || 10) / 100).toLocaleString()} EUR\nRemaining Balance: ${balanceDue.toLocaleString()} EUR\n\nPayment is due within 14 days to initiate the Escrow Release and Delivery phase. Ownership transfer will be executed upon successful escrow release.`;
      return generateLuxuryDocument("Final Invoice", invContent, user, piece, { docRef, title: "Final Invoice", balanceDue, escrowEnabled: true });

    case 'certificate':
      if (!piece) return null;
      const regId = piece.registry_id || 'REG-PENDING';
      const certContent = `CERTIFICATE OF AUTHENTICITY & OWNERSHIP\n\nThis definitive instrument serves as the permanent record of provenance for the Masterpiece "${piece.title}".\n\nHandcrafted within the Antonio Bellanova Atelier, this asset is now officially registered to the collection of ${user.name}.\n\nAsset Specifications:\nSerial Number: ${piece.serial_id}\nRegistry ID: ${regId}\nBlockchain Hash: ${piece.blockchain_hash || 'AB-SECURE-HASH-772'}\n\nThe Atelier hereby guarantees the authenticity and exceptional quality of this unique creation in perpetuity.`;
      return generateLuxuryDocument("Certificate of Authenticity", certContent, user, piece, { docRef, title: "Certificate of Authenticity", registryId: regId, registryUrl: `/registry/masterpiece/${piece.id}` });

    case 'vip':
      const vipContent = `VIP MEMBERSHIP AGREEMENT (€15,000 annual)\n\nThis agreement grants ${user.name} VIP membership to the Antonio Bellanova Atelier.\n\nBenefits: 48h Early Access to new creations; Private Auction Access; Concierge Service; Repair priority; Reduced Resale Commission (6%); Invite-Only Events. Duration and cancellation rules as per Platform Terms.`;
      return generateLuxuryDocument("VIP Membership Agreement", vipContent, user, dummyPiece, { docRef, title: "VIP Membership Agreement" });

    case 'resale_commission':
      if (!piece) return null;
      const listing = db.prepare("SELECT * FROM resale_listings WHERE contract_id = ?").get(c.id) as any;
      const commissionPct = listing?.commission_pct ?? 10;
      const saleMethod = listing?.sale_method || 'marketplace';
      return generateResaleCommissionAgreement(piece, user, { commissionPct, saleMethod, docRef });

    case 'fractional':
      if (!piece) return null;
      const shareRow = db.prepare("SELECT percentage FROM fractional_shares WHERE masterpiece_id = ? AND owner_id = ?").get(c.masterpiece_id, c.user_id) as { percentage: number } | undefined;
      const pct = shareRow?.percentage ?? 0;
      const fracContent = `FRACTIONAL OWNERSHIP AGREEMENT\n\nThis agreement grants ${user.name} a ${pct}% participation in the asset "${piece.title}" (Serial: ${piece.serial_id}).\n\nThe physical asset remains in the custody of the Antonio Bellanova Vault. No physical division of the object. Secondary trading of participation may be permitted on the platform. Exit and redemption terms as per platform rules. Governing Law: Germany; Jurisdiction: Cologne.`;
      return generateLuxuryDocument("Fractional Ownership Agreement", fracContent, user, piece, { docRef, title: "Fractional Ownership Agreement" });

    default:
      return null;
  }
}

function notifyUser(userId: number, message: string, type: string = 'info') {
  db.prepare("INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)").run(userId, message, type);
  broadcast({ type: 'NOTIFICATION', userId, message, notificationType: type });
}

// --- Optional E-Mail (SMTP env: SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, MAIL_FROM) ---
function shouldSendEmailToUser(user: { email?: string | null; notification_prefs?: string | null }): boolean {
  if (!user?.email || typeof user.email !== 'string' || !user.email.trim()) return false;
  try {
    const prefs = user.notification_prefs ? JSON.parse(user.notification_prefs) : {};
    if (prefs && prefs.email === false) return false;
  } catch (_) {}
  return true;
}

async function sendMail(to: string, subject: string, text: string, html?: string): Promise<void> {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.MAIL_FROM || 'noreply@bellanova.com';
  if (!host || !port) return; // E-Mail deaktiviert, wenn SMTP nicht konfiguriert
  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === '1',
      auth: (user && pass) ? { user, pass } : undefined,
    });
    await transporter.sendMail({
      from,
      to: to.trim(),
      subject,
      text,
      html: html || text.replace(/\n/g, '<br>\n'),
    });
  } catch (err) {
    console.error("[mail]", err);
  }
}

function logAudit(adminId: number, action: string, targetId: string, details: string) {
  db.prepare("INSERT INTO audit_logs (admin_id, action, target_id, details) VALUES (?, ?, ?, ?)").run(adminId, action, targetId, details);
}

function updateProvenance(masterpieceId: number, eventType: string, description: string, metadata: any = {}) {
  db.prepare("INSERT INTO provenance_timeline (masterpiece_id, event_type, description, metadata) VALUES (?, ?, ?, ?)").run(
    masterpieceId, eventType, description, JSON.stringify(metadata)
  );
}

function calculateRarityScore(masterpieceId: number) {
  const piece = db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(masterpieceId);
  if (!piece) return 0;

  let score = 0;
  
  // 1. Edition Size / Rarity Category (0-40)
  const rarityMap: Record<string, number> = { 'Unique': 40, 'Limited': 25, 'Rare': 15, 'Standard': 5 };
  score += rarityMap[piece.rarity] || 0;

  // 2. Materials & Gemstones (0-20)
  if (piece.materials.toLowerCase().includes('gold') || piece.materials.toLowerCase().includes('platinum')) score += 10;
  if (piece.gemstones.split(',').length > 3) score += 10;

  // 3. Provenance Depth (0-20)
  const provenanceCount = db.prepare("SELECT COUNT(*) as count FROM provenance_timeline WHERE masterpiece_id = ?").get(masterpieceId).count;
  score += Math.min(provenanceCount * 2, 20);

  // 4. Service History (0-10)
  const serviceCount = db.prepare("SELECT COUNT(*) as count FROM service_history WHERE masterpiece_id = ?").get(masterpieceId).count;
  score += Math.min(serviceCount * 2, 10);

  // 5. Auction Demand (0-10)
  const bidCount = db.prepare("SELECT COUNT(*) as count FROM bids b JOIN auctions a ON b.auction_id = a.id WHERE a.masterpiece_id = ?").get(masterpieceId).count;
  score += Math.min(bidCount, 10);

  db.prepare("UPDATE masterpieces SET rarity_score = ? WHERE id = ?").run(score, masterpieceId);
  return score;
}

// --- API Routes ---

// Auth
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,50}$/;
app.post("/api/register", (req, res) => {
  const { email, password, name, username: rawUsername, address, wantsVip, language, role } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  const username = typeof rawUsername === "string" ? rawUsername.trim() : "";
  if (!username) return res.status(400).json({ error: "Anmeldename erforderlich." });
  if (!USERNAME_REGEX.test(username)) return res.status(400).json({ error: "Anmeldename: 3–50 Zeichen, nur Buchstaben, Zahlen und Unterstrich." });
  const usernameNorm = username.toLowerCase();
  if (db.prepare("SELECT id FROM users WHERE username IS NOT NULL AND LOWER(TRIM(username)) = ?").get(usernameNorm)) {
    return res.status(400).json({ error: "Anmeldename bereits vergeben." });
  }
  try {
    const hashed = hashPassword(String(password));
    const result = db.prepare("INSERT INTO users (email, username, password, name, address, is_vip, language, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
      email, username, hashed, name, address, wantsVip ? 1 : 0, language || 'de', role || 'client'
    );
    res.json({ id: result.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ error: "E-Mail bereits vergeben." });
  }
});

function getSessionUserId(req: express.Request): number | null {
  const cookie = req.headers.cookie;
  if (!cookie) return null;
  const m = cookie.match(/\bsession=(\d+)\b/);
  return m ? Number(m[1]) : null;
}

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const userId = getSessionUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
  if (!user || user.status !== "approved") {
    res.status(401).json({ error: "Invalid session" });
    return;
  }
  (req as any).userId = userId;
  (req as any).user = user;
  next();
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const u = (req as any).user;
  if (!u || (u.role !== "admin" && u.role !== "super_admin")) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}

const PUBLIC_API_PATHS: { method: string; path: string | RegExp }[] = [
  { method: "POST", path: "/api/register" },
  { method: "POST", path: "/api/login" },
  { method: "POST", path: "/api/logout" },
  { method: "GET", path: "/api/logout" },
  { method: "GET", path: "/api/masterpieces" },
  { method: "GET", path: "/api/atelier-moments" },
  { method: "POST", path: "/api/contact" },
  { method: "GET", path: /^\/api\/verify\// },
  { method: "POST", path: "/api/forgot-password" },
  { method: "POST", path: "/api/reset-password" },
];

function isPublicApi(req: express.Request): boolean {
  const path = (req.originalUrl || req.url || req.path || "").split("?")[0];
  const method = req.method;
  return PUBLIC_API_PATHS.some(
    (p) => p.method === method && (typeof p.path === "string" ? path === p.path : (p.path as RegExp).test(path))
  );
}

app.use("/api", (req, res, next) => {
  if (isPublicApi(req)) return next();
  requireAuth(req, res, () => {
    const path = (req.originalUrl || req.url || req.path || "").split("?")[0];
    if (path.startsWith("/api/admin")) return requireAdmin(req, res, next);
    next();
  });
});

app.post("/api/login", (req, res) => {
  const loginInput = (req.body?.email ?? req.body?.login ?? "").toString().trim().toLowerCase();
  const password = String(req.body?.password ?? "");
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket?.remoteAddress || '';
  const userAgent = (req.headers['user-agent'] as string) || '';
  const user = db.prepare("SELECT * FROM users WHERE LOWER(TRIM(email)) = ? OR (username IS NOT NULL AND LOWER(TRIM(username)) = ?)").get(loginInput, loginInput) as any;
  if (user && checkPassword(password, user.password || '')) {
    if (user.status !== 'approved') {
      try { db.prepare("INSERT INTO login_history (user_id, ip_address, user_agent, success) VALUES (?, ?, ?, 0)").run(user.id, ip, userAgent); } catch (_) {}
      return res.status(403).json({ error: "Account pending approval" });
    }
    try { upgradePasswordIfNeeded(user.id, String(password)); } catch (_) {}
    try { db.prepare("INSERT INTO login_history (user_id, ip_address, user_agent, success) VALUES (?, ?, ?, 1)").run(user.id, ip, userAgent); } catch (_) {}
    res.setHeader("Set-Cookie", `session=${user.id}; Path=/; Max-Age=${7 * 24 * 3600}; HttpOnly; SameSite=Lax`);
    const { password: _p, ...rest } = user;
    res.json(rest);
  } else {
    const u = db.prepare("SELECT id FROM users WHERE LOWER(TRIM(email)) = ? OR (username IS NOT NULL AND LOWER(TRIM(username)) = ?)").get(loginInput, loginInput);
    try { db.prepare("INSERT INTO login_history (user_id, ip_address, user_agent, success) VALUES (?, ?, ?, 0)").run((u as any)?.id ?? null, ip, userAgent); } catch (_) {}
    res.status(401).json({ error: "Invalid credentials" });
  }
});

app.get("/api/me", (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) return res.status(401).json({ error: "Not signed in" });
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
  if (!user || user.status !== 'approved') return res.status(401).json({ error: "Invalid session" });
  const { password: _p, ...rest } = user;
  res.json(rest);
});

app.post("/api/logout", (req, res) => {
  res.setHeader("Set-Cookie", "session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax");
  res.json({ success: true });
});

app.post("/api/forgot-password", (req, res) => {
  const { email } = req.body || {};
  if (!email || typeof email !== "string") return res.status(400).json({ error: "E-Mail erforderlich." });
  const user = db.prepare("SELECT id, email, name FROM users WHERE email = ?").get(email.trim()) as any;
  if (!user) {
    res.json({ success: true });
    return;
  }
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  db.prepare("DELETE FROM password_reset_tokens WHERE user_id = ?").run(user.id);
  db.prepare("INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)").run(user.id, token, expiresAt);
  const baseUrl = process.env.APP_URL || req.protocol + "://" + req.get("host") || "http://localhost:3000";
  const resetLink = `${baseUrl}?view=reset-password&token=${token}`;
  sendMail(
    user.email,
    "Antonio Bellanova – Passwort zurücksetzen",
    `Guten Tag ${user.name || ""},\n\nSie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt. Klicken Sie auf den folgenden Link (gültig 1 Stunde):\n\n${resetLink}\n\nFalls Sie das nicht angefordert haben, ignorieren Sie diese E-Mail.\n\nMit freundlichen Grüßen\nIhr Atelier Antonio Bellanova`
  ).catch(() => {});
  res.json({ success: true });
});

app.post("/api/reset-password", (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword || typeof newPassword !== "string" || newPassword.length < 6)
    return res.status(400).json({ error: "Token und neues Passwort (min. 6 Zeichen) erforderlich." });
  const row = db.prepare("SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > datetime('now')").get(token) as any;
  if (!row) return res.status(400).json({ error: "Link abgelaufen oder ungültig. Bitte fordern Sie einen neuen an." });
  db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashPassword(newPassword), row.user_id);
  db.prepare("DELETE FROM password_reset_tokens WHERE user_id = ?").run(row.user_id);
  res.json({ success: true });
});

// Masterpieces (optional ?search= für globale Suche)
app.get("/api/masterpieces", (req, res) => {
  const search = (req.query.search as string)?.trim();
  let pieces: any[];
  if (search && search.length >= 2) {
    const term = "%" + search + "%";
    pieces = db.prepare("SELECT * FROM masterpieces WHERE title LIKE ? OR serial_id LIKE ? OR category LIKE ? OR materials LIKE ?").all(term, term, term, term);
  } else {
    pieces = db.prepare("SELECT * FROM masterpieces").all();
  }
  res.json(pieces);
});

// Extended search: q, category, minPrice, maxPrice, rarity, sort (newest | price_asc | price_desc | title)
app.get("/api/search", (req, res) => {
  const q = (req.query.q as string)?.trim();
  const category = (req.query.category as string)?.trim();
  const minPrice = req.query.minPrice != null ? Number(req.query.minPrice) : null;
  const maxPrice = req.query.maxPrice != null ? Number(req.query.maxPrice) : null;
  const rarity = (req.query.rarity as string)?.trim();
  const sort = (req.query.sort as string) || "newest";

  let pieces: any[] = db.prepare("SELECT * FROM masterpieces").all();

  if (q && q.length >= 1) {
    const term = "%" + q + "%";
    pieces = pieces.filter((p: any) =>
      (p.title && String(p.title).toLowerCase().includes(q.toLowerCase())) ||
      (p.serial_id && String(p.serial_id).toLowerCase().includes(q.toLowerCase())) ||
      (p.category && String(p.category).toLowerCase().includes(q.toLowerCase())) ||
      (p.materials && String(p.materials).toLowerCase().includes(q.toLowerCase()))
    );
  }
  if (category) pieces = pieces.filter((p: any) => p.category && String(p.category).toLowerCase() === category.toLowerCase());
  if (minPrice != null && !Number.isNaN(minPrice)) pieces = pieces.filter((p: any) => Number(p.valuation) >= minPrice);
  if (maxPrice != null && !Number.isNaN(maxPrice)) pieces = pieces.filter((p: any) => Number(p.valuation) <= maxPrice);
  if (rarity) pieces = pieces.filter((p: any) => p.rarity === rarity);

  if (sort === "price_asc") pieces.sort((a: any, b: any) => (Number(a.valuation) || 0) - (Number(b.valuation) || 0));
  else if (sort === "price_desc") pieces.sort((a: any, b: any) => (Number(b.valuation) || 0) - (Number(a.valuation) || 0));
  else if (sort === "title") pieces.sort((a: any, b: any) => (a.title || "").localeCompare(b.title || ""));
  else pieces.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

  res.json(pieces);
});

app.post("/api/admin/assign-piece", (req, res) => {
  const { userId, masterpieceId } = req.body;
  db.prepare("UPDATE masterpieces SET current_owner_id = ?, status = 'sold' WHERE id = ?").run(userId, masterpieceId);
  
  // Create ownership history
  const piece = db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(masterpieceId);
  db.prepare("INSERT INTO ownership_history (masterpiece_id, owner_id, price) VALUES (?, ?, ?)").run(
    masterpieceId, userId, piece.valuation
  );
  
  broadcast({ type: 'PIECE_ASSIGNED', userId, masterpieceId });
  res.json({ success: true });
});

app.post("/api/admin/masterpieces", (req, res) => {
  const { title, serial_id: bodySerial, category, description, materials, gemstones, valuation, rarity, production_time, cert_data, deposit_pct, image_url } = req.body;
  const serial_id = bodySerial && String(bodySerial).trim() ? String(bodySerial).trim() : nextProductSerial(category || 'GEN');
  try {
    const result = db.prepare(`
      INSERT INTO masterpieces (title, serial_id, category, description, materials, gemstones, valuation, rarity, production_time, cert_data, deposit_pct, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, serial_id, category, description, materials, gemstones, valuation, rarity, production_time, cert_data, deposit_pct, image_url);
    broadcast({ type: 'MASTERPIECE_CREATED', id: result.lastInsertRowid });
    
    // Initial Provenance
    updateProvenance(Number(result.lastInsertRowid), 'creation', `Masterpiece "${title}" created at Antonio Bellanova Atelier.`);
    calculateRarityScore(Number(result.lastInsertRowid));

    res.json({ id: result.lastInsertRowid });
  } catch (e: any) {
    if (e.message.includes("UNIQUE constraint failed: masterpieces.serial_id")) {
      res.status(400).json({ error: "Serial ID already exists. Each masterpiece must have a unique identifier." });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// Investor Features
app.get("/api/investor/analytics", (req, res) => {
  const totalValuation = db.prepare("SELECT SUM(valuation) as total FROM masterpieces").get().total || 0;
  const piecesSold = db.prepare("SELECT COUNT(*) as count FROM masterpieces WHERE status = 'sold'").get().count;
  const totalBids = db.prepare("SELECT COUNT(*) as count FROM bids").get().count;
  
  // Mocking some metrics for the luxury feel
  const analytics = {
    platform_valuation: totalValuation,
    pieces_sold: piecesSold,
    appreciation_metrics: {
      avg_appreciation: 12.4,
      top_performing_category: "High Jewelry"
    },
    auction_performance: {
      total_bids: totalBids,
      avg_bid_increase: 18.5
    },
    rarity_distribution: {
      "Unique": db.prepare("SELECT COUNT(*) as count FROM masterpieces WHERE rarity = 'Unique'").get().count,
      "Limited": db.prepare("SELECT COUNT(*) as count FROM masterpieces WHERE rarity = 'Limited'").get().count
    },
    liquidity_forecast: totalValuation * 0.15,
    scarcity_index: 94
  };
  res.json(analytics);
});

app.post("/api/investor/request", (req, res) => {
  const { userId, type, message, masterpiece_id, request_metadata } = req.body;
  if (type === 'share' && !masterpiece_id) return res.status(400).json({ error: "masterpiece_id required for share request" });
  db.prepare("INSERT INTO investor_requests (user_id, type, message, masterpiece_id, request_metadata) VALUES (?, ?, ?, ?, ?)").run(
    userId, type, message || null, masterpiece_id || null, request_metadata ? JSON.stringify(request_metadata) : null
  );
  res.json({ success: true });
});

app.get("/api/admin/investor-requests", (req, res) => {
  const requests = db.prepare(`
    SELECT ir.*, u.name as user_name, u.email as user_email, m.title as masterpiece_title, m.serial_id as masterpiece_serial
    FROM investor_requests ir 
    JOIN users u ON ir.user_id = u.id 
    LEFT JOIN masterpieces m ON ir.masterpiece_id = m.id
    ORDER BY ir.created_at DESC
  `).all();
  res.json(requests);
});

app.get("/api/investor/my-requests", (req, res) => {
  const userId = Number(req.query.userId);
  if (!userId) return res.status(400).json({ error: "userId required" });
  const requests = db.prepare("SELECT * FROM investor_requests WHERE user_id = ? ORDER BY created_at DESC").all(userId);
  res.json(requests);
});

app.post("/api/admin/investor-requests/:id/review", (req, res) => {
  const id = Number(req.params.id);
  const { approve } = req.body;
  const reqRow = db.prepare("SELECT * FROM investor_requests WHERE id = ?").get(id) as any;
  if (!reqRow) return res.status(404).json({ error: "Request not found" });
  const status = approve ? 'approved' : 'rejected';
  if (approve && reqRow.type === 'share' && reqRow.masterpiece_id) {
    const meta = reqRow.request_metadata ? JSON.parse(reqRow.request_metadata) : {};
    const pct = Math.min(Number(meta.percentage) || 5, 100);
    const avail = db.prepare("SELECT * FROM fractional_availability WHERE masterpiece_id = ?").get(reqRow.masterpiece_id) as any;
    if (!avail || (avail.available_pct || 0) < pct) return res.status(400).json({ error: "Not enough fractional availability for this piece" });
    db.prepare("INSERT INTO fractional_shares (masterpiece_id, owner_id, percentage) VALUES (?, ?, ?)").run(reqRow.masterpiece_id, reqRow.user_id, pct);
    db.prepare("UPDATE fractional_availability SET available_pct = available_pct - ?, updated_at = CURRENT_TIMESTAMP WHERE masterpiece_id = ?").run(pct, reqRow.masterpiece_id);
    const piece = db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(reqRow.masterpiece_id) as any;
    if (piece && avail.price_per_pct) {
      const amount = pct * (avail.price_per_pct || 0);
      try { db.prepare("INSERT INTO revenue_ledger (type, amount, user_id, masterpiece_id, reference_id) VALUES (?, ?, ?, ?, ?)").run('fractional_fee', amount, reqRow.user_id, reqRow.masterpiece_id, `share_req_${id}`); } catch (_) {}
    }
    try { db.prepare("INSERT INTO contracts (user_id, masterpiece_id, type, doc_ref, content, status) VALUES (?, ?, 'fractional', ?, ?, 'signed')").run(reqRow.user_id, reqRow.masterpiece_id, `FRA-${reqRow.masterpiece_id}-${reqRow.user_id}`, `Fractional ownership: ${pct}% of ${piece?.title || 'Asset'}.`); } catch (_) {}
  }
  db.prepare("UPDATE investor_requests SET status = ? WHERE id = ?").run(status, id);
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(reqRow.user_id) as any;
  if (user) {
    const msg = approve
      ? (reqRow.type === 'share' ? `Your fractional share request has been approved. You now own a share of the asset.` : "Your investor request has been approved. Access granted.")
      : "Your investor request could not be approved at this time.";
    try { db.prepare("INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)").run(user.id, msg, approve ? 'success' : 'info'); } catch (_) {}
  }
  res.json({ success: true, status });
});

app.get("/api/admin/appointments", (req, res) => {
  const rows = db.prepare(`
    SELECT a.*, u.name as user_name, u.email as user_email, ad.name as admin_name
    FROM appointments a
    JOIN users u ON a.user_id = u.id
    JOIN users ad ON a.admin_id = ad.id
    ORDER BY a.scheduled_at DESC
  `).all();
  res.json(rows);
});

app.post("/api/admin/appointments", (req, res) => {
  const { adminId, userId, requestId, scheduled_at, title, notes, status } = req.body;
  const admin = db.prepare("SELECT * FROM users WHERE id = ?").get(adminId) as any;
  if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin')) return res.status(403).json({ error: "Forbidden" });
  if (!userId || !scheduled_at) return res.status(400).json({ error: "userId and scheduled_at required" });
  const customer = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
  if (!customer) return res.status(404).json({ error: "User not found" });
  db.prepare(`
    INSERT INTO appointments (request_id, admin_id, user_id, scheduled_at, title, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(requestId || null, adminId, userId, scheduled_at, title || null, notes || null, status || 'proposed');
  const id = (db.prepare("SELECT last_insert_rowid()").get() as any)['last_insert_rowid()'];
  try { db.prepare("INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)").run(userId, `Termin vorgeschlagen: ${title || 'Beratung'} am ${scheduled_at}`, 'info'); } catch (_) {}
  res.json({ success: true, id });
});

app.patch("/api/admin/appointments/:id", (req, res) => {
  const id = Number(req.params.id);
  const { adminId, scheduled_at, title, notes, status } = req.body;
  const admin = db.prepare("SELECT * FROM users WHERE id = ?").get(adminId) as any;
  if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin')) return res.status(403).json({ error: "Forbidden" });
  const row = db.prepare("SELECT * FROM appointments WHERE id = ?").get(id) as any;
  if (!row) return res.status(404).json({ error: "Appointment not found" });
  const updates: string[] = [];
  const values: any[] = [];
  if (scheduled_at !== undefined) { updates.push("scheduled_at = ?"); values.push(scheduled_at); }
  if (title !== undefined) { updates.push("title = ?"); values.push(title); }
  if (notes !== undefined) { updates.push("notes = ?"); values.push(notes); }
  if (status !== undefined) { updates.push("status = ?"); values.push(status); }
  if (updates.length) {
    values.push(id);
    db.prepare(`UPDATE appointments SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values);
  }
  res.json({ success: true });
});

app.get("/api/appointments", (req, res) => {
  const userId = Number(req.query.userId);
  if (!userId) return res.status(400).json({ error: "userId required" });
  const rows = db.prepare(`
    SELECT a.*, ad.name as admin_name
    FROM appointments a
    JOIN users ad ON a.admin_id = ad.id
    WHERE a.user_id = ? ORDER BY a.scheduled_at DESC
  `).all(userId);
  res.json(rows);
});

app.patch("/api/appointments/:id/respond", (req, res) => {
  const id = Number(req.params.id);
  const { userId, status } = req.body;
  if (!userId || !status || !['confirmed', 'cancelled'].includes(status)) return res.status(400).json({ error: "userId and status (confirmed|cancelled) required" });
  const row = db.prepare("SELECT * FROM appointments WHERE id = ?").get(id) as any;
  if (!row || row.user_id !== userId) return res.status(403).json({ error: "Forbidden" });
  db.prepare("UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(status, id);
  res.json({ success: true });
});

app.post("/api/investor/log-view", (req, res) => {
  const { userId, masterpieceId, interestLevel } = req.body;
  db.prepare("INSERT INTO investor_view_logs (user_id, masterpiece_id, interest_level) VALUES (?, ?, ?)").run(
    userId, masterpieceId, interestLevel || 1
  );
  res.json({ success: true });
});

app.get("/api/investor/view-logs", (req, res) => {
  const logs = db.prepare(`
    SELECT ivl.*, m.title as masterpiece_title 
    FROM investor_view_logs ivl 
    JOIN masterpieces m ON ivl.masterpiece_id = m.id 
    ORDER BY ivl.created_at DESC
  `).all();
  res.json(logs);
});
app.post("/api/marketplace/buy", (req, res) => {
  const { userId, masterpieceId } = req.body;
  db.prepare("UPDATE masterpieces SET status = 'reserved' WHERE id = ?").run(masterpieceId);
  
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  const piece = db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(masterpieceId);
  const depositAmount = (piece.valuation * piece.deposit_pct) / 100;
  
  const content = `
    ANZAHLUNGSVERTRAG (DEPOSIT AGREEMENT)
    
    VERKÄUFER: Juwelen & Schmuckatelier Antonio Bellanova, Ahorstraße 8, 50765 Köln
    KÄUFER: ${user.name}, ${user.address}
    
    GEGENSTAND: ${piece.title} (Serial ID: ${piece.serial_id})
    GESAMTPREIS: ${piece.valuation} EUR
    ANZAHLUNGSBETRAG (${piece.deposit_pct}%): ${depositAmount} EUR
    
    RECHTLICHE HINWEISE:
    1. Mit Unterzeichnung dieses Vertrages reserviert der Verkäufer das oben genannte Stück für den Käufer.
    2. Der Käufer verpflichtet sich zur Zahlung der Anzahlung innerhalb von 7 Werktagen.
    3. Erst nach vollständiger Zahlung des Gesamtbetrages geht das Eigentum über.
    4. Bei Nichtzahlung der Anzahlung erlischt die Reservierung.
    
    Bankverbindung für die Anzahlung:
    IBAN: DE12 3456 7890 1234 5678 90
    Empfänger: Juwelen & Schmuckatelier Antonio Bellanova
    Verwendungszweck: DEP-${piece.serial_id}-${user.id}
    
    Datum: ${new Date().toLocaleDateString('de-DE')}
  `;
  db.prepare("INSERT INTO contracts (user_id, masterpiece_id, type, content) VALUES (?, ?, ?, ?)").run(
    userId, masterpieceId, 'deposit', content
  );
  
  broadcast({ type: 'MASTERPIECE_RESERVED', id: masterpieceId });
  res.json({ success: true });
});

app.post("/api/admin/approve-purchase", (req, res) => {
  const { masterpieceId, approve, adminId } = req.body;
  
  const piece = db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(masterpieceId);
  const contract = db.prepare("SELECT * FROM contracts WHERE masterpiece_id = ? AND type = 'deposit' ORDER BY id DESC").get(masterpieceId);
  
  if (!contract) return res.status(404).json({ error: "Contract not found" });

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(contract.user_id);

  if (approve) {
    // Check for duplicate approval
    const existingWorkflow = db.prepare("SELECT * FROM purchase_workflow WHERE masterpiece_id = ?").get(masterpieceId);
    if (existingWorkflow) return res.status(400).json({ error: "Purchase already approved" });

    // 1. Update status & workflow
    db.prepare(`
      INSERT INTO purchase_workflow (masterpiece_id, user_id, status, approved_at, approved_by, deposit_contract_sent_at)
      VALUES (?, ?, 'RESERVED', CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP)
    `).run(masterpieceId, user.id, adminId);

    // 2. Generate Documents
    const depositAmount = (piece.valuation * piece.deposit_pct) / 100;
    const docRef = nextContractRef('deposit');
    
    // Deposit Contract
    const depositContent = `This binding instrument confirms the formal reservation of the Masterpiece identified as "${piece.title}" (Serial: ${piece.serial_id}).\n\nBy executing this agreement, the Client acknowledges a commitment to the acquisition of the aforementioned asset at a total valuation of ${piece.valuation.toLocaleString()} EUR.\n\nA non-refundable commitment deposit of ${depositAmount.toLocaleString()} EUR (${piece.deposit_pct}% of total valuation) is required to initiate the bespoke production phase and secure the asset within the Antonio Bellanova Vault.\n\nUpon receipt of funds, the Atelier shall commence the handcrafted realization of the piece. Ownership remains with the Atelier until final settlement.\n\nRESALE RECOMMENDATION: The Client is encouraged to conduct any future resale of this asset through the Antonio Bellanova Vault platform. Platform resale ensures Registry update, issuance of a new Certificate of Authenticity, continuity of warranty benefits, and preservation of Prestige Score and linked Service History. These benefits do not apply to transfers made outside the platform.`;
    const depositHtml = generateLuxuryDocument("Deposit Agreement", depositContent, user, piece, { docRef, title: "Deposit Agreement" });
    db.prepare("INSERT INTO contracts (user_id, masterpiece_id, type, doc_ref, content, status) VALUES (?, ?, 'deposit', ?, ?, 'draft')").run(
      user.id, masterpieceId, docRef, depositHtml
    );

    // 3. Notification
    notifyUser(user.id, "Your acquisition request has been approved. The Deposit Agreement is ready for signature in your Vault.", "success");
    if (shouldSendEmailToUser(user)) {
      sendMail(
        user.email,
        "Antonio Bellanova – Ihr Kaufantrag wurde genehmigt",
        `Guten Tag ${user.name || ''},\n\nIhr Kaufantrag für "${piece.title}" wurde genehmigt. Der Anzahlungsvertrag steht in Ihrem Vault zur Unterzeichnung bereit.\n\nMit freundlichen Grüßen\nIhr Atelier Antonio Bellanova`
      ).catch(() => {});
    }
    updateProvenance(masterpieceId, 'vip_event', `Acquisition request approved for client ${user.name}.`);

    // 4. Start Payment Workflow
    db.prepare(`
      INSERT INTO payments (user_id, masterpiece_id, type, amount, status, iban, reference)
      VALUES (?, ?, 'deposit', ?, 'awaiting_deposit', 'DE35 2022 0800 0056 5751 78', ?)
    `).run(user.id, masterpieceId, depositAmount, docRef);

    logAudit(adminId, 'APPROVE_PURCHASE', masterpieceId.toString(), `Approved purchase for user ${user.id} - Status: RESERVED`);
  }
 else {
    db.prepare("UPDATE masterpieces SET status = 'available' WHERE id = ?").run(masterpieceId);
    notifyUser(user.id, "Your purchase request for " + piece.title + " was not approved.", "warning");
    logAudit(adminId, 'REJECT_PURCHASE', masterpieceId.toString(), `Rejected purchase for user ${user.id}`);
  }

  broadcast({ type: 'PURCHASE_REVIEWED', id: masterpieceId, approved: approve });
  res.json({ success: true });
});

// --- NFT Minting Service (Mock) ---
async function mintNFT(masterpieceId: number, ownerId: number): Promise<string> {
  const piece = db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(masterpieceId);
  const owner = db.prepare("SELECT * FROM users WHERE id = ?").get(ownerId);
  
  // Simulate blockchain minting process
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const tokenId = `NFT-${piece.serial_id}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
  
  db.prepare("UPDATE masterpieces SET nft_token_id = ? WHERE id = ?").run(tokenId, masterpieceId);
  
  updateProvenance(masterpieceId, 'certificate', `Digital Ownership NFT minted. Token ID: ${tokenId}. Registered to ${owner.name}.`);
  
  return tokenId;
}

app.post("/api/admin/workflow/update", (req, res) => {
  try {
    const { masterpieceId, step, adminId } = req.body;
    if (!masterpieceId || !step) return res.status(400).json({ error: "masterpieceId und step erforderlich." });
    const workflow = db.prepare("SELECT * FROM purchase_workflow WHERE masterpiece_id = ?").get(masterpieceId) as any;
    if (!workflow) return res.status(404).json({ error: "Workflow nicht gefunden." });

    const piece = db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(masterpieceId) as any;
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(workflow.user_id) as any;
    if (!piece) return res.status(404).json({ error: "Meisterstück nicht gefunden." });
    if (!user) return res.status(404).json({ error: "Kunde zum Workflow nicht gefunden." });

    let updateField = "";
    let newStatus = "";
    let message = "";

  switch (step) {
    case 'deposit_paid':
      updateField = "deposit_paid_at";
      newStatus = "PRODUCTION_STARTED";
      message = `Deposit for ${piece.title} received. Handcrafted production has officially commenced.`;
      db.prepare("UPDATE payments SET status = 'paid' WHERE masterpiece_id = ? AND type = 'deposit'").run(masterpieceId);
      db.prepare("UPDATE masterpieces SET status = 'reserved' WHERE id = ?").run(masterpieceId);
      break;
    case 'production_started':
      updateField = "production_started_at";
      newStatus = "IN_PRODUCTION";
      message = `Production for ${piece.title} has started.`;
      break;
    case 'production_finished':
      updateField = "production_finished_at";
      newStatus = "AWAITING_FINAL_PAYMENT";
      message = `Production for ${piece.title} is complete. Your Final Invoice has been generated.`;
      
      // Generate Final Invoice
      const balanceDue = piece.valuation - (piece.valuation * piece.deposit_pct / 100);
      const invRef = nextContractRef('invoice');
      const invContent = `FINAL INVOICE FOR ACQUISITION\n\nThis invoice represents the final settlement for the Masterpiece "${piece.title}".\n\nTotal Valuation: ${piece.valuation.toLocaleString()} EUR\nDeposit Paid: ${(piece.valuation * piece.deposit_pct / 100).toLocaleString()} EUR\nRemaining Balance: ${balanceDue.toLocaleString()} EUR\n\nPayment is due within 14 days to initiate the Escrow Release and Delivery phase. Ownership transfer will be executed upon successful escrow release.`;
      const invHtml = generateLuxuryDocument("Final Invoice", invContent, user, piece, { 
        docRef: invRef, 
        title: "Final Invoice",
        balanceDue,
        escrowEnabled: true 
      });
      db.prepare("INSERT INTO contracts (user_id, masterpiece_id, type, doc_ref, content, status) VALUES (?, ?, 'invoice', ?, ?, 'draft')").run(
        user.id, masterpieceId, invRef, invHtml
      );
      
      db.prepare(`
        INSERT INTO payments (user_id, masterpiece_id, type, amount, status, iban, reference)
        VALUES (?, ?, 'full', ?, 'awaiting_payment', 'DE35 2022 0800 0056 5751 78', ?)
      `).run(user.id, masterpieceId, balanceDue, invRef);
      break;
    case 'final_payment_paid':
    case 'final_payment_pending':
      updateField = "final_payment_pending_at";
      newStatus = "FUNDS_HELD";
      message = `Final payment received. Funds are now held in Escrow. Preparing for delivery.`;
      db.prepare("UPDATE payments SET status = 'paid' WHERE masterpiece_id = ? AND type = 'full'").run(masterpieceId);
      // Initialize Escrow only if not already present
      const existingEscrow = db.prepare("SELECT id FROM escrow_transactions WHERE masterpiece_id = ?").get(masterpieceId);
      if (!existingEscrow) {
        db.prepare(`
          INSERT INTO escrow_transactions (masterpiece_id, buyer_id, seller_id, amount, status, dispute_window_ends)
          VALUES (?, ?, 1, ?, 'HELD', datetime('now', '+2 days'))
        `).run(masterpieceId, user.id, piece.valuation);
      }
      break;
    case 'delivered':
    case 'ready_for_delivery':
      updateField = "ready_for_delivery_at";
      newStatus = "DELIVERED";
      message = `Your masterpiece ${piece.title} has been delivered. Please confirm receipt in your Vault to release escrow.`;
      break;
    case 'completed':
      updateField = "completed_at";
      newStatus = "COMPLETED";
      message = `Ownership of ${piece.title} has been officially transferred to you. Congratulations.`;
      
      // Release Escrow
      db.prepare("UPDATE escrow_transactions SET status = 'RELEASED' WHERE masterpiece_id = ?").run(masterpieceId);
      db.prepare("UPDATE masterpieces SET current_owner_id = ?, status = 'sold' WHERE id = ?").run(user.id, masterpieceId);
      
      updateProvenance(masterpieceId, 'ownership_transfer', `Ownership officially transferred to ${user.name}.`);

      // Generate Certificate of Authenticity; assign Registry ID if first time
      const regId = piece.registry_id || nextRegRef();
      if (!piece.registry_id) db.prepare("UPDATE masterpieces SET registry_id = ? WHERE id = ?").run(regId, masterpieceId);
      const certRef = nextCertRef();
      const certContent = `CERTIFICATE OF AUTHENTICITY & OWNERSHIP\n\nThis definitive instrument serves as the permanent record of provenance for the Masterpiece "${piece.title}".\n\nHandcrafted within the Antonio Bellanova Atelier, this asset is now officially registered to the collection of ${user.name}.\n\nAsset Specifications:\nSerial Number: ${piece.serial_id}\nRegistry ID: ${regId}\nBlockchain Hash: ${piece.blockchain_hash || 'AB-SECURE-HASH-772'}\n\nThe Atelier hereby guarantees the authenticity and exceptional quality of this unique creation in perpetuity.`;
      const certHtml = generateLuxuryDocument("Certificate of Authenticity", certContent, user, piece, { docRef: certRef, title: "Certificate of Authenticity", registryId: regId, registryUrl: `/registry/masterpiece/${masterpieceId}` });
      db.prepare("INSERT INTO contracts (user_id, masterpiece_id, type, doc_ref, content, status) VALUES (?, ?, 'certificate', ?, ?, 'signed')").run(
        user.id, masterpieceId, certRef, certHtml
      );

      // Trigger NFT Minting
      mintNFT(masterpieceId, user.id).then(tokenId => {
        broadcast({ type: 'NFT_MINTED', masterpieceId, tokenId, userId: user.id });
      }).catch(err => {
        console.error("NFT Minting failed:", err);
      });
      break;
  }

    if (updateField) {
      db.prepare(`UPDATE purchase_workflow SET ${updateField} = CURRENT_TIMESTAMP, status = ? WHERE masterpiece_id = ?`).run(newStatus, masterpieceId);
      notifyUser(workflow.user_id, message, "success");
      logAudit(adminId, 'WORKFLOW_UPDATE', masterpieceId.toString(), `Updated step ${step} to ${newStatus}`);
      broadcast({ type: 'WORKFLOW_UPDATED', masterpieceId, status: newStatus });
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Ungültiger Workflow-Schritt." });
    }
  } catch (err: any) {
    console.error("[workflow/update]", err);
    res.status(500).json({ error: err?.message || "Workflow-Update fehlgeschlagen." });
  }
});

app.get("/api/notifications/:userId", (req, res) => {
  const notifications = db.prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50").all(req.params.userId);
  res.json(notifications);
});

app.post("/api/notifications/:userId/read-all", (req, res) => {
  db.prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?").run(req.params.userId);
  res.json({ success: true });
});

app.get("/api/workflow/:masterpieceId", (req, res) => {
  const workflow = db.prepare("SELECT * FROM purchase_workflow WHERE masterpiece_id = ?").get(req.params.masterpieceId);
  res.json(workflow || null);
});

app.get("/api/escrow/:masterpieceId", (req, res) => {
  const escrow = db.prepare("SELECT * FROM escrow_transactions WHERE masterpiece_id = ? ORDER BY created_at DESC LIMIT 1").get(req.params.masterpieceId);
  res.json(escrow || null);
});

function closeEndedAuctions(): void {
  const ended = db.prepare("SELECT id, masterpiece_id, highest_bidder_id, current_bid FROM auctions WHERE status = 'active' AND end_time < datetime('now')").all() as any[];
  for (const a of ended) {
    db.prepare("UPDATE auctions SET status = 'ended' WHERE id = ?").run(a.id);
    if (a.highest_bidder_id) {
      const piece = db.prepare("SELECT title, valuation FROM masterpieces WHERE id = ?").get(a.masterpiece_id) as any;
      db.prepare("UPDATE masterpieces SET status = 'sold', current_owner_id = ? WHERE id = ?").run(a.highest_bidder_id, a.masterpiece_id);
      db.prepare("INSERT INTO ownership_history (masterpiece_id, owner_id, price) VALUES (?, ?, ?)").run(a.masterpiece_id, a.highest_bidder_id, a.current_bid);
      try {
        db.prepare("INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)").run(
          a.highest_bidder_id,
          `Sie haben die Auktion für "${piece?.title || "Stück"}" gewonnen. Unser Team wird sich in Kürze bei Ihnen melden.`,
          "success"
        );
      } catch (_) {}
      const winner = db.prepare("SELECT id, email, name, notification_prefs FROM users WHERE id = ?").get(a.highest_bidder_id) as any;
      if (winner && shouldSendEmailToUser(winner)) {
        sendMail(
          winner.email,
          "Antonio Bellanova – Sie haben die Auktion gewonnen",
          `Guten Tag ${winner.name || ""},\n\nHerzlichen Glückwunsch! Sie haben die Auktion für "${piece?.title || "Stück"}" mit ${Number(a.current_bid).toLocaleString("de-DE")} € gewonnen. Unser Team wird sich in Kürze bei Ihnen melden.\n\nMit freundlichen Grüßen\nIhr Atelier Antonio Bellanova`
        ).catch(() => {});
      }
    }
  }
}

// Auctions
app.get("/api/auctions", (req, res) => {
  closeEndedAuctions();
  const userId = req.query.userId;
  const user = userId ? db.prepare("SELECT * FROM users WHERE id = ?").get(userId) : null;
  const isVip = user && (user.role === 'vip' || user.role === 'admin');

  let query = `
    SELECT a.*, m.title, m.image_url, m.description 
    FROM auctions a 
    JOIN masterpieces m ON a.masterpiece_id = m.id 
    WHERE a.status = 'active'
  `;

  if (!isVip) {
    query += " AND a.vip_only = 0";
  }

  const activeAuctions = db.prepare(query).all();
  res.json(activeAuctions);
});

app.get("/api/auctions/my-bids", (req, res) => {
  const userId = Number(req.query.userId);
  if (!userId) return res.status(400).json({ error: "userId required" });
  const rows = db.prepare(`
    SELECT a.*, m.title, m.image_url, m.description,
           b.amount as my_bid_amount,
           (a.highest_bidder_id = ?) as is_leading
    FROM bids b
    JOIN auctions a ON b.auction_id = a.id
    JOIN masterpieces m ON a.masterpiece_id = m.id
    WHERE b.user_id = ? AND a.status = 'active'
    ORDER BY b.created_at DESC
  `).all(userId, userId);
  res.json(rows);
});

app.get("/api/auctions/:auctionId/bids", (req, res) => {
  const { auctionId } = req.params;
  const bids = db.prepare(`
    SELECT b.*, u.name as bidder_name 
    FROM bids b 
    JOIN users u ON b.user_id = u.id 
    WHERE b.auction_id = ? 
    ORDER BY b.amount DESC
  `).all(auctionId);
  res.json(bids);
});

app.post("/api/admin/auctions", (req, res) => {
  const { masterpieceId, startPrice, endTime, vipOnly, terms } = req.body;
  const result = db.prepare(`
    INSERT INTO auctions (masterpiece_id, start_price, current_bid, end_time, vip_only, terms)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(masterpieceId, startPrice, startPrice, endTime, vipOnly ? 1 : 0, terms || "Standard luxury auction terms apply. 10% buyer's premium. Secure transport included.");
  
  db.prepare("UPDATE masterpieces SET status = 'auction' WHERE id = ?").run(masterpieceId);
  updateProvenance(masterpieceId, 'auction', `Masterpiece listed for auction with starting price of ${startPrice} EUR.`);
  
  broadcast({ type: 'AUCTION_CREATED', id: result.lastInsertRowid });
  res.json({ id: result.lastInsertRowid });
});

app.post("/api/auctions/bid", (req, res) => {
  const { auctionId, userId, amount } = req.body;
  const auction = db.prepare("SELECT * FROM auctions WHERE id = ?").get(auctionId) as any;
  if (!auction) return res.status(404).json({ error: "Auction not found" });
  if (amount <= auction.current_bid) return res.status(400).json({ error: "Bid too low" });

  const previousHighestBidderId = auction.highest_bidder_id;
  const piece = db.prepare("SELECT title FROM masterpieces WHERE id = ?").get(auction.masterpiece_id) as any;
  const pieceTitle = piece?.title || "Stück";

  db.prepare("UPDATE auctions SET current_bid = ?, highest_bidder_id = ? WHERE id = ?").run(amount, userId, auctionId);
  db.prepare("INSERT INTO bids (auction_id, user_id, amount) VALUES (?, ?, ?)").run(auctionId, userId, amount);

  if (previousHighestBidderId && previousHighestBidderId !== userId) {
    const prevBidder = db.prepare("SELECT id, email, name, notification_prefs FROM users WHERE id = ?").get(previousHighestBidderId) as any;
    if (prevBidder && shouldSendEmailToUser(prevBidder)) {
      sendMail(
        prevBidder.email,
        "Antonio Bellanova – Sie wurden bei einer Auktion überboten",
        `Guten Tag ${prevBidder.name || ""},\n\nIhr Gebot für "${pieceTitle}" wurde überboten. Das aktuelle Höchstgebot beträgt ${Number(amount).toLocaleString("de-DE")} €.\n\nMit freundlichen Grüßen\nIhr Atelier Antonio Bellanova`
      ).catch(() => {});
    }
  }

  broadcast({ type: 'NEW_BID', auctionId, amount, userId });
  res.json({ success: true });
});

// Payments
app.get("/api/payments/:userId", (req, res) => {
  const payments = db.prepare("SELECT * FROM payments WHERE user_id = ?").all(req.params.userId);
  res.json(payments);
});

// Certificates
app.get("/api/certificates/:userId", (req, res) => {
  const certs = db.prepare("SELECT * FROM certificates WHERE owner_id = ?").all(req.params.userId);
  res.json(certs);
});

app.post("/api/admin/generate-certificate", (req, res) => {
  const { masterpieceId, adminId } = req.body;
  const piece = db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(masterpieceId);
  
  if (!piece || !piece.current_owner_id) {
    return res.status(400).json({ error: "Masterpiece must have an owner to generate a certificate." });
  }

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(piece.current_owner_id);
  const certId = nextCertRef();
  
  const certContent = `CERTIFICATE OF AUTHENTICITY & PROVENANCE\n\nThis definitive instrument serves as the permanent record of authenticity for the Masterpiece "${piece.title}".\n\nHandcrafted within the Antonio Bellanova Atelier, this asset is officially registered to the collection of ${user.name}.\n\nAsset Specifications:\nSerial Number: ${piece.serial_id}\nMaterials: ${piece.materials}\nGemstones: ${piece.gemstones}\nBlockchain Hash: ${piece.blockchain_hash || 'AB-SECURE-HASH-' + Math.random().toString(16).slice(2, 10).toUpperCase()}\n\nThe Atelier hereby guarantees the authenticity and exceptional quality of this unique creation in perpetuity.`;
  
  const regId = piece.registry_id || nextRegRef();
  if (!piece.registry_id) db.prepare("UPDATE masterpieces SET registry_id = ? WHERE id = ?").run(regId, masterpieceId);
  const certHtml = generateLuxuryDocument("Certificate of Authenticity", certContent, user, piece, { 
    docRef: certId, 
    title: "Certificate of Authenticity",
    registryId: regId,
    registryUrl: `/registry/masterpiece/${masterpieceId}`
  });

  try {
    db.prepare("INSERT INTO certificates (masterpiece_id, owner_id, cert_id, content, signature, blockchain_hash) VALUES (?, ?, ?, ?, ?, ?)").run(
      masterpieceId, user.id, certId, certHtml, 'DIGITAL_SIG_ANTONIO_BELLANOVA', piece.blockchain_hash || '0x' + Math.random().toString(16).slice(2)
    );
    
    updateProvenance(masterpieceId, 'certificate', `Official Certificate of Authenticity issued by Antonio Bellanova (ID: ${certId}).`);
    calculateRarityScore(masterpieceId);
    logAudit(adminId, 'GENERATE_CERTIFICATE', masterpieceId.toString(), `Generated COA for user ${user.id}`);
    
    broadcast({ type: 'CERTIFICATE_GENERATED', userId: user.id, masterpieceId });
    res.json({ success: true, certId });
  } catch (e) {
    res.status(500).json({ error: "Failed to generate certificate. It may already exist." });
  }
});

app.post("/api/admin/confirm-payment", (req, res) => {
  const { paymentId } = req.body;
  const payment = db.prepare("SELECT * FROM payments WHERE id = ?").get(paymentId);
  db.prepare("UPDATE payments SET status = 'paid' WHERE id = ?").run(paymentId);
  
  db.prepare("UPDATE masterpieces SET status = 'sold', current_owner_id = ? WHERE id = ?").run(
    payment.user_id, payment.masterpiece_id
  );
  db.prepare("INSERT INTO ownership_history (masterpiece_id, owner_id, price) VALUES (?, ?, ?)").run(
    payment.masterpiece_id, payment.user_id, payment.amount
  );
  
  const certId = `CERT-${payment.masterpiece_id}-${Date.now()}`;
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(payment.user_id);
  const piece = db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(payment.masterpiece_id);
  
  const certContent = `
    ECHTHEITSZERTIFIKAT / CERTIFICATE OF AUTHENTICITY
    
    STÜCKINFORMATIONEN:
    Titel: ${piece.title}
    Serien-ID: ${piece.serial_id}
    Materialien: ${piece.materials}
    Edelsteine: ${piece.gemstones}
    
    KÄUFER:
    Name: ${user.name}
    Adresse: ${user.address}
    
    VERKÄUFER:
    Juwelen & Schmuckatelier Antonio Bellanova
    Ahorstraße 8, 50765 Köln, Deutschland
    
    Dieses Zertifikat bestätigt die Echtheit und den rechtmäßigen Erwerb des oben genannten Meisterwerks.
    
    Ausstellungsdatum: ${new Date().toLocaleDateString('de-DE')}
    Zertifikats-ID: ${certId}
  `;

  db.prepare("INSERT INTO certificates (masterpiece_id, owner_id, cert_id, content, signature, blockchain_hash) VALUES (?, ?, ?, ?, ?, ?)").run(
    payment.masterpiece_id, payment.user_id, certId, certContent, 'DIGITAL_SIG_AB', '0x' + Math.random().toString(16).slice(2)
  );
  
  updateProvenance(payment.masterpiece_id, 'certificate', `Certificate of Authenticity issued (ID: ${certId}).`);
  calculateRarityScore(payment.masterpiece_id);

  broadcast({ type: 'PAYMENT_CONFIRMED', paymentId, masterpieceId: payment.masterpiece_id });
  res.json({ success: true });
});

// Vault Data
app.get("/api/vault/:userId", (req, res) => {
  const userId = req.params.userId;
  const pieces = db.prepare("SELECT * FROM masterpieces WHERE current_owner_id = ?").all(userId);
  const certs = db.prepare("SELECT * FROM certificates WHERE owner_id = ?").all(userId);
  const contracts = db.prepare("SELECT * FROM contracts WHERE user_id = ?").all(userId);
  const hiddenRows = db.prepare("SELECT masterpiece_id FROM user_portfolio_hidden WHERE user_id = ?").all(userId) as { masterpiece_id: number }[];
  const portfolio_hidden_ids = hiddenRows.map((r) => r.masterpiece_id);
  res.json({ pieces, certs, contracts, portfolio_hidden_ids });
});

// Portfolio: Stück aus Anzeige entfernen / wieder anzeigen (nur Besitzer)
app.post("/api/portfolio/hide", (req, res) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ error: "Nicht angemeldet." });
  const { masterpieceId } = req.body || {};
  const id = Number(masterpieceId);
  if (!id) return res.status(400).json({ error: "masterpieceId erforderlich." });
  const piece = db.prepare("SELECT current_owner_id FROM masterpieces WHERE id = ?").get(id) as { current_owner_id: number } | undefined;
  if (!piece || piece.current_owner_id !== userId) return res.status(403).json({ error: "Nur das eigene Stück kann ausgeblendet werden." });
  try {
    db.prepare("INSERT OR IGNORE INTO user_portfolio_hidden (user_id, masterpiece_id) VALUES (?, ?)").run(userId, id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Fehler beim Ausblenden." });
  }
});

app.post("/api/portfolio/unhide", (req, res) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ error: "Nicht angemeldet." });
  const { masterpieceId } = req.body || {};
  const id = Number(masterpieceId);
  if (!id) return res.status(400).json({ error: "masterpieceId erforderlich." });
  db.prepare("DELETE FROM user_portfolio_hidden WHERE user_id = ? AND masterpiece_id = ?").run(userId, id);
  res.json({ success: true });
});

// Admin Dashboard Stats (incl. piece views, popular pieces, contact requests)
app.get("/api/admin/stats", (req, res) => {
  const totalRevenue = db.prepare("SELECT SUM(amount) as total FROM payments WHERE status = 'paid'").get().total || 0;
  const activeUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'approved'").get().count;
  const pendingApprovals = db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'pending'").get().count;
  const pendingPayments = db.prepare("SELECT COUNT(*) as count FROM payments WHERE status = 'pending'").get().count;
  const pieceViewsTotal = (db.prepare("SELECT COUNT(*) as c FROM asset_views").get() as { c: number })?.c ?? 0;
  const contactRequestsCount = (db.prepare("SELECT COUNT(*) as c FROM contact_requests").get() as { c: number })?.c ?? 0;
  const contactRequestsLast30Days = (db.prepare("SELECT COUNT(*) as c FROM contact_requests WHERE created_at >= datetime('now', '-30 days')").get() as { c: number })?.c ?? 0;
  const popularPieces = db.prepare(`
    SELECT m.id as masterpiece_id, m.title, m.serial_id,
           (SELECT COUNT(*) FROM asset_views av WHERE av.masterpiece_id = m.id) as views,
           (SELECT COUNT(*) FROM user_favorites uf WHERE uf.masterpiece_id = m.id) as favorites
    FROM masterpieces m
    ORDER BY views + (SELECT COUNT(*) FROM user_favorites uf WHERE uf.masterpiece_id = m.id) DESC
    LIMIT 10
  `).all() as any[];
  res.json({
    totalRevenue,
    activeUsers,
    pendingApprovals,
    pendingPayments,
    pieceViewsTotal,
    contactRequestsCount,
    contactRequestsLast30Days,
    popularPieces: popularPieces.map(p => ({ masterpiece_id: p.masterpiece_id, title: p.title, serial_id: p.serial_id, views: p.views ?? 0, favorites: p.favorites ?? 0 }))
  });
});

app.get("/api/admin/users", (req, res) => {
  const users = db.prepare("SELECT * FROM users").all();
  res.json(users);
});

app.get("/api/admin/contracts", (req, res) => {
  const contracts = db.prepare(`
    SELECT c.*, u.name as user_name, m.title as piece_title
    FROM contracts c
    JOIN users u ON c.user_id = u.id
    LEFT JOIN masterpieces m ON c.masterpiece_id = m.id
  `).all();
  res.json(contracts);
});

app.post("/api/admin/contracts/regenerate", (req, res) => {
  try {
    const all = db.prepare("SELECT * FROM contracts ORDER BY id").all() as any[];
    const updateStmt = db.prepare("UPDATE contracts SET content = ? WHERE id = ?");
    let updated = 0;
    const skipped: { id: number; type: string; reason: string }[] = [];
    for (const c of all) {
      const newContent = regenerateContractContent(c);
      if (newContent) {
        updateStmt.run(newContent, c.id);
        updated++;
      } else {
        skipped.push({ id: c.id, type: c.type || 'unknown', reason: 'type not supported or missing user/piece' });
      }
    }
    res.json({ success: true, total: all.length, updated, skipped });
  } catch (err: any) {
    console.error("[admin/contracts/regenerate]", err);
    res.status(500).json({ error: err?.message || "Regenerierung fehlgeschlagen." });
  }
});

app.get("/api/admin/audit-logs", (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const rows = db.prepare(`
    SELECT al.*, u.name as admin_name FROM audit_logs al
    LEFT JOIN users u ON al.admin_id = u.id
    ORDER BY al.created_at DESC LIMIT ?
  `).all(limit);
  res.json(rows);
});

app.get("/api/admin/audit-logs/export", (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 2000, 5000);
  const rows = db.prepare(`
    SELECT al.id, al.admin_id, al.action, al.target_id, al.details, al.created_at, u.name as admin_name FROM audit_logs al
    LEFT JOIN users u ON al.admin_id = u.id
    ORDER BY al.created_at DESC LIMIT ?
  `).all(limit) as any[];
  const header = "id;admin_id;admin_name;action;target_id;details;created_at\n";
  const escape = (v: any) => (v == null ? "" : String(v).replace(/"/g, '""'));
  const lines = rows.map(r => [r.id, r.admin_id, r.admin_name, r.action, r.target_id, r.details, r.created_at].map(escape).join(";"));
  const csv = header + lines.join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=audit-log.csv");
  res.send("\uFEFF" + csv);
});

// Admin: Database backup (admin/super_admin only)
app.get("/api/admin/backup", async (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) return res.status(401).json({ error: "Nicht angemeldet." });
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
  if (!user || (user.role !== "admin" && user.role !== "super_admin"))
    return res.status(403).json({ error: "Nur für Administratoren." });
  const backupPath = path.join(__dirname, `vault-backup-${Date.now()}.db`);
  try {
    await (db as any).backup(backupPath);
    const filename = `antonio-bellanova-vault-${new Date().toISOString().slice(0, 10)}.db`;
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.sendFile(backupPath, (err) => {
      try { fs.unlinkSync(backupPath); } catch (_) {}
      if (err && !res.headersSent) res.status(500).json({ error: "Backup-Download fehlgeschlagen." });
    });
  } catch (e) {
    try { fs.unlinkSync(backupPath); } catch (_) {}
    res.status(500).json({ error: "Backup fehlgeschlagen." });
  }
});

// Service requests (customer submits, admin lists)
app.post("/api/service/request", (req, res) => {
  const { userId, masterpieceId, type, description } = req.body;
  if (!userId || !type) return res.status(400).json({ error: "userId and type required" });
  db.prepare("INSERT INTO service_requests (user_id, masterpiece_id, type, description, status) VALUES (?, ?, ?, ?, 'pending')").run(userId, masterpieceId || null, type, description || null);
  res.json({ success: true });
});

app.get("/api/admin/service-requests", (req, res) => {
  const rows = db.prepare(`
    SELECT sr.*, u.name as user_name, u.email as user_email, m.title as masterpiece_title, m.serial_id
    FROM service_requests sr
    JOIN users u ON sr.user_id = u.id
    LEFT JOIN masterpieces m ON sr.masterpiece_id = m.id
    ORDER BY sr.created_at DESC
  `).all();
  res.json(rows);
});

app.get("/api/admin/contact-requests", (req, res) => {
  const rows = db.prepare("SELECT * FROM contact_requests ORDER BY created_at DESC").all();
  res.json(rows);
});

app.get("/api/admin/contact-requests/export", (req, res) => {
  const rows = db.prepare("SELECT id, name, email, subject, message, created_at FROM contact_requests ORDER BY created_at DESC").all() as any[];
  const headers = ['id', 'name', 'email', 'subject', 'message', 'created_at'];
  const escape = (v: any) => (v == null ? '' : String(v).replace(/"/g, '""'));
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${escape(r[h])}"`).join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="antonio-bellanova-contact-requests.csv"');
  res.send('\uFEFF' + csv);
});

app.patch("/api/admin/service-requests/:id", (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;
  const row = db.prepare("SELECT * FROM service_requests WHERE id = ?").get(id);
  if (!row) return res.status(404).json({ error: "Not found" });
  db.prepare("UPDATE service_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(status || "completed", id);
  res.json({ success: true });
});

// Contract/Certificate premium download (HTML for Print to PDF)
app.get("/api/contracts/:id/download", (req, res) => {
  const c = db.prepare("SELECT * FROM contracts WHERE id = ?").get(req.params.id) as any;
  if (!c) return res.status(404).send("Contract not found");
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(c.user_id) as any;
  const piece = c.masterpiece_id ? db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(c.masterpiece_id) as any : null;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${c.doc_ref || 'Contract'}</title><style>body{margin:0;background:#0d0d0d;}</style></head><body>${c.content || ''}</body></html>`;
  const filename = `Antonio-Bellanova-${String(c.doc_ref || c.id).replace(/\s/g, '-')}.html`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(html);
});

// Admin: sales overview (name, email, country/address)
app.get("/api/admin/sales", (req, res) => {
  const rows = db.prepare(`
    SELECT p.id as payment_id, p.user_id, p.masterpiece_id, p.type as payment_type, p.amount, p.status as payment_status, p.created_at,
           u.name, u.email, u.address,
           m.title as masterpiece_title, m.serial_id
    FROM payments p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN masterpieces m ON p.masterpiece_id = m.id
    ORDER BY p.created_at DESC
  `).all();
  res.json(rows);
});

// Admin: bank config (simple key-value store)
db.exec(`CREATE TABLE IF NOT EXISTS admin_config (key TEXT PRIMARY KEY, value TEXT);`);
app.get("/api/admin/bank-config", (req, res) => {
  const row = db.prepare("SELECT value FROM admin_config WHERE key = 'bank_config'").get();
  res.json(row ? JSON.parse(row.value) : {});
});
app.post("/api/admin/bank-config", (req, res) => {
  const value = JSON.stringify(req.body || {});
  db.prepare("INSERT INTO admin_config (key, value) VALUES ('bank_config', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(value);
  res.json({ success: true });
});

// --- Contact form (public) ---
app.post("/api/contact", (req, res) => {
  const { name, email, subject, message } = req.body || {};
  if (!name || !email || !message) return res.status(400).json({ error: "Name, E-Mail und Nachricht sind erforderlich." });
  db.prepare("INSERT INTO contact_requests (name, email, subject, message) VALUES (?, ?, ?, ?)").run(
    String(name).trim(),
    String(email).trim(),
    subject ? String(subject).trim() : null,
    String(message).trim()
  );
  const adminEmail = process.env.ADMIN_EMAIL || process.env.CONTACT_ADMIN_EMAIL;
  if (adminEmail && typeof adminEmail === "string" && adminEmail.trim()) {
    sendMail(
      adminEmail.trim(),
      `Antonio Bellanova – Neue Kontaktanfrage${subject ? `: ${String(subject).slice(0, 50)}` : ""}`,
      `Neue Kontaktanfrage über das Portal:\n\nVon: ${name}\nE-Mail: ${email}\n${subject ? `Betreff: ${subject}\n` : ""}\nNachricht:\n${message}\n\n– Antonio Bellanova Vault`
    ).catch(() => {});
  }
  res.json({ success: true });
});

// --- Public: Certificate verification (no auth) ---
app.get("/api/verify/certificate/:certId", (req, res) => {
  const cert = db.prepare("SELECT * FROM certificates WHERE cert_id = ?").get(req.params.certId) as any;
  if (!cert) return res.status(404).json({ error: "Certificate not found" });
  const piece = cert.masterpiece_id ? db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(cert.masterpiece_id) as any : null;
  const owner = db.prepare("SELECT id, name FROM users WHERE id = ?").get(cert.owner_id) as any;
  res.json({ cert, piece, owner_name: owner?.name ?? null });
});

// --- Profile: language & notification prefs ---
app.patch("/api/users/me", (req, res) => {
  const { userId, language, notification_prefs } = req.body;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const u = db.prepare("SELECT id FROM users WHERE id = ?").get(userId);
  if (!u) return res.status(404).json({ error: "User not found" });
  if (language != null) db.prepare("UPDATE users SET language = ? WHERE id = ?").run(language, userId);
  if (notification_prefs != null) db.prepare("UPDATE users SET notification_prefs = ? WHERE id = ?").run(typeof notification_prefs === 'string' ? notification_prefs : JSON.stringify(notification_prefs), userId);
  res.json({ success: true });
});

// --- Passwort ändern (eingeloggter User) ---
app.post("/api/users/me/change-password", (req, res) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ error: "Nicht angemeldet." });
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword || typeof newPassword !== "string" || newPassword.length < 6)
    return res.status(400).json({ error: "Aktuelles Passwort und neues Passwort (min. 6 Zeichen) erforderlich." });
  const user = db.prepare("SELECT id, password FROM users WHERE id = ?").get(userId) as any;
  if (!user || !checkPassword(String(currentPassword), user.password || ""))
    return res.status(400).json({ error: "Aktuelles Passwort ist falsch." });
  db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashPassword(newPassword), userId);
  res.json({ success: true });
});

// --- DSGVO: Export my data ---
app.get("/api/me/export", (req, res) => {
  const userId = Number(req.query.userId);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const user = db.prepare("SELECT id, email, name, address, role, language, created_at FROM users WHERE id = ?").get(userId) as any;
  if (!user) return res.status(404).json({ error: "User not found" });
  const pieces = db.prepare("SELECT id, serial_id, title, valuation, status FROM masterpieces WHERE current_owner_id = ?").all(userId);
  const contracts = db.prepare("SELECT id, type, doc_ref, status, created_at FROM contracts WHERE user_id = ?").all(userId);
  const certs = db.prepare("SELECT cert_id, masterpiece_id, created_at FROM certificates WHERE owner_id = ?").all(userId);
  const payload = { exported_at: new Date().toISOString(), user, pieces, contracts, certificates: certs };
  res.setHeader("Content-Disposition", `attachment; filename="antonio-bellanova-data-export-${userId}.json"`);
  res.json(payload);
});

// --- Portfolio CSV export (logged-in user's pieces) ---
app.get("/api/portfolio/export", (req, res) => {
  const userId = Number(req.query.userId);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const user = db.prepare("SELECT id, name, email FROM users WHERE id = ?").get(userId) as any;
  if (!user) return res.status(404).json({ error: "User not found" });
  const rows = db.prepare("SELECT id, serial_id, title, category, materials, gemstones, valuation, rarity, status, created_at FROM masterpieces WHERE current_owner_id = ? ORDER BY id").all(userId) as any[];
  const headers = ['id', 'serial_id', 'title', 'category', 'materials', 'gemstones', 'valuation', 'rarity', 'status', 'created_at'];
  const escape = (v: any) => (v == null ? '' : String(v).replace(/"/g, '""'));
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${escape(r[h])}"`).join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="antonio-bellanova-portfolio-${userId}.csv"`);
  res.send('\uFEFF' + csv);
});

// --- Atelier Moments (editorial) ---
app.get("/api/atelier-moments", (req, res) => {
  const row = db.prepare("SELECT value FROM admin_config WHERE key = 'atelier_moments'").get();
  const list = row ? JSON.parse((row as any).value) : [];
  res.json(Array.isArray(list) ? list : []);
});
app.post("/api/admin/atelier-moments", (req, res) => {
  const value = JSON.stringify(req.body && Array.isArray(req.body) ? req.body : []);
  db.prepare("INSERT INTO admin_config (key, value) VALUES ('atelier_moments', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(value);
  res.json({ success: true });
});

// Admin: inventory CSV export
app.get("/api/admin/inventory/export", (req, res) => {
  const pieces = db.prepare("SELECT id, serial_id, registry_id, title, category, materials, gemstones, valuation, rarity, status, current_owner_id, transfer_type, warranty_void, created_at FROM masterpieces ORDER BY id").all() as any[];
  const headers = ['id', 'serial_id', 'registry_id', 'title', 'category', 'materials', 'gemstones', 'valuation', 'rarity', 'status', 'current_owner_id', 'transfer_type', 'warranty_void', 'created_at'];
  const escape = (v: any) => (v == null ? '' : String(v).replace(/"/g, '""'));
  const csv = [headers.join(','), ...pieces.map(p => headers.map(h => `"${escape(p[h])}"`).join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="antonio-bellanova-inventory.csv"');
  res.send('\uFEFF' + csv);
});

// Admin CEO: auction export CSV
app.get("/api/admin/auctions/export", (req, res) => {
  const rows = db.prepare(`
    SELECT a.id, a.masterpiece_id, m.serial_id, m.title, a.start_price, a.current_bid, a.highest_bidder_id, u.name as winner_name, u.email as winner_email, a.end_time, a.status, a.vip_only
    FROM auctions a
    LEFT JOIN masterpieces m ON a.masterpiece_id = m.id
    LEFT JOIN users u ON a.highest_bidder_id = u.id
    ORDER BY a.id DESC
  `).all() as any[];
  const headers = ['id', 'masterpiece_id', 'serial_id', 'title', 'start_price', 'current_bid', 'highest_bidder_id', 'winner_name', 'winner_email', 'end_time', 'status', 'vip_only'];
  const escape = (v: any) => (v == null ? '' : String(v).replace(/"/g, '""'));
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${escape(r[h])}"`).join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="antonio-bellanova-auctions.csv"');
  res.send('\uFEFF' + csv);
});

// Admin CEO: revenue dashboard (aggregate revenue_ledger + payments)
app.get("/api/admin/revenue-dashboard", (req, res) => {
  const ledger = db.prepare("SELECT type, SUM(amount) as total FROM revenue_ledger GROUP BY type").all() as any[];
  const byType = ledger.reduce((acc: Record<string, number>, r) => { acc[r.type] = r.total; return acc; }, {});
  const paymentsDeposit = db.prepare("SELECT COALESCE(SUM(amount), 0) as t FROM payments WHERE type = 'deposit' AND status = 'paid'").get() as any;
  const paymentsFull = db.prepare("SELECT COALESCE(SUM(amount), 0) as t FROM payments WHERE type = 'full' AND status = 'paid'").get() as any;
  const resaleRevenue = (db.prepare("SELECT COALESCE(SUM(amount), 0) as t FROM revenue_ledger WHERE type = 'resale_fee'").get() as any).t || 0;
  res.json({
    by_type: byType,
    total_resale_fee: resaleRevenue,
    deposits_received: paymentsDeposit.t || 0,
    full_payments_received: paymentsFull.t || 0,
    total_ledger: (db.prepare("SELECT COALESCE(SUM(amount), 0) as t FROM revenue_ledger").get() as any).t || 0,
  });
});

// Admin CEO: cashflow tracking (in/out summary)
app.get("/api/admin/cashflow", (req, res) => {
  const payments = db.prepare("SELECT type, status, SUM(amount) as total FROM payments GROUP BY type, status").all() as any[];
  const revenue = db.prepare("SELECT type, SUM(amount) as total FROM revenue_ledger GROUP BY type").all() as any[];
  res.json({ payments_by_type_status: payments, revenue_by_type: revenue });
});

// Admin CEO: resale revenue tracking
app.get("/api/admin/resale-revenue", (req, res) => {
  const rows = db.prepare(`
    SELECT rl.id, rl.type, rl.amount, rl.masterpiece_id, rl.reference_id, rl.created_at, m.title, m.serial_id
    FROM revenue_ledger rl
    LEFT JOIN masterpieces m ON rl.masterpiece_id = m.id
    WHERE rl.type = 'resale_fee'
    ORDER BY rl.created_at DESC
  `).all();
  const total = (db.prepare("SELECT COALESCE(SUM(amount), 0) as t FROM revenue_ledger WHERE type = 'resale_fee'").get() as any).t || 0;
  res.json({ entries: rows, total_resale_revenue: total });
});

// GDPR: consent tracking
app.post("/api/gdpr/consent", (req, res) => {
  const { userId, consentType, ipAddress, version } = req.body;
  db.prepare("INSERT INTO consent_log (user_id, consent_type, ip_address, version) VALUES (?, ?, ?, ?)").run(
    userId, consentType || 'platform_terms', ipAddress || null, version || '1.0'
  );
  res.json({ success: true });
});
app.get("/api/gdpr/consent/:userId", (req, res) => {
  const rows = db.prepare("SELECT * FROM consent_log WHERE user_id = ? ORDER BY granted_at DESC").all(req.params.userId);
  res.json(rows);
});
app.post("/api/gdpr/data-request", (req, res) => {
  const { userId, requestType } = req.body;
  const r = db.prepare("INSERT INTO data_access_requests (user_id, request_type) VALUES (?, ?)").run(userId, requestType || 'export');
  res.json({ success: true, id: r.lastInsertRowid });
});
app.get("/api/admin/gdpr/data-requests", (req, res) => {
  const rows = db.prepare("SELECT dar.*, u.name, u.email FROM data_access_requests dar JOIN users u ON u.id = dar.user_id ORDER BY dar.requested_at DESC").all();
  res.json(rows);
});
app.post("/api/admin/gdpr/data-request/:id/complete", (req, res) => {
  const { status, responseDetails } = req.body;
  db.prepare("UPDATE data_access_requests SET status = ?, completed_at = CURRENT_TIMESTAMP, response_details = ? WHERE id = ?").run(
    status || 'completed', responseDetails || null, req.params.id
  );
  res.json({ success: true });
});

// Digital Asset Registry: full record (prestige, demand, rarity, ownership badge)
app.get("/api/registry/masterpiece/:id", (req, res) => {
  const piece = db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(req.params.id) as any;
  if (!piece) return res.status(404).json({ error: "Masterpiece not found" });
  const ownership = db.prepare("SELECT oh.*, u.name as owner_name, u.email as owner_email FROM ownership_history oh LEFT JOIN users u ON u.id = oh.owner_id WHERE oh.masterpiece_id = ? ORDER BY oh.acquired_at ASC").all(req.params.id) as any[];
  const service = db.prepare("SELECT * FROM service_history WHERE masterpiece_id = ? ORDER BY service_date DESC").all(req.params.id);
  const provenance = db.prepare("SELECT * FROM provenance_timeline WHERE masterpiece_id = ? ORDER BY event_date ASC").all(req.params.id);
  const holdMonths = ownership.length ? (Date.now() - new Date(ownership[ownership.length - 1].acquired_at).getTime()) / (30 * 24 * 60 * 60 * 1000) : 0;
  const bidCount = (db.prepare("SELECT COUNT(*) as c FROM bids b JOIN auctions a ON b.auction_id = a.id WHERE a.masterpiece_id = ?").get(piece.id) as any)?.c ?? 0;
  const viewCount = (db.prepare("SELECT COUNT(*) as c FROM asset_views WHERE masterpiece_id = ?").get(piece.id) as any)?.c ?? 0;
  const prestigeScore = piece.prestige_score ?? piece.rarity_score ?? 0;
  const demandScore = Math.min(100, Math.round(bidCount * 8 + viewCount * 0.5));
  const rarityLevel = piece.rarity || 'Standard';
  const ownershipBadge = ownership.length === 0 ? 'Atelier' : ownership.length === 1 ? 'First Owner' : 'Multi-Owner';
  const valueDevelopment = ownership.length >= 2 ? ownership.map((o, i) => ({ at: o.acquired_at, price: o.price })) : [];
  res.json({
    registry_id: piece.registry_id || null,
    serial_id: piece.serial_id,
    production_year: piece.created_at ? new Date(piece.created_at).getFullYear() : null,
    materials: piece.materials,
    gemstones: piece.gemstones,
    ownership_history: ownership,
    service_history: service,
    prestige_score: prestigeScore,
    demand_score: demandScore,
    rarity_level: rarityLevel,
    ownership_history_badge: ownershipBadge,
    prestige_metrics: { hold_months: Math.round(holdMonths * 10) / 10, service_count: service.length },
    value_development: valueDevelopment,
    market_status: piece.status,
    transfer_type: piece.transfer_type || 'platform',
    warranty_void: piece.warranty_void === 1,
    provenance_timeline: provenance,
    valuation: piece.valuation,
    title: piece.title,
    category: piece.category,
  });
});

app.post("/api/admin/clients/add", (req, res) => {
  const { email, name, address, role, isVip } = req.body;
  const token = Math.random().toString(36).substring(2, 15);
  try {
    const hashed = hashPassword(token);
    const result = db.prepare("INSERT INTO users (email, name, address, role, is_vip, status, password) VALUES (?, ?, ?, ?, ?, 'approved', ?)").run(
      email, name, address, role || 'client', isVip ? 1 : 0, hashed
    );
    notifyUser(result.lastInsertRowid, "Welcome to the Antonio Bellanova Atelier. Your private vault has been created.", "success");
    res.json({ id: result.lastInsertRowid, token });
  } catch (e) {
    res.status(400).json({ error: "Email already exists" });
  }
});

app.post("/api/admin/approve-user", (req, res) => {
  const { userId, approve } = req.body;
  if (approve) {
    db.prepare("UPDATE users SET status = 'approved' WHERE id = ?").run(userId);
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    if (user.is_vip) {
      const docRef = nextContractRef('vip');
      const vipContent = `VIP MEMBERSHIP AGREEMENT (€15,000 annual)\n\nThis agreement grants ${user.name} VIP membership to the Antonio Bellanova Atelier.\n\nBenefits: 48h Early Access to new creations; Private Auction Access; Concierge Service; Repair priority; Reduced Resale Commission (6%); Invite-Only Events. Duration and cancellation rules as per Platform Terms.`;
      const dummyPiece = { serial_id: 'VIP', title: 'VIP Membership', materials: '—', gemstones: '—', valuation: 15000, status: 'active', description: 'VIP Annual Membership', blockchain_hash: '' };
      const content = generateLuxuryDocument("VIP Membership Agreement", vipContent, user, dummyPiece, { docRef, title: "VIP Membership Agreement" });
      db.prepare("INSERT INTO contracts (user_id, type, doc_ref, content) VALUES (?, 'vip', ?, ?)").run(userId, docRef, content);
    }
  } else {
    db.prepare("UPDATE users SET status = 'rejected' WHERE id = ?").run(userId);
  }
  res.json({ success: true });
});

// --- Resale & Maison Commission ---
const RESALE_COMMISSION_RATES: Record<string, number> = { client: 8, investor: 8, viewer: 8, reseller: 8, vip: 6, royal: 5, black: 5, admin: 8, super_admin: 8 };

function resaleAudit(resaleListingId: number, action: string, adminId?: number, details?: string) {
  try {
    db.prepare("INSERT INTO resale_audit_log (resale_listing_id, action, admin_id, details) VALUES (?, ?, ?, ?)").run(
      resaleListingId, action, adminId ?? null, details ?? null
    );
  } catch (_) {}
}

function computePrestigeResaleMetrics(masterpieceId: number, currentValuation: number): { prestige_score: number; market_stability_score: number; price_recommendation: number } {
  const piece = db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(masterpieceId) as any;
  const ownershipRows = db.prepare("SELECT * FROM ownership_history WHERE masterpiece_id = ? ORDER BY acquired_at ASC").all(masterpieceId) as any[];
  const serviceCount = (db.prepare("SELECT COUNT(*) as c FROM service_history WHERE masterpiece_id = ?").get(masterpieceId) as any).c ?? 0;
  const bidCount = (db.prepare("SELECT COUNT(*) as c FROM bids b JOIN auctions a ON b.auction_id = a.id WHERE a.masterpiece_id = ?").get(masterpieceId) as any).c ?? 0;
  const firstAcquired = ownershipRows.length ? new Date(ownershipRows[0].acquired_at).getTime() : Date.now();
  const holdDays = Math.max(0, (Date.now() - firstAcquired) / (1000 * 60 * 60 * 24));
  const prestigeBase = (piece?.prestige_score != null ? Number(piece.prestige_score) : (piece?.rarity_score ?? 0) * 2.5) || 50;
  const holdFactor = Math.min(1.2, 1 + holdDays / 365 * 0.1);
  const serviceFactor = 1 + Math.min(0.15, serviceCount * 0.03);
  const demandFactor = 1 + Math.min(0.2, bidCount * 0.02);
  const prestige_score = Math.round(Math.min(100, prestigeBase * holdFactor * serviceFactor * 0.95 + demandFactor * 5));
  const market_stability_score = Math.round(Math.min(100, 50 + holdDays / 30 * 2 + serviceCount * 3 - Math.abs(bidCount - 2) * 2));
  const originalPrice = ownershipRows.length && ownershipRows[ownershipRows.length - 1].price != null ? Number(ownershipRows[ownershipRows.length - 1].price) : currentValuation;
  const price_recommendation = Math.round(currentValuation * (1 + holdDays / 365 * 0.02) * serviceFactor * 0.98);
  return { prestige_score, market_stability_score, price_recommendation };
}

function generateResaleCommissionAgreement(piece: any, owner: any, options: { commissionPct: number; saleMethod: string; docRef: string }) {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const content = `
RESALE COMMISSION AGREEMENT

This agreement governs the secondary market sale of the asset identified below through the Antonio Bellanova Vault platform.

ASSET: ${piece.title}
SERIAL: ${piece.serial_id || '—'}
ASSET ID: ${piece.id}
CURRENT OWNER: ${owner.name}

SALE METHOD: ${options.saleMethod === 'auction' ? 'Auction' : 'Marketplace'}

COMMISSION: The Maison shall retain ${options.commissionPct}% of the final sale price as commission. The remainder shall be paid to the Seller after authenticity verification and release by the Maison.

PAYMENT FLOW: Sale proceeds are held in escrow until (i) authenticity verification by the Atelier, (ii) Maison release approval, and (iii) transfer of ownership. The commission is deducted at release; the net amount is transferred to the Seller.

MAISON RELEASE: The Maison reserves the right to verify authenticity and condition before authorising release of funds and transfer of ownership. The Maison may refuse release if the asset does not meet authenticity or condition standards.

AUTHENTICITY: The Seller warrants that the asset is authentic and unaltered. The Atelier will perform an authenticity check before completion. This is mandatory.

LIABILITY: The Maison acts as intermediary and authenticator. The Maison does not guarantee the accuracy of third-party valuations. Liability is limited as set out in the platform terms.

CERTIFIED RESALE BENEFITS: Only when resale is conducted through the Antonio Bellanova Vault platform will the Registry be updated, a new Certificate of Authenticity be issued, the Maison warranty remain valid, the Prestige Score remain active, and the Service History remain linked to the asset. A sale outside the platform does not constitute a prohibition of external disposal; however, if the asset is transferred externally, the Registry will be marked as "externally transferred", no automatic update or new certificate will be issued, the warranty will lapse, and Prestige tracking will be discontinued.

DATE: ${date}
  `.trim();
  return generateLuxuryDocument("Resale Commission Agreement", content, owner, piece, { docRef: options.docRef, title: "Resale Commission Agreement" });
}

// Contracts
app.post("/api/contracts/sign", (req, res) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Bitte erneut anmelden." });
    }
    const contractId = Number(req.body?.contractId);
    const method = String(req.body?.method || "").trim();
    const data = typeof req.body?.data === "string" ? req.body.data : "";
    if (!contractId || isNaN(contractId)) {
      return res.status(400).json({ error: "Ungültige Vertrags-ID." });
    }
    if (!["typed", "drawn", "email"].includes(method) || !data) {
      return res.status(400).json({ error: "Bitte Signaturmethode wählen und gültige Signatur angeben." });
    }
    if (method === "drawn" && data.length < 100) {
      return res.status(400).json({ error: "Bitte zeichnen Sie Ihre Signatur im dafür vorgesehenen Feld." });
    }
    if (method === "typed" && data.trim().length < 2) {
      return res.status(400).json({ error: "Bitte geben Sie Ihren vollständigen Namen ein." });
    }

    const contract = db.prepare("SELECT * FROM contracts WHERE id = ?").get(contractId) as any;
    if (!contract) {
      return res.status(404).json({ error: "Vertrag nicht gefunden." });
    }
    if (contract.status === 'signed') {
      return res.status(400).json({ error: "Vertrag wurde bereits unterzeichnet." });
    }
    const admin = db.prepare("SELECT role FROM users WHERE id = ?").get(userId) as { role: string } | undefined;
    const isAdmin = admin && (admin.role === "admin" || admin.role === "super_admin");
    if (contract.user_id !== userId && !isAdmin) {
      return res.status(403).json({ error: "Sie sind nicht berechtigt, diesen Vertrag zu unterzeichnen." });
    }

    db.prepare("UPDATE contracts SET status = 'signed', signed_at = CURRENT_TIMESTAMP WHERE id = ?").run(contractId);

    if (contract.type === 'vip') {
      db.prepare("UPDATE users SET role = 'vip' WHERE id = ?").run(contract.user_id);
    }
    if (contract.type === 'resale_commission' && contract.masterpiece_id) {
      const listing = db.prepare("SELECT * FROM resale_listings WHERE contract_id = ?").get(contractId) as any;
      if (listing) {
        const piece = db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(contract.masterpiece_id) as any;
        const metrics = computePrestigeResaleMetrics(contract.masterpiece_id, piece?.valuation ?? listing.asking_price);
        db.prepare(`
          UPDATE resale_listings SET status = 'signed', signed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP,
            original_valuation_at_listing = ?, prestige_score_at_listing = ?, market_stability_score = ?, price_recommendation = ?
          WHERE id = ?
        `).run(piece?.valuation ?? listing.asking_price, metrics.prestige_score, metrics.market_stability_score, metrics.price_recommendation, listing.id);
        db.prepare("UPDATE masterpieces SET status = 'resale_review', valuation = ? WHERE id = ?").run(listing.asking_price, contract.masterpiece_id);
        resaleAudit(listing.id, 'contract_signed', undefined, `Contract ${contractId} signed; asset in review.`);
        broadcast({ type: 'RESALE_REQUESTED', masterpieceId: contract.masterpiece_id });
      }
    }

    broadcast({ type: 'CONTRACT_SIGNED', contractId, userId: contract.user_id });
    const signedUser = db.prepare("SELECT id, email, name, notification_prefs FROM users WHERE id = ?").get(contract.user_id) as any;
    if (signedUser && shouldSendEmailToUser(signedUser)) {
      const pieceTitle = contract.masterpiece_id ? (db.prepare("SELECT title FROM masterpieces WHERE id = ?").get(contract.masterpiece_id) as any)?.title : null;
      sendMail(
        signedUser.email,
        "Antonio Bellanova – Vertrag unterzeichnet",
        `Guten Tag ${signedUser.name || ''},\n\nIhr Vertrag wurde erfolgreich unterzeichnet.${pieceTitle ? ` (${pieceTitle})` : ''}\n\nMit freundlichen Grüßen\nIhr Atelier Antonio Bellanova`
      ).catch(() => {});
    }
    res.json({ success: true, masterpieceId: contract.masterpiece_id ?? undefined });
  } catch (err: any) {
    console.error("[contracts/sign]", err);
    res.status(500).json({ error: err?.message || "Unterzeichnung fehlgeschlagen." });
  }
});

// Resale: price suggestion and history (for UI before starting resale)
app.get("/api/masterpieces/:id/resale-suggestion", (req, res) => {
  const piece = db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(req.params.id) as any;
  if (!piece) return res.status(404).json({ error: "Masterpiece not found" });
  const valuation = Number(piece.valuation) || 0;
  const metrics = computePrestigeResaleMetrics(piece.id, valuation);
  res.json({ valuation, price_recommendation: metrics.price_recommendation, prestige_score: metrics.prestige_score });
});

app.get("/api/masterpieces/:id/resale-history", (req, res) => {
  const piece = db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(req.params.id) as any;
  if (!piece) return res.status(404).json({ error: "Masterpiece not found" });
  const ownership = db.prepare("SELECT oh.*, u.name as owner_name FROM ownership_history oh LEFT JOIN users u ON u.id = oh.owner_id WHERE oh.masterpiece_id = ? ORDER BY oh.acquired_at ASC").all(req.params.id);
  const resales = db.prepare("SELECT id, asking_price, final_sale_price, status, signed_at, completed_at, created_at FROM resale_listings WHERE masterpiece_id = ? ORDER BY created_at DESC").all(req.params.id);
  res.json({ masterpiece_id: piece.id, ownership_history: ownership, resale_listings: resales });
});

// Resale: start (create agreement + listing; resale only active after signature)
app.post("/api/resale/start", (req, res) => {
  const { userId, masterpieceId, askingPrice, saleMethod } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
  const piece = db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(masterpieceId) as any;
  if (!user || !piece || piece.current_owner_id !== userId) return res.status(403).json({ error: "Unauthorized or not owner" });
  const existing = db.prepare("SELECT id FROM resale_listings WHERE masterpiece_id = ? AND status IN ('pending_signature','signed','resale_pending','resale_review')").get(masterpieceId);
  if (existing) return res.status(400).json({ error: "Resale already in progress for this asset" });

  const commissionPct = RESALE_COMMISSION_RATES[user.role] ?? 8;
  const docRef = nextContractRef('resale_commission');
  const agreementHtml = generateResaleCommissionAgreement(piece, user, { commissionPct, saleMethod: saleMethod || 'marketplace', docRef });

  const contractResult = db.prepare(`
    INSERT INTO contracts (user_id, masterpiece_id, type, doc_ref, content, status)
    VALUES (?, ?, 'resale_commission', ?, ?, 'draft')
  `).run(userId, masterpieceId, docRef, agreementHtml);
  const contractId = contractResult.lastInsertRowid as number;

  const listingResult = db.prepare(`
    INSERT INTO resale_listings (masterpiece_id, seller_id, asking_price, commission_pct, sale_method, contract_id, status, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'pending_signature', CURRENT_TIMESTAMP)
  `).run(masterpieceId, userId, Number(askingPrice), commissionPct, saleMethod || 'marketplace', contractId);
  const resaleListingId = listingResult.lastInsertRowid as number;

  resaleAudit(resaleListingId, 'resale_started', undefined, `Asking ${askingPrice} ${saleMethod || 'marketplace'}; commission ${commissionPct}%.`);
  res.json({ success: true, contractId, resaleListingId, contract: { id: contractId, doc_ref: docRef, content: agreementHtml, type: 'resale_commission' } });
});

app.get("/api/resale/listings", (req, res) => {
  const userId = Number(req.query.userId);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const rows = db.prepare(`
    SELECT rl.*, m.title as masterpiece_title, m.serial_id, m.image_url, c.doc_ref, c.status as contract_status, c.signed_at as contract_signed_at
    FROM resale_listings rl
    JOIN masterpieces m ON m.id = rl.masterpiece_id
    LEFT JOIN contracts c ON c.id = rl.contract_id
    WHERE rl.seller_id = ? ORDER BY rl.created_at DESC
  `).all(userId);
  res.json(rows);
});

// Legacy: list without contract (still sets resell_pending for backward compat)
app.post("/api/resale/list", (req, res) => {
  const { userId, masterpieceId, price } = req.body;
  const piece = db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(masterpieceId) as any;
  if (!piece || piece.current_owner_id != userId) return res.status(403).json({ error: "Unauthorized" });
  db.prepare("UPDATE masterpieces SET status = 'resell_pending', valuation = ? WHERE id = ?").run(Number(price), masterpieceId);
  broadcast({ type: 'RESALE_REQUESTED', masterpieceId });
  res.json({ success: true });
});

app.get("/api/admin/resale-listings", (req, res) => {
  const rows = db.prepare(`
    SELECT rl.*, m.title as masterpiece_title, m.serial_id, m.valuation as current_valuation, u.name as seller_name, u.email as seller_email, u.role as seller_role,
           c.doc_ref, c.status as contract_status, c.signed_at as contract_signed_at
    FROM resale_listings rl
    JOIN masterpieces m ON m.id = rl.masterpiece_id
    JOIN users u ON u.id = rl.seller_id
    LEFT JOIN contracts c ON c.id = rl.contract_id
    WHERE rl.status IN ('pending_signature','signed','resale_pending','resale_review') ORDER BY rl.updated_at DESC
  `).all();
  res.json(rows);
});

app.post("/api/admin/resale/reject", (req, res) => {
  const { resaleListingId, adminId } = req.body;
  const admin = db.prepare("SELECT * FROM users WHERE id = ?").get(adminId) as any;
  if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin')) return res.status(403).json({ error: "Forbidden" });
  const listing = db.prepare("SELECT * FROM resale_listings WHERE id = ?").get(resaleListingId) as any;
  if (!listing) return res.status(404).json({ error: "Listing not found" });
  db.prepare("UPDATE resale_listings SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(resaleListingId);
  db.prepare("UPDATE masterpieces SET status = 'sold' WHERE id = ?").run(listing.masterpiece_id);
  resaleAudit(resaleListingId, 'resale_rejected', adminId);
  broadcast({ type: 'RESALE_REVIEWED', masterpieceId: listing.masterpiece_id, approved: false });
  res.json({ success: true });
});

app.post("/api/admin/resale/adjust", (req, res) => {
  const { resaleListingId, adminId, commissionPct, minPrice, valueFloorPct } = req.body;
  const admin = db.prepare("SELECT * FROM users WHERE id = ?").get(adminId) as any;
  if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin')) return res.status(403).json({ error: "Forbidden" });
  const listing = db.prepare("SELECT * FROM resale_listings WHERE id = ?").get(resaleListingId) as any;
  if (!listing) return res.status(404).json({ error: "Listing not found" });
  if (listing.status === 'sold') return res.status(400).json({ error: "Already completed" });
  const updates: string[] = [];
  const params: any[] = [];
  if (commissionPct != null && commissionPct >= 0 && commissionPct <= 100) {
    updates.push("commission_pct = ?");
    params.push(commissionPct);
  }
  if (minPrice != null && minPrice >= 0) {
    const floorPct = (listing.value_floor_pct != null ? Number(listing.value_floor_pct) : 0) / 100;
    const floor = listing.price_recommendation ? listing.price_recommendation * floorPct : 0;
    if (floor > 0 && minPrice < floor) return res.status(400).json({ error: "Min price below value floor" });
    updates.push("min_price = ?");
    params.push(minPrice);
  }
  if (valueFloorPct != null && valueFloorPct >= 0 && valueFloorPct <= 100) {
    updates.push("value_floor_pct = ?");
    params.push(valueFloorPct);
  }
  if (updates.length) {
    params.push(resaleListingId);
    db.prepare(`UPDATE resale_listings SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...params);
    resaleAudit(resaleListingId, 'resale_adjusted', adminId, JSON.stringify({ commissionPct, minPrice, valueFloorPct }));
  }
  res.json({ success: true });
});

app.post("/api/admin/resale/prioritize-auction", (req, res) => {
  const { resaleListingId, adminId } = req.body;
  const admin = db.prepare("SELECT * FROM users WHERE id = ?").get(adminId) as any;
  if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin')) return res.status(403).json({ error: "Forbidden" });
  const listing = db.prepare("SELECT * FROM resale_listings WHERE id = ?").get(resaleListingId) as any;
  if (!listing) return res.status(404).json({ error: "Listing not found" });
  db.prepare("UPDATE resale_listings SET sale_method = 'auction', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(resaleListingId);
  resaleAudit(resaleListingId, 'prioritize_auction', adminId);
  res.json({ success: true });
});

const RESALE_DECISIONS = ['curated_marketplace', 'private_auction', 'private_offer', 'maison_buyback', 'reject'] as const;

app.post("/api/admin/resale/decision", (req, res) => {
  const { resaleListingId, adminId, decision } = req.body;
  const admin = db.prepare("SELECT * FROM users WHERE id = ?").get(adminId) as any;
  if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin')) return res.status(403).json({ error: "Forbidden" });
  if (!RESALE_DECISIONS.includes(decision)) return res.status(400).json({ error: "Invalid decision" });
  const listing = db.prepare("SELECT * FROM resale_listings WHERE id = ?").get(resaleListingId) as any;
  if (!listing) return res.status(404).json({ error: "Listing not found" });
  if (listing.admin_decision) return res.status(400).json({ error: "Decision already made" });

  db.prepare(`
    UPDATE resale_listings SET admin_decision = ?, decided_at = CURRENT_TIMESTAMP, decided_by = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(decision, adminId, decision, resaleListingId);

  const piece = db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(listing.masterpiece_id) as any;
  if (decision === 'reject') {
    db.prepare("UPDATE masterpieces SET status = 'sold' WHERE id = ?").run(listing.masterpiece_id);
    resaleAudit(resaleListingId, 'resale_rejected', adminId, 'Prestige review: rejected.');
  } else if (decision === 'curated_marketplace') {
    resaleAudit(resaleListingId, 'decision_curated_marketplace', adminId);
  } else if (decision === 'private_auction') {
    db.prepare("UPDATE resale_listings SET sale_method = 'auction' WHERE id = ?").run(resaleListingId);
    const hasAuction = db.prepare("SELECT id FROM auctions WHERE masterpiece_id = ? AND status = 'active'").get(listing.masterpiece_id);
    if (!hasAuction) {
      db.prepare(`
        INSERT INTO auctions (masterpiece_id, start_price, current_bid, highest_bidder_id, end_time, status, vip_only)
        VALUES (?, ?, ?, NULL, datetime('now', '+7 days'), 'active', 0)
      `).run(listing.masterpiece_id, listing.asking_price || piece?.valuation, listing.asking_price || piece?.valuation);
    }
    db.prepare("UPDATE masterpieces SET status = 'auction' WHERE id = ?").run(listing.masterpiece_id);
    resaleAudit(resaleListingId, 'decision_private_auction', adminId);
  } else if (decision === 'private_offer') {
    resaleAudit(resaleListingId, 'decision_private_offer', adminId);
  } else if (decision === 'maison_buyback') {
    resaleAudit(resaleListingId, 'decision_maison_buyback', adminId);
  }
  broadcast({ type: 'RESALE_REVIEWED', masterpieceId: listing.masterpiece_id, decision });
  res.json({ success: true });
});

app.get("/api/resale/listing/:id/certified-details", (req, res) => {
  const id = Number(req.params.id);
  const listing = db.prepare("SELECT * FROM resale_listings WHERE id = ?").get(id) as any;
  if (!listing) return res.status(404).json({ error: "Listing not found" });
  const piece = db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(listing.masterpiece_id) as any;
  const ownership = db.prepare(`
    SELECT oh.*, u.name as owner_name FROM ownership_history oh LEFT JOIN users u ON u.id = oh.owner_id WHERE oh.masterpiece_id = ? ORDER BY oh.acquired_at ASC
  `).all(listing.masterpiece_id) as any[];
  const serviceHistory = db.prepare("SELECT * FROM service_history WHERE masterpiece_id = ? ORDER BY service_date DESC").all(listing.masterpiece_id) as any[];
  const provenance = db.prepare("SELECT * FROM provenance_timeline WHERE masterpiece_id = ? ORDER BY event_date DESC").all(listing.masterpiece_id) as any[];
  const valueDevelopment = ownership.map((o, i) => ({
    acquired_at: o.acquired_at,
    price: o.price,
    owner_name: o.owner_name
  }));
  res.json({
    masterpiece_id: listing.masterpiece_id,
    title: piece?.title,
    serial_id: piece?.serial_id,
    rarity: piece?.rarity,
    prestige_score: listing.prestige_score_at_listing ?? piece?.prestige_score,
    prestige_category: piece?.prestige_category ?? piece?.rarity,
    ownership_history: ownership,
    service_history: serviceHistory,
    value_development: valueDevelopment,
    price_recommendation: listing.price_recommendation,
    market_stability_score: listing.market_stability_score,
    asking_price: listing.asking_price,
    min_price: listing.min_price,
    limitation_level: piece?.rarity
  });
});

app.post("/api/admin/resale/buyback-offer", (req, res) => {
  const { resaleListingId, adminId, offeredAmount } = req.body;
  const admin = db.prepare("SELECT * FROM users WHERE id = ?").get(adminId) as any;
  if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin')) return res.status(403).json({ error: "Forbidden" });
  const listing = db.prepare("SELECT * FROM resale_listings WHERE id = ?").get(resaleListingId) as any;
  if (!listing) return res.status(404).json({ error: "Listing not found" });
  const existing = db.prepare("SELECT id FROM maison_buyback_offers WHERE resale_listing_id = ? AND status = 'pending'").get(resaleListingId);
  if (existing) return res.status(400).json({ error: "Pending buyback offer already exists" });
  db.prepare("INSERT INTO maison_buyback_offers (resale_listing_id, offered_amount, offered_by) VALUES (?, ?, ?)").run(resaleListingId, Number(offeredAmount), adminId);
  resaleAudit(resaleListingId, 'buyback_offer_sent', adminId, `Offered ${offeredAmount} EUR.`);
  res.json({ success: true });
});

app.post("/api/resale/accept-buyback", (req, res) => {
  const { offerId, userId } = req.body;
  const offer = db.prepare("SELECT * FROM maison_buyback_offers WHERE id = ?").get(offerId) as any;
  if (!offer || offer.status !== 'pending') return res.status(404).json({ error: "Offer not found or already responded" });
  const listing = db.prepare("SELECT * FROM resale_listings WHERE id = ?").get(offer.resale_listing_id) as any;
  if (!listing || listing.seller_id !== userId) return res.status(403).json({ error: "Not your listing" });
  db.prepare("UPDATE maison_buyback_offers SET status = 'accepted', responded_at = CURRENT_TIMESTAMP WHERE id = ?").run(offerId);
  db.prepare("UPDATE resale_listings SET status = 'sold', final_sale_price = ?, commission_amount = 0, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(offer.offered_amount, listing.id);
  const piece = db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(listing.masterpiece_id) as any;
  db.prepare("UPDATE masterpieces SET current_owner_id = NULL, status = 'available', transfer_type = 'platform', warranty_void = 0 WHERE id = ?").run(listing.masterpiece_id);
  db.prepare("INSERT INTO revenue_ledger (type, amount, user_id, masterpiece_id, reference_id) VALUES ('resale_fee', 0, NULL, listing.masterpiece_id, ?)").run(`buyback-${offer.id}`);
  updateProvenance(listing.masterpiece_id, 'ownership_transfer', `Maison buyback accepted. Asset returned to Vault.`);
  resaleAudit(listing.id, 'buyback_accepted', undefined, `Offer ${offerId} accepted; asset to vault.`);
  broadcast({ type: 'RESALE_COMPLETED', masterpieceId: listing.masterpiece_id });
  res.json({ success: true });
});

app.post("/api/resale/decline-buyback", (req, res) => {
  const { offerId, userId } = req.body;
  const offer = db.prepare("SELECT * FROM maison_buyback_offers WHERE id = ?").get(offerId) as any;
  if (!offer || offer.status !== 'pending') return res.status(404).json({ error: "Offer not found or already responded" });
  const listing = db.prepare("SELECT * FROM resale_listings WHERE id = ?").get(offer.resale_listing_id) as any;
  if (!listing || listing.seller_id !== userId) return res.status(403).json({ error: "Not your listing" });
  db.prepare("UPDATE maison_buyback_offers SET status = 'declined', responded_at = CURRENT_TIMESTAMP WHERE id = ?").run(offerId);
  resaleAudit(listing.id, 'buyback_declined', undefined);
  res.json({ success: true });
});

app.get("/api/resale/buyback-offers", (req, res) => {
  const userId = Number(req.query.userId);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const rows = db.prepare(`
    SELECT o.*, rl.masterpiece_id, rl.asking_price, m.title as masterpiece_title
    FROM maison_buyback_offers o
    JOIN resale_listings rl ON rl.id = o.resale_listing_id
    JOIN masterpieces m ON m.id = rl.masterpiece_id
    WHERE rl.seller_id = ? ORDER BY o.offered_at DESC
  `).all(userId);
  res.json(rows);
});

app.post("/api/admin/approve-resale", (req, res) => {
  const { masterpieceId, approve } = req.body;
  if (approve) {
    db.prepare("UPDATE masterpieces SET status = 'available', current_owner_id = NULL WHERE id = ?").run(masterpieceId);
  } else {
    db.prepare("UPDATE masterpieces SET status = 'sold' WHERE id = ?").run(masterpieceId);
  }
  broadcast({ type: 'RESALE_REVIEWED', masterpieceId, approved: approve });
  res.json({ success: true });
});

// Controlled Resale Ecosystem: mark asset as externally transferred (no legal prohibition; registry and benefits updated)
app.post("/api/masterpieces/:id/mark-external", (req, res) => {
  const masterpieceId = Number(req.params.id);
  const { userId, adminId } = req.body;
  const user = userId ? db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any : null;
  const admin = adminId ? db.prepare("SELECT * FROM users WHERE id = ?").get(adminId) as any : null;
  const piece = db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(masterpieceId) as any;
  if (!piece) return res.status(404).json({ error: "Masterpiece not found" });
  const isAdmin = admin && (admin.role === 'admin' || admin.role === 'super_admin');
  const isOwner = user && piece.current_owner_id === user.id;
  if (!isAdmin && !isOwner) return res.status(403).json({ error: "Admin or current owner only" });

  db.prepare("UPDATE masterpieces SET transfer_type = 'external', warranty_void = 1 WHERE id = ?").run(masterpieceId);
  updateProvenance(masterpieceId, 'ownership_transfer', 'Asset marked as externally transferred. Registry updated; warranty and Prestige tracking discontinued.');
  try {
    logAudit(admin?.id ?? user?.id ?? 0, 'MARK_EXTERNAL_TRANSFER', String(masterpieceId), 'Transfer type set to external; warranty void.');
  } catch (_) {}
  res.json({ success: true });
});

// VIP Concierge
app.post("/api/vip/concierge", (req, res) => {
  const { userId, message } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  if (!user || user.role !== 'vip') return res.status(403).json({ error: "VIP access required" });
  
  // In a real app, this would send an email or notification to Antonio
  console.log(`VIP Concierge Request from ${user.name}: ${message}`);
  res.json({ success: true, response: "Your request has been received. Antonio will contact you shortly." });
});

// --- New Expansion Modules API ---

// 1. Provenance Timeline
app.get("/api/provenance/:masterpieceId", (req, res) => {
  const timeline = db.prepare("SELECT * FROM provenance_timeline WHERE masterpiece_id = ? ORDER BY event_date DESC").all(req.params.masterpieceId);
  res.json(timeline);
});

// 2. Private Resale Module (Extended) — negotiate, message, accept
app.post("/api/resale/negotiate", (req, res) => {
  const { masterpieceId, buyer_id, seller_id, offered_price } = req.body;
  const platform_fee = offered_price * 0.05; // 5% platform fee
  
  const result = db.prepare(`
    INSERT INTO resale_negotiations (masterpiece_id, seller_id, buyer_id, offered_price, platform_fee)
    VALUES (?, ?, ?, ?, ?)
  `).run(masterpieceId, seller_id, buyer_id, offered_price, platform_fee);
  
  db.prepare("UPDATE masterpieces SET status = 'negotiation' WHERE id = ?").run(masterpieceId);
  
  res.json({ id: result.lastInsertRowid });
});

app.post("/api/resale/message", (req, res) => {
  const { negotiation_id, sender_id, message } = req.body;
  db.prepare("INSERT INTO private_messages (negotiation_id, sender_id, message) VALUES (?, ?, ?)").run(
    negotiation_id, sender_id, message
  );
  res.json({ success: true });
});

app.get("/api/resale/negotiation/:id", (req, res) => {
  const negotiation = db.prepare("SELECT * FROM resale_negotiations WHERE id = ?").get(req.params.id);
  const messages = db.prepare("SELECT * FROM private_messages WHERE negotiation_id = ? ORDER BY created_at ASC").all(req.params.id);
  res.json({ negotiation, messages });
});

app.post("/api/resale/accept", (req, res) => {
  const { negotiation_id, userId } = req.body;
  const negotiation = db.prepare("SELECT * FROM resale_negotiations WHERE id = ?").get(negotiation_id);
  
  if (negotiation.seller_id !== userId) return res.status(403).json({ error: "Only seller can accept" });
  
  db.prepare("UPDATE resale_negotiations SET status = 'accepted' WHERE id = ?").run(negotiation_id);
  db.prepare("UPDATE masterpieces SET status = 'escrow_pending' WHERE id = ?").run(negotiation.masterpiece_id);
  
  // Create Escrow Transaction
  db.prepare(`
    INSERT INTO escrow_transactions (masterpiece_id, buyer_id, seller_id, amount, status, dispute_window_ends)
    VALUES (?, ?, ?, ?, 'HELD', datetime('now', '+2 days'))
  `).run(negotiation.masterpiece_id, negotiation.buyer_id, negotiation.seller_id, negotiation.offered_price);

  updateProvenance(negotiation.masterpiece_id, 'vip_event', `Resale offer of ${negotiation.offered_price} EUR accepted. Escrow initiated.`);
  
  broadcast({ type: 'RESALE_ACCEPTED', negotiation_id, masterpieceId: negotiation.masterpiece_id });
  res.json({ success: true });
});

app.post("/api/resale/complete", (req, res) => {
  const { masterpieceId, adminId } = req.body;
  const piece = db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(masterpieceId) as any;
  const escrow = db.prepare("SELECT * FROM escrow_transactions WHERE masterpiece_id = ? AND status = 'HELD' ORDER BY created_at DESC LIMIT 1").get(masterpieceId) as any;
  if (!escrow) return res.status(404).json({ error: "Escrow not found" });

  const buyer = db.prepare("SELECT * FROM users WHERE id = ?").get(escrow.buyer_id) as any;
  const salePrice = escrow.amount;

  const listing = db.prepare("SELECT * FROM resale_listings WHERE masterpiece_id = ? AND status IN ('signed','resale_pending','resale_review','curated_marketplace','private_auction','private_offer') ORDER BY signed_at DESC LIMIT 1").get(masterpieceId) as any;
  const commissionPct = listing ? listing.commission_pct : 8;
  const commissionAmount = salePrice * (commissionPct / 100);
  const sellerPayout = salePrice - commissionAmount;

  db.prepare("UPDATE escrow_transactions SET status = 'RELEASED' WHERE id = ?").run(escrow.id);
  db.prepare("UPDATE masterpieces SET current_owner_id = ?, status = 'sold', valuation = ?, transfer_type = 'platform', warranty_void = 0 WHERE id = ?").run(
    escrow.buyer_id, salePrice, piece.id
  );

  if (listing) {
    db.prepare("UPDATE resale_listings SET status = 'sold', final_sale_price = ?, commission_amount = ?, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(
      salePrice, commissionAmount, listing.id
    );
    resaleAudit(listing.id, 'resale_completed', adminId ?? null, `Sale ${salePrice} EUR; commission ${commissionAmount} EUR (${commissionPct}%).`);
  }
  db.prepare("INSERT INTO revenue_ledger (type, amount, user_id, masterpiece_id, reference_id) VALUES ('resale_fee', ?, NULL, ?, ?)").run(
    commissionAmount, piece.id, listing ? `resale-${listing.id}` : `escrow-${escrow.id}`
  );

  updateProvenance(piece.id, 'ownership_transfer', `Resale completed. New owner: ${buyer.name}. Sale price: ${salePrice.toLocaleString()} EUR. Maison commission: ${commissionAmount.toLocaleString()} EUR.`);
  const certId = nextCertRef();
  const regId = piece.registry_id || nextRegRef();
  if (!piece.registry_id) db.prepare("UPDATE masterpieces SET registry_id = ? WHERE id = ?").run(regId, piece.id);
  const certContent = `CERTIFICATE OF AUTHENTICITY & PRIVATE TRANSFER\n\nThis document confirms the private resale and ownership transfer of "${piece.title}".\n\nNew Owner: ${buyer.name}\nTransfer Price: ${salePrice.toLocaleString()} EUR\nRegistry ID: ${regId}\n\nProvenance has been updated in the Antonio Bellanova Vault.`;
  const certHtml = generateLuxuryDocument("Certificate of Authenticity", certContent, buyer, piece, { docRef: certId, title: "Certificate of Authenticity", registryId: regId, registryUrl: `/registry/masterpiece/${piece.id}` });
  db.prepare("INSERT INTO certificates (masterpiece_id, owner_id, cert_id, content, signature, blockchain_hash) VALUES (?, ?, ?, ?, ?, ?)").run(
    piece.id, buyer.id, certId, certHtml, 'DIGITAL_SIG_AB', '0x' + Math.random().toString(16).slice(2)
  );

  broadcast({ type: 'RESALE_COMPLETED', masterpieceId });
  res.json({ success: true, commissionAmount, sellerPayout });
});

// 3. Service Lifecycle Tracking (Extended)
app.post("/api/admin/service/add", (req, res) => {
  const { masterpieceId, serviceType, description, cost, provider, attachments, adminId } = req.body;
  db.prepare("INSERT INTO service_history (masterpiece_id, service_type, description, cost, provider, attachments) VALUES (?, ?, ?, ?, ?, ?)").run(
    masterpieceId, serviceType, description, cost, provider, JSON.stringify(attachments || [])
  );
  
  // Service affects valuation (e.g., restoration adds value)
  const piece = db.prepare("SELECT valuation FROM masterpieces WHERE id = ?").get(masterpieceId);
  const newValuation = piece.valuation + (cost * 0.5); // 50% of service cost added to valuation
  db.prepare("UPDATE masterpieces SET valuation = ? WHERE id = ?").run(newValuation, masterpieceId);

  updateProvenance(masterpieceId, 'service', `Service performed: ${serviceType}. ${description}`);
  calculateRarityScore(masterpieceId);
  logAudit(adminId, 'ADD_SERVICE', masterpieceId.toString(), `Added ${serviceType} service record. Valuation updated.`);
  
  res.json({ success: true });
});

// 4. Waitlist System (Extended)
app.post("/api/waitlist/join", (req, res) => {
  const { userId, masterpieceId, requestType, preferredBudget, preferredMaterials } = req.body;
  db.prepare("INSERT INTO waitlist (masterpiece_id, user_id, request_type, preferred_budget, preferred_materials) VALUES (?, ?, ?, ?, ?)").run(
    masterpieceId || null, userId, requestType, preferredBudget, preferredMaterials
  );
  res.json({ success: true });
});

app.get("/api/admin/waitlist", (req, res) => {
  const list = db.prepare(`
    SELECT w.*, u.name as user_name, m.title as piece_title 
    FROM waitlist w 
    JOIN users u ON w.user_id = u.id 
    LEFT JOIN masterpieces m ON w.masterpiece_id = m.id
  `).all();
  res.json(list);
});

// 5. Soft Reserve System
app.post("/api/admin/reserve", (req, res) => {
  const { masterpieceId, userId, durationHours, type, adminId } = req.body;
  const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();
  
  db.prepare("INSERT INTO reservations (masterpiece_id, user_id, expires_at, type) VALUES (?, ?, ?, ?)").run(
    masterpieceId, userId, expiresAt, type
  );
  
  const status = type === 'vip' ? 'reserved_vip' : 'reserved_client';
  db.prepare("UPDATE masterpieces SET status = ? WHERE id = ?").run(status, masterpieceId);
  
  updateProvenance(masterpieceId, 'vip_event', `Piece reserved for ${type} (User ID: ${userId}) for ${durationHours}h.`);
  logAudit(adminId, 'SOFT_RESERVE', masterpieceId.toString(), `Reserved piece for ${type} until ${expiresAt}`);
  
  res.json({ success: true, expiresAt });
});

// 6. Collector Profile
app.get("/api/collector/:userId", (req, res) => {
  const profile = db.prepare("SELECT * FROM collector_profiles WHERE user_id = ?").get(req.params.userId);
  const user = db.prepare("SELECT id, name, role, is_vip FROM users WHERE id = ?").get(req.params.userId);
  const pieces = db.prepare("SELECT * FROM masterpieces WHERE current_owner_id = ?").all(req.params.userId);
  
  res.json({ profile, user, pieces });
});

app.post("/api/collector/update", (req, res) => {
  const { userId, bio, visibility } = req.body;
  db.prepare(`
    INSERT INTO collector_profiles (user_id, bio, visibility) 
    VALUES (?, ?, ?) 
    ON CONFLICT(user_id) DO UPDATE SET bio = excluded.bio, visibility = excluded.visibility
  `).run(userId, bio, visibility);
  res.json({ success: true });
});

// 7. Investor Analytics Dashboard
app.get("/api/admin/analytics", (req, res) => {
  const platformValuation = db.prepare("SELECT SUM(valuation) as total FROM masterpieces").get().total || 0;
  const piecesSold = db.prepare("SELECT COUNT(*) as count FROM masterpieces WHERE status = 'sold'").get().count;
  
  const rarityDistribution = db.prepare("SELECT rarity, COUNT(*) as count FROM masterpieces GROUP BY rarity").all().reduce((acc: any, curr: any) => {
    acc[curr.rarity] = curr.count;
    return acc;
  }, {});

  const auctionPerformance = {
    total_bids: db.prepare("SELECT COUNT(*) as count FROM bids").get().count,
    avg_bid_increase: 15.5
  };

  res.json({
    platform_valuation: platformValuation,
    pieces_sold: piecesSold,
    appreciation_metrics: {
      avg_appreciation: 12.4,
      top_performing_category: 'High Jewelry'
    },
    auction_performance: auctionPerformance,
    rarity_distribution: rarityDistribution
  });
});

// 9. Concierge Request Layer (Super System)
app.post("/api/concierge/request", (req, res) => {
  const { userId, masterpieceId, requestType, message, priority } = req.body;
  const result = db.prepare("INSERT INTO concierge_requests (user_id, masterpiece_id, request_type, message, priority) VALUES (?, ?, ?, ?, ?)").run(
    userId, masterpieceId, requestType, message, priority || 'standard'
  );
  
  if (masterpieceId) {
    updateProvenance(masterpieceId, 'service', `Concierge request initiated: ${requestType}. Status: requested.`);
  }
  
  res.json({ id: result.lastInsertRowid });
});

app.post("/api/concierge/message", (req, res) => {
  const { requestId, senderId, message } = req.body;
  db.prepare("INSERT INTO concierge_messages (request_id, sender_id, message) VALUES (?, ?, ?)").run(
    requestId, senderId, message
  );
  res.json({ success: true });
});

app.get("/api/concierge/request/:id", (req, res) => {
  const request = db.prepare(`
    SELECT cr.*, u.name as user_name, m.title as piece_title 
    FROM concierge_requests cr 
    JOIN users u ON cr.user_id = u.id 
    LEFT JOIN masterpieces m ON cr.masterpiece_id = m.id
    WHERE cr.id = ?
  `).get(req.params.id);
  const messages = db.prepare("SELECT * FROM concierge_messages WHERE request_id = ? ORDER BY created_at ASC").all(req.params.id);
  res.json({ request, messages });
});

app.post("/api/admin/concierge/update", (req, res) => {
  const { requestId, status, assignedAdminId, adminId } = req.body;
  db.prepare("UPDATE concierge_requests SET status = ?, assigned_admin_id = ? WHERE id = ?").run(
    status, assignedAdminId, requestId
  );
  
  const request = db.prepare("SELECT * FROM concierge_requests WHERE id = ?").get(requestId);
  if (request.masterpiece_id) {
    updateProvenance(request.masterpiece_id, 'service', `Concierge status updated to ${status}.`);
    if (status === 'completed') {
      calculateRarityScore(request.masterpiece_id);
    }
  }
  
  logAudit(adminId, 'CONCIERGE_UPDATE', requestId.toString(), `Updated concierge request to ${status}`);
  res.json({ success: true });
});

// 10. Fractional Ownership
app.post("/api/admin/fractional/initialize", (req, res) => {
  const { masterpieceId, shares, adminId } = req.body; // shares: [{ owner_id, percentage }]
  const piece = db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(masterpieceId) as any;
  if (!piece) return res.status(404).json({ error: "Masterpiece not found" });
  db.prepare("UPDATE masterpieces SET status = 'fractional_open' WHERE id = ?").run(masterpieceId);
  const insertShare = db.prepare("INSERT INTO fractional_shares (masterpiece_id, owner_id, percentage) VALUES (?, ?, ?)");
  for (const share of shares) {
    insertShare.run(masterpieceId, share.owner_id, share.percentage);
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(share.owner_id) as any;
    const docRef = nextContractRef('fractional');
    const content = `FRACTIONAL OWNERSHIP AGREEMENT\n\nThis agreement grants ${user.name} a ${share.percentage}% participation in the asset "${piece.title}" (Serial: ${piece.serial_id}).\n\nThe physical asset remains in the custody of the Antonio Bellanova Vault. No physical division of the object. Secondary trading of participation may be permitted on the platform. Exit and redemption terms as per platform rules. Governing Law: Germany; Jurisdiction: Cologne.`;
    const html = generateLuxuryDocument("Fractional Ownership Agreement", content, user, piece, { docRef, title: "Fractional Ownership Agreement" });
    db.prepare("INSERT INTO contracts (user_id, masterpiece_id, type, doc_ref, content, status) VALUES (?, ?, 'fractional', ?, ?, 'signed')").run(
      share.owner_id, masterpieceId, docRef, html
    );
  }
  updateProvenance(masterpieceId, 'vip_event', `Masterpiece fractionalized into ${shares.length} initial shares.`);
  logAudit(adminId, 'FRACTIONAL_INIT', masterpieceId.toString(), `Fractionalized masterpiece.`);
  res.json({ success: true });
});

app.get("/api/admin/fractional-offers", (req, res) => {
  const rows = db.prepare(`
    SELECT fa.*, m.title, m.serial_id, m.valuation, m.status as piece_status
    FROM fractional_availability fa
    JOIN masterpieces m ON fa.masterpiece_id = m.id
    ORDER BY fa.updated_at DESC
  `).all();
  res.json(rows);
});

app.post("/api/admin/fractional/offer", (req, res) => {
  const adminId = getSessionUserId(req);
  const admin = adminId ? db.prepare("SELECT * FROM users WHERE id = ?").get(adminId) as any : null;
  if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin')) return res.status(403).json({ error: "Forbidden" });
  const { masterpiece_id, available_pct, price_per_pct } = req.body;
  const piece = db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(masterpiece_id) as any;
  if (!piece) return res.status(404).json({ error: "Masterpiece not found" });
  db.prepare("UPDATE masterpieces SET status = 'fractional_open' WHERE id = ?").run(masterpiece_id);
  const existing = db.prepare("SELECT * FROM fractional_availability WHERE masterpiece_id = ?").get(masterpiece_id) as any;
  if (existing) {
    db.prepare("UPDATE fractional_availability SET available_pct = ?, price_per_pct = ?, updated_at = CURRENT_TIMESTAMP WHERE masterpiece_id = ?").run(
      available_pct ?? existing.available_pct, price_per_pct ?? existing.price_per_pct, masterpiece_id
    );
  } else {
    db.prepare("INSERT INTO fractional_availability (masterpiece_id, available_pct, price_per_pct) VALUES (?, ?, ?)").run(
      masterpiece_id, available_pct ?? 0, price_per_pct ?? null
    );
  }
  res.json({ success: true });
});

app.get("/api/fractional/shares/:masterpieceId", (req, res) => {
  const shares = db.prepare(`
    SELECT fs.*, u.name as owner_name 
    FROM fractional_shares fs 
    JOIN users u ON fs.owner_id = u.id 
    WHERE fs.masterpiece_id = ?
  `).all(req.params.masterpieceId);
  res.json(shares);
});

app.get("/api/investor/fractional-offers", (req, res) => {
  const rows = db.prepare(`
    SELECT m.id, m.title, m.serial_id, m.valuation, m.status, m.image_url,
           fa.available_pct, fa.price_per_pct
    FROM fractional_availability fa
    JOIN masterpieces m ON fa.masterpiece_id = m.id
    WHERE fa.available_pct > 0 AND m.status IN ('fractional_open', 'fractional_full', 'fractional_resale')
    ORDER BY fa.updated_at DESC
  `).all();
  res.json(rows);
});

app.get("/api/investor/portfolio/:userId", (req, res) => {
  const shares = db.prepare(`
    SELECT fs.*, m.title, m.serial_id, m.valuation, m.status as asset_status
    FROM fractional_shares fs
    JOIN masterpieces m ON fs.masterpiece_id = m.id
    WHERE fs.owner_id = ?
  `).all(req.params.userId) as any[];
  const totalValue = shares.reduce((sum: number, s: any) => sum + (s.valuation || 0) * (s.percentage / 100), 0);
  res.json({ shares, total_fractional_value: totalValue });
});

app.get("/api/investor/exit-simulation", (req, res) => {
  const { userId, masterpieceId } = req.query;
  const share = userId && masterpieceId
    ? db.prepare("SELECT * FROM fractional_shares WHERE owner_id = ? AND masterpiece_id = ?").get(userId, masterpieceId) as any
    : null;
  const piece = masterpieceId ? db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(masterpieceId) as any : null;
  if (!piece) return res.status(404).json({ error: "Masterpiece not found" });
  const pct = share ? share.percentage : 100;
  const estimatedValue = (piece.valuation || 0) * (pct / 100);
  res.json({ masterpiece_id: piece.id, title: piece.title, valuation: piece.valuation, share_pct: pct, estimated_exit_value: estimatedValue });
});

app.get("/api/investor/dataroom/:masterpieceId", (req, res) => {
  const piece = db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(req.params.masterpieceId) as any;
  if (!piece) return res.status(404).json({ error: "Masterpiece not found" });
  const registry = db.prepare("SELECT * FROM ownership_history WHERE masterpiece_id = ? ORDER BY acquired_at ASC").all(req.params.masterpieceId);
  const contracts = db.prepare("SELECT id, type, doc_ref, status, created_at FROM contracts WHERE masterpiece_id = ? ORDER BY created_at DESC").all(req.params.masterpieceId);
  const service = db.prepare("SELECT * FROM service_history WHERE masterpiece_id = ? ORDER BY service_date DESC").all(req.params.masterpieceId);
  res.json({ masterpiece: piece, ownership_history: registry, contracts, service_history: service });
});

// 11. Monetization Dashboard
app.get("/api/admin/revenue", (req, res) => {
  const totalRevenue = db.prepare("SELECT SUM(amount) as total FROM revenue_ledger").get().total || 0;
  const revenueByType = db.prepare("SELECT type, SUM(amount) as total FROM revenue_ledger GROUP BY type").all();
  const recentTransactions = db.prepare(`
    SELECT rl.*, u.name as user_name, m.title as piece_title 
    FROM revenue_ledger rl 
    JOIN users u ON rl.user_id = u.id 
    LEFT JOIN masterpieces m ON rl.masterpiece_id = m.id
    ORDER BY rl.created_at DESC LIMIT 20
  `).all();
  
  res.json({ totalRevenue, revenueByType, recentTransactions });
});

app.post("/api/revenue/add", (req, res) => {
  const { type, amount, userId, masterpieceId, referenceId } = req.body;
  db.prepare("INSERT INTO revenue_ledger (type, amount, user_id, masterpiece_id, reference_id) VALUES (?, ?, ?, ?, ?)").run(
    type, amount, userId, masterpieceId, referenceId
  );
  res.json({ success: true });
});

// 12. Production Progress
app.get("/api/production/:masterpieceId", (req, res) => {
  const progress = db.prepare("SELECT * FROM production_progress WHERE masterpiece_id = ? ORDER BY step_index ASC").all(req.params.masterpieceId);
  res.json(progress);
});

app.post("/api/admin/production/update", (req, res) => {
  const { masterpieceId, stepIndex, status, notes, mediaUrl, adminId } = req.body;
  db.prepare(`
    INSERT INTO production_progress (masterpiece_id, step_index, status, notes, media_url, staff_id, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(masterpiece_id, step_index) DO UPDATE SET 
      status = excluded.status, 
      notes = excluded.notes, 
      media_url = excluded.media_url, 
      staff_id = excluded.staff_id,
      timestamp = CURRENT_TIMESTAMP
  `).run(masterpieceId, stepIndex, status, notes, mediaUrl, adminId);
  
  const steps = ["Deposit received", "Production started", "Production finished", "Quality control", "Ready for delivery", "Final payment requested", "Final payment received", "Shipped", "Delivered", "Completed"];
  const stepName = steps[stepIndex];
  
  updateProvenance(masterpieceId, 'service', `Production step "${stepName}" marked as ${status}.`);
  broadcast({ type: 'PRODUCTION_UPDATED', masterpieceId, stepIndex, status });
  res.json({ success: true });
});

// 13. Delivery Details
app.get("/api/delivery/:masterpieceId", (req, res) => {
  const delivery = db.prepare("SELECT * FROM delivery_details WHERE masterpiece_id = ?").get(req.params.masterpieceId);
  res.json(delivery || null);
});

app.post("/api/admin/delivery/update", (req, res) => {
  const { masterpieceId, courierName, trackingNumber, scheduledAt, status, adminId } = req.body;
  db.prepare(`
    INSERT INTO delivery_details (masterpiece_id, courier_name, tracking_number, scheduled_at, status)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(masterpiece_id) DO UPDATE SET 
      courier_name = excluded.courier_name, 
      tracking_number = excluded.tracking_number, 
      scheduled_at = excluded.scheduled_at, 
      status = excluded.status
  `).run(masterpieceId, courierName, trackingNumber, scheduledAt, status);
  
  updateProvenance(masterpieceId, 'vip_event', `Delivery status updated to ${status}. Courier: ${courierName}`);
  broadcast({ type: 'DELIVERY_UPDATED', masterpieceId, status });
  res.json({ success: true });
});

// 14. Atelier Moments
app.get("/api/moments/:masterpieceId", (req, res) => {
  const moments = db.prepare("SELECT * FROM atelier_moments WHERE masterpiece_id = ? ORDER BY created_at DESC").all(req.params.masterpieceId);
  res.json(moments);
});

app.post("/api/admin/moments/add", (req, res) => {
  const { masterpieceId, title, caption, mediaUrl, adminId } = req.body;
  db.prepare("INSERT INTO atelier_moments (masterpiece_id, title, caption, media_url) VALUES (?, ?, ?, ?)").run(
    masterpieceId, title, caption, mediaUrl
  );
  broadcast({ type: 'NEW_MOMENT', masterpieceId });
  res.json({ success: true });
});

// 15. User Applications
app.post("/api/applications/apply", (req, res) => {
  const { userId, type, portfolioUrl, budgetRange, interests, verificationDocs } = req.body;
  db.prepare("INSERT INTO user_applications (user_id, type, portfolio_url, budget_range, interests, verification_docs) VALUES (?, ?, ?, ?, ?, ?)").run(
    userId, type, portfolioUrl, budgetRange, interests, JSON.stringify(verificationDocs)
  );
  res.json({ success: true });
});

app.get("/api/admin/applications", (req, res) => {
  const apps = db.prepare(`
    SELECT ua.*, u.name as user_name, u.email as user_email 
    FROM user_applications ua 
    JOIN users u ON ua.user_id = u.id 
    ORDER BY ua.created_at DESC
  `).all();
  res.json(apps);
});

app.post("/api/admin/applications/review", (req, res) => {
  const { applicationId, status, adminId } = req.body;
  const application = db.prepare("SELECT * FROM user_applications WHERE id = ?").get(applicationId);
  db.prepare("UPDATE user_applications SET status = ? WHERE id = ?").run(status, applicationId);
  
  if (status === 'approved') {
    db.prepare("UPDATE users SET role = ? WHERE id = ?").run(application.type, application.user_id);
    notifyUser(application.user_id, `Your application for ${application.type} status has been approved.`, "success");
  } else {
    notifyUser(application.user_id, `Your application for ${application.type} status was not approved.`, "warning");
  }
  
  res.json({ success: true });
});

// 16. AI Pricing Engine (Mock)
app.get("/api/pricing/estimate/:masterpieceId", (req, res) => {
  const piece = db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(req.params.masterpieceId);
  if (!piece) return res.status(404).json({ error: "Piece not found" });
  
  // Mock AI logic
  const baseValue = piece.valuation;
  const appreciation = 1.15; // 15% appreciation
  const estimatedValue = baseValue * appreciation;
  const liquidityScore = 85;
  
  res.json({
    current_valuation: baseValue,
    estimated_future_value: estimatedValue,
    appreciation_rate: "15.5%",
    liquidity_score: liquidityScore,
    recommendation: "Hold - High appreciation potential due to rarity."
  });
});

// 17. Wealth CRM
app.get("/api/admin/crm/:userId", (req, res) => {
  const interactions = db.prepare(`
    SELECT ci.*, u.name as admin_name 
    FROM crm_interactions ci 
    JOIN users u ON ci.admin_id = u.id 
    WHERE ci.user_id = ? 
    ORDER BY ci.created_at DESC
  `).all(req.params.userId);
  res.json(interactions);
});

app.post("/api/admin/crm/add", (req, res) => {
  const { userId, adminId, type, content, priority } = req.body;
  db.prepare("INSERT INTO crm_interactions (user_id, admin_id, type, content, priority) VALUES (?, ?, ?, ?, ?)").run(
    userId, adminId, type, content, priority || 'normal'
  );
  res.json({ success: true });
});

// 18. Shipping & Logistics
app.get("/api/shipping/:masterpieceId", (req, res) => {
  const shipping = db.prepare("SELECT * FROM shipping_orchestration WHERE masterpiece_id = ?").get(req.params.masterpieceId);
  res.json(shipping || null);
});

app.post("/api/admin/shipping/update", (req, res) => {
  const { masterpieceId, status, courier, trackingNumber, insuranceValue, whiteGlove, custodyEvent } = req.body;
  const existing = db.prepare("SELECT * FROM shipping_orchestration WHERE masterpiece_id = ?").get(masterpieceId);
  
  let custodyLog = [];
  if (existing && existing.custody_log) {
    custodyLog = JSON.parse(existing.custody_log);
  }
  if (custodyEvent) {
    custodyLog.push({ event: custodyEvent, timestamp: new Date().toISOString() });
  }

  db.prepare(`
    INSERT INTO shipping_orchestration (masterpiece_id, status, courier, tracking_number, insurance_value, white_glove, custody_log)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(masterpiece_id) DO UPDATE SET 
      status = excluded.status, 
      courier = excluded.courier, 
      tracking_number = excluded.tracking_number, 
      insurance_value = excluded.insurance_value, 
      white_glove = excluded.white_glove,
      custody_log = excluded.custody_log
  `).run(masterpieceId, status, courier, trackingNumber, insuranceValue, whiteGlove ? 1 : 0, JSON.stringify(custodyLog));
  
  res.json({ success: true });
});

// 19. Insurance
app.get("/api/insurance/:masterpieceId", (req, res) => {
  const policies = db.prepare("SELECT * FROM insurance_policies WHERE masterpiece_id = ?").all(req.params.masterpieceId);
  res.json(policies);
});

app.post("/api/admin/insurance/add", (req, res) => {
  const { masterpieceId, provider, policyNumber, coverageAmount, premium, expiresAt, documentUrl } = req.body;
  db.prepare(`
    INSERT INTO insurance_policies (masterpiece_id, provider, policy_number, coverage_amount, premium, expires_at, document_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(masterpieceId, provider, policyNumber, coverageAmount, premium, expiresAt, documentUrl);
  res.json({ success: true });
});

// 20. Private Events
app.get("/api/events", (req, res) => {
  const events = db.prepare("SELECT * FROM private_events WHERE status = 'upcoming' ORDER BY event_date ASC").all();
  res.json(events);
});

app.post("/api/events/rsvp", (req, res) => {
  const { eventId, userId, status } = req.body;
  db.prepare(`
    INSERT INTO event_rsvps (event_id, user_id, status) 
    VALUES (?, ?, ?) 
    ON CONFLICT(event_id, user_id) DO UPDATE SET status = excluded.status
  `).run(eventId, userId, status);
  res.json({ success: true });
});

// 21. Platform Intelligence (Founder Dashboard)
app.get("/api/admin/intelligence", (req, res) => {
  const totalValue = db.prepare("SELECT SUM(valuation) as total FROM masterpieces").get().total || 0;
  const userGrowth = db.prepare("SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count FROM users GROUP BY month").all();
  const liquidity = db.prepare("SELECT status, COUNT(*) as count FROM masterpieces GROUP BY status").all();
  const reputationAvg = db.prepare("SELECT AVG(reputation_score) as avg FROM users").get().avg || 0;
  
  res.json({
    total_portfolio_value: totalValue,
    user_growth: userGrowth,
    market_liquidity: liquidity,
    average_reputation: reputationAvg,
    geographic_distribution: { "Germany": 45, "Italy": 20, "Switzerland": 15, "Other": 20 }
  });
});

// 22. VIP Concierge AI
// --- Luxury Communication System ---
const COMM_THREAD_TYPES = ['concierge', 'asset', 'investor_hub', 'auction_live', 'black_direct', 'vault'] as const;
const ROLES_PRIORITY: Record<string, number> = { client: 1, investor: 1, vip: 2, admin: 1, royal: 3, black: 3 };

function commAudit(action: string, userId: number, threadId?: number, messageId?: number, targetId?: string, details?: string) {
  try {
    db.prepare("INSERT INTO communication_audit_log (action, thread_id, message_id, user_id, target_id, details) VALUES (?, ?, ?, ?, ?, ?)")
      .run(action, threadId ?? null, messageId ?? null, userId, targetId ?? null, details ?? null);
  } catch (_) {}
}

function canAccessThread(thread: any, userId: number, userRole: string, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  if (thread.type === 'black_direct' && thread.user_id === userId) return true;
  if (thread.user_id === userId) return true;
  if (thread.type === 'asset' && thread.masterpiece_id) {
    const piece = db.prepare("SELECT current_owner_id FROM masterpieces WHERE id = ?").get(thread.masterpiece_id);
    if (piece && piece.current_owner_id === userId) return true;
  }
  if (thread.type === 'investor_hub') {
    const access = db.prepare("SELECT 1 FROM investor_hub_write_access WHERE thread_id = ? AND user_id = ? AND can_write = 1").get(thread.id, userId);
    if (access) return true;
  }
  if (thread.type === 'auction_live' && thread.auction_id) {
    const bid = db.prepare("SELECT 1 FROM bids WHERE auction_id = ? AND user_id = ?").get(thread.auction_id, userId);
    if (bid) return true;
  }
  return false;
}

app.get("/api/communication/threads", (req, res) => {
  const userId = Number(req.query.userId);
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const isAdmin = user.role === 'admin' || user.role === 'super_admin';
  const type = req.query.type as string | undefined;
  let rows: any[];
  if (isAdmin && req.query.admin === '1') {
    let sql = "SELECT ct.*, m.title as masterpiece_title, m.serial_id FROM chat_threads ct LEFT JOIN masterpieces m ON ct.masterpiece_id = m.id WHERE 1=1";
    const params: any[] = [];
    if (type) { sql += " AND ct.type = ?"; params.push(type); }
    if (req.query.status) { sql += " AND ct.status = ?"; params.push(req.query.status); }
    if (req.query.assetId) { sql += " AND ct.masterpiece_id = ?"; params.push(req.query.assetId); }
    sql += " ORDER BY ct.priority DESC, ct.updated_at DESC";
    rows = db.prepare(sql).all(...params);
  } else {
    let sql = "SELECT ct.*, m.title as masterpiece_title, m.serial_id FROM chat_threads ct LEFT JOIN masterpieces m ON ct.masterpiece_id = m.id WHERE (ct.user_id = ? OR ct.assigned_admin_id = ?)";
    const params: any[] = [userId, userId];
    if (type) { sql += " AND ct.type = ?"; params.push(type); }
    sql += " AND ct.type != 'black_direct'";
    sql += " ORDER BY ct.priority DESC, ct.updated_at DESC";
    rows = db.prepare(sql).all(...params);
    const assetThreads = db.prepare(`
      SELECT ct.*, m.title as masterpiece_title, m.serial_id FROM chat_threads ct
      JOIN masterpieces m ON ct.masterpiece_id = m.id
      WHERE ct.type = 'asset' AND m.current_owner_id = ? AND ct.user_id != ?
    `).all(userId, userId);
    const merged = [...rows];
    for (const t of assetThreads) {
      if (!merged.find((x: any) => x.id === t.id)) merged.push(t);
    }
    rows = merged.filter((t: any) => canAccessThread(t, userId, user.role, isAdmin));
  }
  res.json(rows);
});

app.post("/api/communication/threads", (req, res) => {
  const { userId, type, masterpieceId, auctionId, poolId } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  if (!COMM_THREAD_TYPES.includes(type)) return res.status(400).json({ error: "Invalid thread type" });
  const priority = ROLES_PRIORITY[user.role] ?? 1;
  if (type === 'black_direct') return res.status(403).json({ error: "Black channel is invite-only" });
  let existing: any = null;
  if (type === 'concierge') {
    existing = db.prepare("SELECT id FROM chat_threads WHERE type = 'concierge' AND user_id = ? AND status = 'open'").get(userId);
  } else if (type === 'asset' && masterpieceId) {
    existing = db.prepare("SELECT id FROM chat_threads WHERE type = 'asset' AND masterpiece_id = ?").get(masterpieceId);
  }
  if (existing) return res.json({ id: existing.id, existing: true });
  const result = db.prepare(`
    INSERT INTO chat_threads (type, user_id, masterpiece_id, auction_id, pool_id, priority, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(type, userId, masterpieceId ?? null, auctionId ?? null, poolId ?? null, priority);
  commAudit('thread_created', userId, Number(result.lastInsertRowid), undefined, undefined, type);
  res.json({ id: result.lastInsertRowid });
});

app.get("/api/communication/threads/:id/messages", (req, res) => {
  const threadId = Number(req.params.id);
  const userId = Number(req.query.userId);
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const thread = db.prepare("SELECT * FROM chat_threads WHERE id = ?").get(threadId);
  if (!thread) return res.status(404).json({ error: "Thread not found" });
  if (!canAccessThread(thread, userId, user.role, user.role === 'admin' || user.role === 'super_admin')) return res.status(403).json({ error: "Forbidden" });
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const before = req.query.before as string | undefined;
  let sql = "SELECT * FROM chat_messages WHERE thread_id = ? AND is_moderated = 0";
  const params: any[] = [threadId];
  if (before) { sql += " AND created_at < ?"; params.push(before); }
  sql += " ORDER BY created_at DESC LIMIT ?";
  params.push(limit);
  const rows = db.prepare(sql).all(...params);
  res.json(rows.reverse());
});

const messageRateLimit = new Map<number, number[]>();
function checkMessageRateLimit(userId: number): boolean {
  const now = Date.now();
  const list = messageRateLimit.get(userId) || [];
  const window = list.filter(t => now - t < 60000);
  if (window.length >= 20) return false;
  window.push(now);
  messageRateLimit.set(userId, window);
  return true;
}

app.post("/api/communication/threads/:id/messages", (req, res) => {
  const threadId = Number(req.params.id);
  const { userId, content, contentLang, assetRef } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  if (!checkMessageRateLimit(userId)) return res.status(429).json({ error: "Too many messages" });
  const thread = db.prepare("SELECT * FROM chat_threads WHERE id = ?").get(threadId);
  if (!thread) return res.status(404).json({ error: "Thread not found" });
  if (!canAccessThread(thread, userId, user.role, user.role === 'admin' || user.role === 'super_admin')) return res.status(403).json({ error: "Forbidden" });
  const result = db.prepare(`
    INSERT INTO chat_messages (thread_id, sender_id, content, content_lang, asset_ref, is_system, is_moderated)
    VALUES (?, ?, ?, ?, ?, 0, 0)
  `).run(threadId, userId, (content || '').toString().trim().slice(0, 10000), contentLang || null, assetRef || null);
  db.prepare("UPDATE chat_threads SET updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(threadId);
  if (!thread.first_response_at && user.role === 'admin') {
    db.prepare("UPDATE chat_threads SET first_response_at = CURRENT_TIMESTAMP WHERE id = ?").run(threadId);
  }
  commAudit('message_sent', userId, threadId, Number(result.lastInsertRowid), undefined, undefined);
  const msg = db.prepare("SELECT * FROM chat_messages WHERE id = ?").get(result.lastInsertRowid);
  broadcast({ type: 'CHAT_MESSAGE', threadId, message: msg });
  res.json(msg);
});

app.get("/api/communication/concierge/status", (req, res) => {
  const rows = db.prepare("SELECT * FROM concierge_availability").all();
  res.json(rows);
});

app.patch("/api/communication/concierge/status", (req, res) => {
  const { adminId, status } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(adminId);
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) return res.status(403).json({ error: "Forbidden" });
  const st = status === 'available' || status === 'busy' ? status : 'away';
  const existing = db.prepare("SELECT id FROM concierge_availability WHERE admin_id = ?").get(adminId);
  if (existing) {
    db.prepare("UPDATE concierge_availability SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE admin_id = ?").run(st, adminId);
  } else {
    db.prepare("INSERT INTO concierge_availability (admin_id, status, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)").run(adminId, st);
  }
  broadcast({ type: 'CONCIERGE_STATUS', adminId, status: st });
  res.json({ status: st });
});

app.get("/api/communication/admin/threads", (req, res) => {
  const adminId = Number(req.query.adminId);
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(adminId);
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) return res.status(403).json({ error: "Forbidden" });
  const type = req.query.type as string | undefined;
  let sql = "SELECT ct.*, m.title as masterpiece_title, m.serial_id FROM chat_threads ct LEFT JOIN masterpieces m ON ct.masterpiece_id = m.id WHERE 1=1";
  const params: any[] = [];
  if (type) { sql += " AND ct.type = ?"; params.push(type); }
  if (req.query.status) { sql += " AND ct.status = ?"; params.push(req.query.status); }
  if (req.query.assetId) { sql += " AND ct.masterpiece_id = ?"; params.push(req.query.assetId); }
  sql += " ORDER BY ct.priority DESC, ct.updated_at DESC";
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

app.post("/api/communication/vault-request", (req, res) => {
  const { userId, masterpieceId, requestType, details } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const piece = db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(masterpieceId);
  if (!piece || piece.current_owner_id !== userId) return res.status(403).json({ error: "Not owner" });
  const allowed = ['audit', 'insurance_update', 'transfer', 'withdrawal'];
  if (!allowed.includes(requestType)) return res.status(400).json({ error: "Invalid request type" });
  const result = db.prepare("INSERT INTO vault_requests (user_id, masterpiece_id, request_type, details) VALUES (?, ?, ?, ?)").run(userId, masterpieceId, requestType, details ? JSON.stringify(details) : null);
  commAudit('asset_transfer_request', userId, undefined, undefined, String(masterpieceId), requestType);
  res.json({ id: result.lastInsertRowid });
});

app.get("/api/communication/login-history", (req, res) => {
  const userId = Number(req.query.userId);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const rows = db.prepare("SELECT id, ip_address, user_agent, success, created_at FROM login_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 50").all(userId);
  res.json(rows);
});

// --- AI Sales Psychology Engine ---
app.post("/api/analytics/asset-view", (req, res) => {
  const { userId, masterpieceId, durationSeconds } = req.body;
  if (!userId || !masterpieceId) return res.status(400).json({ error: "userId and masterpieceId required" });
  db.prepare("INSERT INTO asset_views (user_id, masterpiece_id, duration_seconds) VALUES (?, ?, ?)").run(
    userId, masterpieceId, Math.max(0, Math.min(Number(durationSeconds) || 0, 86400))
  );
  res.json({ success: true });
});

app.get("/api/recent-views", (req, res) => {
  const userId = (req as any).userId;
  if (!userId) return res.json([]);
  const rows = db.prepare(`
    SELECT av.masterpiece_id, av.viewed_at
    FROM asset_views av
    WHERE av.user_id = ? ORDER BY av.viewed_at DESC LIMIT 30
  `).all(userId) as { masterpiece_id: number, viewed_at: string }[];
  const seen = new Set<number>();
  const ids = rows.filter((r) => { if (seen.has(r.masterpiece_id)) return false; seen.add(r.masterpiece_id); return true; }).map((r) => r.masterpiece_id).slice(0, 12);
  const piecesRaw = ids.length ? db.prepare("SELECT * FROM masterpieces WHERE id IN (" + ids.map(() => "?").join(",") + ")").all(...ids) : [];
  const pieces = piecesRaw as any[];
  const orderMap = ids.reduce((acc: Record<number, number>, id, i) => { acc[id] = i; return acc; }, {});
  pieces.sort((a, b) => (orderMap[a.id] ?? 99) - (orderMap[b.id] ?? 99));
  res.json(pieces);
});

app.get("/api/analytics/favorites", (req, res) => {
  const userId = Number(req.query.userId);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const rows = db.prepare("SELECT masterpiece_id FROM user_favorites WHERE user_id = ?").all(userId) as { masterpiece_id: number }[];
  res.json(rows.map(r => r.masterpiece_id));
});

app.post("/api/analytics/favorite", (req, res) => {
  const { userId, masterpieceId, add } = req.body;
  if (!userId || !masterpieceId) return res.status(400).json({ error: "userId and masterpieceId required" });
  if (add) {
    try {
      db.prepare("INSERT INTO user_favorites (user_id, masterpiece_id) VALUES (?, ?)").run(userId, masterpieceId);
    } catch (e: any) {
      if (!e.message?.includes("UNIQUE")) throw e;
    }
  } else {
    db.prepare("DELETE FROM user_favorites WHERE user_id = ? AND masterpiece_id = ?").run(userId, masterpieceId);
  }
  res.json({ success: true });
});

app.post("/api/analytics/interest", (req, res) => {
  const { userId, interestType, referenceId } = req.body;
  if (!userId || !interestType) return res.status(400).json({ error: "userId and interestType required" });
  const allowed = ['drop', 'collection', 'category'];
  if (!allowed.includes(interestType)) return res.status(400).json({ error: "Invalid interestType" });
  db.prepare("INSERT INTO interest_events (user_id, interest_type, reference_id) VALUES (?, ?, ?)").run(
    userId, interestType, referenceId ?? null
  );
  res.json({ success: true });
});

app.post("/api/analytics/design-request", (req, res) => {
  const { userId, masterpieceId, requestType, details } = req.body;
  if (!userId || !requestType) return res.status(400).json({ error: "userId and requestType required" });
  const allowed = ['size', 'proportion', 'stone', 'neck'];
  if (!allowed.includes(requestType)) return res.status(400).json({ error: "Invalid requestType" });
  db.prepare("INSERT INTO design_requests (user_id, masterpiece_id, request_type, details) VALUES (?, ?, ?, ?)").run(
    userId, masterpieceId ?? null, requestType, details ? JSON.stringify(details) : null
  );
  res.json({ success: true });
});

function buildSalesContext(userId: number): Record<string, unknown> {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
  if (!user) return {};

  const viewCount = db.prepare("SELECT COUNT(*) as c FROM asset_views WHERE user_id = ?").get(userId) as { c: number };
  const avgDuration = db.prepare("SELECT AVG(duration_seconds) as d FROM asset_views WHERE user_id = ? AND duration_seconds > 0").get(userId) as { d: number | null };
  const favoriteIds = db.prepare("SELECT masterpiece_id FROM user_favorites WHERE user_id = ?").all(userId) as { masterpiece_id: number }[];
  const recentViews = db.prepare(`
    SELECT av.masterpiece_id, av.duration_seconds, m.title, m.valuation, m.rarity
    FROM asset_views av
    JOIN masterpieces m ON m.id = av.masterpiece_id
    WHERE av.user_id = ? ORDER BY av.viewed_at DESC LIMIT 20
  `).all(userId) as any[];
  const waitlistEntries = db.prepare("SELECT masterpiece_id, request_type, status FROM waitlist WHERE user_id = ?").all(userId) as any[];
  const investorReqs = db.prepare("SELECT type, status FROM investor_requests WHERE user_id = ?").all(userId) as any[];
  const designReqs = db.prepare("SELECT masterpiece_id, request_type, details FROM design_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 10").all(userId) as any[];
  const interestEvents = db.prepare("SELECT interest_type, reference_id FROM interest_events WHERE user_id = ? ORDER BY created_at DESC LIMIT 10").all(userId) as any[];
  const ownedPieces = db.prepare("SELECT id, title, valuation FROM masterpieces WHERE current_owner_id = ?").all(userId) as any[];

  const prestigePref = recentViews.length ? recentViews.reduce((a, r) => a + (r.rarity === 'Unique' || r.rarity === 'Limited' ? 1 : 0), 0) / recentViews.length : 0;

  return {
    visit_count: viewCount?.c ?? 0,
    avg_dwell_seconds: avgDuration?.d ?? 0,
    favorites_count: favoriteIds.length,
    favorite_masterpiece_ids: favoriteIds.map(x => x.masterpiece_id),
    recent_view_titles: recentViews.slice(0, 5).map(r => r.title),
    prestige_preference: prestigePref,
    waitlist_status: waitlistEntries.length ? waitlistEntries.map(w => ({ piece_id: w.masterpiece_id, type: w.request_type, status: w.status })) : [],
    investor_behavior: investorReqs.length ? investorReqs : [],
    design_requests: designReqs.length ? designReqs : [],
    interest_events: interestEvents.length ? interestEvents : [],
    owned_count: ownedPieces.length,
    user_role: user.role,
    user_country: user.country || null,
  };
}

app.get("/api/ai/sales-context/:userId", (req, res) => {
  const userId = Number(req.params.userId);
  const requestingUser = req.query.adminId ? db.prepare("SELECT * FROM users WHERE id = ?").get(Number(req.query.adminId)) : null;
  if (!requestingUser || (requestingUser as any).role !== 'admin' && (requestingUser as any).role !== 'super_admin') {
    return res.status(403).json({ error: "Admin only" });
  }
  res.json(buildSalesContext(userId));
});

app.post("/api/concierge/ai", async (req, res) => {
  const { userId, message, salesContext: injectedContext } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const pieces = db.prepare("SELECT * FROM masterpieces WHERE current_owner_id = ?").all(userId) as any[];
  const salesContext = injectedContext && typeof injectedContext === 'object' ? injectedContext : buildSalesContext(userId);

  const systemPrompt = `You are the AI Concierge for Antonio Bellanova Vault, a luxury atelier platform. Elegant, calm, Maison tone. No slang, no emojis.

Client: ${user.name}, role: ${user.role}. They own ${pieces.length} piece(s).

Context (for accompaniment only; do not cite raw numbers to the client):
- Visit frequency and engagement: use only to tailor tone, not to pressure.
- Favorites / recent views: you may acknowledge interest gently (e.g. "I see you've been drawn to pieces in this collection").
- You MAY: suggest proportions, explain prestige impact of a choice, mention limitation or waitlist status when relevant, explain typical production timeframes.
- You MUST NOT: apply pressure, say "only today" or create false urgency, promise financial returns or appreciation, or make legal guarantees.

Respond in a highly sophisticated, professional, helpful tone. Elegant purchase accompaniment only.`;

  const contextBlock = Object.keys(salesContext).length
    ? `\n[Internal context - do not repeat to client verbatim]: ${JSON.stringify(salesContext)}`
    : '';

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `${systemPrompt}${contextBlock}\n\nClient message: ${message}`,
    });
    const text = (response as any).text ?? (response as any).candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    res.json({ response: text || "I apologise — I am momentarily unable to respond. The Maison will be in touch shortly." });
  } catch (e) {
    res.json({ response: "I apologise, but I am currently attending to another matter. Antonio will contact you shortly." });
  }
});

// --- Vite Integration ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    if (!fs.existsSync(distPath)) {
      console.warn("Production: dist/ not found. Run 'npm run build' first. Serving API only.");
    } else {
      app.use(express.static(distPath));
      app.get("*", (req, res, next) => {
        if (req.path.startsWith("/api")) return next();
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Antonio Bellanova Vault running at http://localhost:${PORT} (NODE_ENV=${process.env.NODE_ENV || "development"})`);
  });
}

startServer();
