# AI Sales Psychology Engine — Architecture

**Goal:** Support purchase decisions intelligently without being pushy. Elegant purchase accompaniment; no aggressive conversion.

---

## 1. Data the AI Analyses

| Signal | Source | Description |
|--------|--------|-------------|
| Visit frequency | asset_views | Count of views per user (and per asset) over time |
| Time per asset | asset_views.duration_seconds | Dwell time per masterpiece view |
| Favorites rate | user_favorites | Which assets the user has favourited |
| Drop interest | interest_events (type=drop) | Interest in drops / launches |
| Prestige preference | masterpieces.prestige_* + views | Inferred from which pieces they view (high/low prestige) |
| Size requests | design_requests | Requests for size, proportion, main stone, neck measurement |
| Investor behaviour | investor_view_logs, investor_requests | Allocation requests, meeting requests, dataroom |
| Regional trends | users.country + aggregates | Optional regional demand (for context only) |

---

## 2. What the System Recognizes (Derived Signals)

- **Purchase readiness** — e.g. multiple visits, long dwell, favorites, size requests.
- **Price sensitivity** — e.g. repeated views of lower-valuation pieces only; budget in waitlist.
- **Upgrade probability** — e.g. already owns pieces; views higher-prestige items.
- **Resale interest** — e.g. resale tab usage, resale chat threads.
- **VIP potential** — e.g. engagement level, role, event RSVPs.

These are **internal signals** for AI context only. They are not shown to the client as “scores”.

---

## 3. AI Allowed (Elegant Accompaniment)

The AI **may**:

- Make **proportion suggestions** (e.g. stone size vs neck measurement).
- Explain **prestige impact** of a design choice.
- Give **limitation hints** (e.g. limited edition, few pieces left).
- Show **waitlist status** (e.g. “This model currently has a waiting list.”).
- Explain **production timeframe** (e.g. “Typically 6–8 weeks for this category.”).

---

## 4. AI Forbidden (No Pressure, No False Urgency)

The AI **must not**:

- Apply **pressure** (e.g. “You should decide soon”).
- Use **“only today”** or similar time-limited claims.
- Invent **artificial urgency** (e.g. “Last one”, “Closing tonight” unless factually true).
- Give **financial promises** (e.g. “This will appreciate”, “Guaranteed return”).

---

## 5. Database Schema (New Tables)

### asset_views

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | |
| user_id | INTEGER FK | |
| masterpiece_id | INTEGER FK | |
| viewed_at | DATETIME | Start of view |
| duration_seconds | INTEGER | Time spent (0 if not yet closed) |

### user_favorites

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | |
| user_id | INTEGER FK | |
| masterpiece_id | INTEGER FK | |
| created_at | DATETIME | |

Unique (user_id, masterpiece_id).

### interest_events

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | |
| user_id | INTEGER FK | |
| interest_type | TEXT | 'drop', 'collection', 'category' |
| reference_id | TEXT | e.g. drop_id, category name |
| created_at | DATETIME | |

### design_requests

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | |
| user_id | INTEGER FK | |
| masterpiece_id | INTEGER FK NULL | Optional asset context |
| request_type | TEXT | 'size', 'proportion', 'stone', 'neck' |
| details | TEXT | JSON: e.g. neck_cm, main_stone_mm |
| created_at | DATETIME | |

Existing: **investor_view_logs**, **waitlist**, **users** (country/language) stay as-is and are used when building the AI context.

---

## 6. API Overview

- **Record:**  
  `POST /api/analytics/asset-view` — (userId, masterpieceId, durationSeconds)  
  `POST /api/analytics/favorite` — (userId, masterpieceId, add: boolean)  
  `POST /api/analytics/interest` — (userId, interestType, referenceId)  
  `POST /api/analytics/design-request` — (userId, masterpieceId?, requestType, details)

- **AI context:**  
  `GET /api/ai/sales-context/:userId` — Returns aggregated signals (for backend/concierge AI only; not raw events).

- **Concierge AI:**  
  `POST /api/concierge/ai` — Accepts optional `salesContext` and injects system prompt with allowed/forbidden rules and context.

---

## 7. Frontend

- On open/close of masterpiece detail: send **asset-view** with duration.
- **Favorite** control (e.g. heart) on piece cards or detail: call **favorite** API.
- Design/size flows (if present): call **design-request** when user submits size/proportion.
- Drop/collection interest: call **interest** when user clicks “Notify me” or similar.

No visible “scores” or “purchase readiness” for the client; signals only feed the AI for tone and content.
