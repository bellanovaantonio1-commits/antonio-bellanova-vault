# Prestige Resale Engine

Resale is a **curated prestige system**, not a simple marketplace.

## 1. Resale Review Phase

- When the customer starts resale and **signs** the Resale Commission Agreement:
  - Asset status → **resale_review** (in review).
  - Listing status → **signed**; prestige metrics are computed and stored.
- **Admin decides** one of:
  - **Curated Marketplace** — list on the curated secondary market (then use "Approve" to set masterpiece to `available`).
  - **Private Auction** — create/use auction, set masterpiece to `auction`.
  - **Private Offer** — keep in review for private offer flow.
  - **Maison Buyback** — send a buyback offer to the seller.
  - **Reject** — revert masterpiece to `sold` (owner keeps it).

Endpoint: `POST /api/admin/resale/decision` with `resaleListingId`, `adminId`, `decision`.

## 2. Prestige Impact System

On contract sign, the system computes and stores on the listing:

- **Hold time** — from first ownership to now.
- **Service history** — count of service records.
- **Original/current valuation** — for value development.
- **Prestige score** — from masterpiece + hold/service/demand factors.
- **Market stability score** — from hold, service, and demand.
- **Price recommendation** — suggested resale price.

Function: `computePrestigeResaleMetrics(masterpieceId, currentValuation)`.

## 3. Value Floor Logic

- **min_price** — optional minimum sale price (admin-adjustable).
- **value_floor_pct** — optional % (e.g. 70); floor = price_recommendation × (value_floor_pct/100).
- When setting **min_price** via adjust, the server checks it is not below the value floor if `value_floor_pct` and `price_recommendation` are set.

## 4. Certified Secondary Offering

`GET /api/resale/listing/:id/certified-details` returns:

- Ownership history
- Service history
- Value development (prices at acquisition)
- Prestige category / score
- Limitation level (rarity)
- Price recommendation, market stability score, asking_price, min_price

## 5. Maison Buyback

- **Send offer:** `POST /api/admin/resale/buyback-offer` with `resaleListingId`, `adminId`, `offeredAmount`. Creates a row in **maison_buyback_offers** (status `pending`).
- **Accept:** `POST /api/resale/accept-buyback` with `offerId`, `userId` (seller). Asset goes to Vault (`current_owner_id` NULL, status `available`); listing marked sold; audit logged.
- **Decline:** `POST /api/resale/decline-buyback` with `offerId`, `userId`.

Asset can later be re-listed or integrated into an investment pool by admin.

## 6. Audit

All actions are logged in **resale_audit_log**:

- contract_signed, resale_rejected, decision_curated_marketplace, decision_private_auction, decision_private_offer, decision_maison_buyback, buyback_offer_sent, buyback_accepted, buyback_declined, resale_adjusted, resale_completed, etc.

## 7. Tables / Columns

- **masterpieces:** prestige_score, prestige_category (optional).
- **resale_listings:** original_valuation_at_listing, prestige_score_at_listing, market_stability_score, price_recommendation, value_floor_pct, admin_decision, decided_at, decided_by.
- **maison_buyback_offers:** resale_listing_id, offered_amount, status, offered_by, offered_at, responded_at.

Existing ownership and contract logic is not replaced.
