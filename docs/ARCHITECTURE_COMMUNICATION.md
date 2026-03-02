# Luxury Communication & Interaction System — Architecture

**Constraint:** Existing systems (concierge_requests/concierge_messages, private_messages, notifications, audit_logs) are **not replaced**. This module extends the platform with a structured, role-based communication layer.

---

## 1. Database Schema (New Tables Only)

### 1.1 Core: Chat Threads

Unified thread table for all communication types. Type determines visibility and behaviour.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | |
| type | TEXT | `concierge` \| `asset` \| `investor_hub` \| `auction_live` \| `black_direct` \| `vault` |
| status | TEXT | `open` \| `closed` \| `archived` |
| priority | INTEGER | 1=normal, 2=VIP, 3=Royal/Black (for concierge queue) |
| user_id | INTEGER FK | Client/participant (concierge, black_direct, vault) |
| masterpiece_id | INTEGER FK NULL | Asset thread; NULL for concierge/investor/black |
| auction_id | INTEGER FK NULL | For auction_live |
| pool_id | INTEGER FK NULL | For investor_hub (investor_pools if exists) |
| assigned_admin_id | INTEGER FK NULL | Concierge/Black assigned admin |
| first_response_at | DATETIME NULL | Response-time tracking |
| created_at | DATETIME | |
| updated_at | DATETIME | |

- **concierge:** 1:1 user_id ↔ Maison; priority from role (VIP/Royal/Black).
- **asset:** One thread per masterpiece_id (production, service, resale, investment).
- **investor_hub:** pool_id; write access by participation or admin.
- **auction_live:** auction_id; min deposit enforced at join.
- **black_direct:** user_id + assigned_admin_id; no public UI.
- **vault:** user_id + optional masterpiece_id; audit/insurance/transfer/withdrawal.

### 1.2 Messages

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | |
| thread_id | INTEGER FK | |
| sender_id | INTEGER FK | user or admin |
| content | TEXT | Plain text (no HTML by default) |
| content_lang | TEXT | ISO code for i18n |
| asset_ref | TEXT NULL | e.g. serial_id or "masterpiece:123" for linking |
| is_system | INTEGER | 0=user, 1=system (e.g. "Concierge joined") |
| is_moderated | INTEGER | 0=visible, 1=hidden by moderation |
| created_at | DATETIME | |

Indexes: `thread_id`, `sender_id`, `created_at`.  
All inserts must be mirrored to **communication_audit_log** (see below).

### 1.3 Concierge Availability

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | |
| admin_id | INTEGER FK UNIQUE | One row per concierge admin |
| status | TEXT | `available` \| `busy` \| `away` |
| updated_at | DATETIME | |

Used for "Concierge Available" and routing.

### 1.4 Investor Hub Write Access

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | |
| thread_id | INTEGER FK | investor_hub thread |
| user_id | INTEGER FK | |
| can_write | INTEGER | 1=allowed (by share % or admin grant) |
| granted_by_admin_id | INTEGER FK NULL | If granted by admin |
| created_at | DATETIME | |

Optional: derive can_write from fractional_shares / pool membership; this table stores overrides and explicit grants.

### 1.5 Auction Chat Participation

Stored implicitly: user can only post in auction_live if they have a bid or deposit for that auction. Enforced in API. Optional table for "allowed participants" if we want invite-only auctions:

| Column | Type | Description |
|--------|------|-------------|
| auction_id | INTEGER FK | |
| user_id | INTEGER FK | |
| invited | INTEGER | 1=invite-only participant |

(Only used when auction is private/invite-only.)

### 1.6 Login History (Security)

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | |
| user_id | INTEGER FK | |
| ip_address | TEXT | |
| user_agent | TEXT | |
| success | INTEGER | 0=failed, 1=success |
| created_at | DATETIME | |

2FA: add columns to **users** when implementing: `two_fa_enabled INTEGER`, `two_fa_secret TEXT`.

### 1.7 Communication Audit Log

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | |
| action | TEXT | `message_sent` \| `thread_created` \| `thread_closed` \| `asset_transfer_request` \| `governance_vote` |
| thread_id | INTEGER FK NULL | |
| message_id | INTEGER FK NULL | |
| user_id | INTEGER FK | |
| target_id | TEXT NULL | e.g. masterpiece_id, pool_id |
| details | TEXT | JSON or short description |
| created_at | DATETIME | |

No public chat; no unmoderated rooms; no spam (rate limiting in API).

### 1.8 Vault Requests (Secure Vault Communication)

When asset is in vault, owner can request: audit, insurance update, transfer, withdrawal. Stored as structured requests and linked to thread or standalone.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | |
| user_id | INTEGER FK | Owner |
| masterpiece_id | INTEGER FK | |
| request_type | TEXT | `audit` \| `insurance_update` \| `transfer` \| `withdrawal` |
| status | TEXT | `pending` \| `approved` \| `rejected` \| `completed` |
| thread_id | INTEGER FK NULL | Optional link to vault thread |
| details | TEXT | JSON |
| created_at | DATETIME | |

---

## 2. Role Mapping

- **Client:** Concierge (normal priority), Asset threads (own pieces), Vault (own assets).
- **VIP / Royal / Black:** Concierge with higher priority; Black → black_direct channel only, no public UI.
- **Investor:** Concierge, Investor Hub (if pool member / granted), Asset threads (linked assets).
- **Admin:** All threads visible; filter by role, asset, status; can assign concierge/black; moderation.

---

## 3. WebSocket Events (Extend Existing wss)

- **CHAT_MESSAGE** — New message in a thread (payload: thread_id, message object). Clients subscribe by thread_id.
- **CONCIERGE_STATUS** — "Concierge Available" / Busy (payload: admin_id, status).
- **AUCTION_BID** — Existing or new: bid update for live auction feed.
- **AUCTION_CHAT** — New message in auction_live thread (moderated).

Clients send: `{ type: 'CHAT_JOIN', threadId }` / `{ type: 'CHAT_LEAVE', threadId }` to scope delivery (optional server-side subscription map).

---

## 4. API Overview (REST)

- `GET /api/communication/threads` — List threads for current user (role-filtered; Black only black_direct).
- `POST /api/communication/threads` — Create thread (concierge, asset, vault; investor_hub/auction_live/black by rules).
- `GET /api/communication/threads/:id/messages` — Paginated messages; role + thread ownership check.
- `POST /api/communication/threads/:id/messages` — Send message; rate limit; audit log; optional WebSocket broadcast.
- `GET /api/communication/concierge/status` — Concierge availability.
- `PATCH /api/communication/concierge/status` — Admin: set own availability.
- `GET /api/communication/admin/threads` — Admin: all threads, filter by role/asset/status.
- `POST /api/communication/vault-request` — Create vault request (audit, insurance, transfer, withdrawal).
- `GET /api/communication/login-history` — Own login history (IP, user_agent).
- AI Design Consultation: reuse or extend existing `/api/concierge/ai` with product/prestige context; no auto design change.

---

## 5. Frontend (Modular)

- **Chat component:** Reusable thread + message list + composer; role-based visibility; priority badge; i18n via existing `t()`.
- **Concierge:** Entry from dashboard/nav → list/concierge threads → open thread (1:1).
- **Asset:** From masterpiece detail → "Communication" tab → asset thread.
- **Investor Hub:** Separate view for pool threads; write only if allowed.
- **Auction Live:** In auction view when status=active → live chat + bid updates.
- **Black:** No nav item; access via direct link or admin-assigned entry; highest priority.
- **Vault:** From vault view → vault threads + vault request actions (audit, insurance, transfer, withdrawal).

---

## 6. Security Summary

- 2FA: prepared on users (columns); implementation later.
- Login history: IP + user_agent stored on login (success/fail).
- Audit: every message and key action in communication_audit_log.
- No public chat; no unmoderated rooms; rate limiting and optional content filter on send.
