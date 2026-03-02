# International Luxury Maison — Legal & Asset System

## Overview

Fully international, scalable contract and asset architecture for the Antonio Bellanova High-Luxury Made-to-Order jewellery platform. All systems extend existing functionality; nothing is replaced.

---

## 1. Automatic Number Systems

All identifiers are **automatically generated** and **not manually editable**.

| System | Format | Example |
|--------|--------|---------|
| **Product serial** | `AB-YYYY-CAT-XXXX` | `AB-2025-NEC-0001` |
| **Contract** | `CTR-TYPE-YYYY-XXXX` | `CTR-DEP-2025-0001`, `CTR-SALE-2025-0002`, `CTR-RSL-2025-0003`, `CTR-VIP-2025-0004` |
| **Certificate** | `CERT-YYYY-XXXX` | `CERT-2025-0001` |

- **Product serial:** Generated on masterpiece creation when no `serial_id` is provided. `CAT` is derived from category (e.g. Necklace → NEC, Ring → RNG). Stored in `number_sequences` per category/year.
- **Contract ref:** Generated for every new contract (deposit, invoice, resale, VIP, etc.). Type codes: DEP, INV, SALE, RSL, VIP, FRA, REG, SVC, WAR, TC.
- **Certificate ref:** Generated on first issue, resale completion, or admin certificate generation.

**Implementation:** `server.ts` — `nextProductSerial(category)`, `nextContractRef(contractType)`, `nextCertRef()`; table `number_sequences`.

---

## 2. Contract Architecture (International)

- **Primary language:** English. **Optional:** German (and extensible to FR, AR).
- **International:** Wording suitable for cross-border use; jurisdiction selectable in contract footer.
- **Digital signature:** Supported; signature block on every document.
- **Premium PDF:** Documents are generated as luxury HTML (black/gold, serif, watermark). Download via **GET /api/contracts/:id/download** (open in browser → Print → Save as PDF).
- **Versioning:** Contract table has `version` and `parent_id` for amendments.

### Contract Modules (Reference)

1. **Master Purchase Agreement** — Overall terms of acquisition (framework).
2. **Deposit Agreement** — Reservation, deposit %, no ownership transfer. Uses `CTR-DEP-YYYY-XXXX`.
3. **Final Payment & Ownership Transfer Agreement** — Issued with final invoice; ownership only after full payment + escrow release.
4. **Certified Resale Agreement** — 8% (default), VIP 6%, Royal/Black 5%. Uses `CTR-RSL-YYYY-XXXX`.
5. **VIP Membership Agreement** — €15,000/year; 48h early access, private auctions, concierge, repair priority, reduced resale commission, invite-only events. Uses `CTR-VIP-YYYY-XXXX`.
6. **Fractional Ownership Agreement** — Template for fractional terms (no physical division of the object).
7. **Digital Asset Registry Agreement** — Acknowledgment of registry and certificate system.
8. **Service & Restoration Agreement** — Cleaning, repair, stone upgrade, adjustment; linked to registry.
9. **Extended Luxury Warranty Agreement** — Optional extended warranty terms.
10. **Platform Terms & Conditions (Global)** — General terms; jurisdiction in footer.

Contract types in DB: `deposit`, `invoice`, `certificate`, `resale_commission`, `vip`, etc. New types can use `nextContractRef(type)` and the same luxury document engine.

---

## 3. Payment Flow & Ownership

**Rule:** Ownership is transferred **only** when:

- 100% payment is received and confirmed
- Escrow is released (after delivery + inspection window)
- Certificate of Authenticity is generated
- Registry (ownership_history, masterpiece.current_owner_id) is updated

**Deposit:**

- Reserves the piece and starts production.
- **Does not** transfer ownership; ownership remains with the Atelier until final settlement.

**Implementation:** In `server.ts`, `current_owner_id` and status `sold` are set only in the purchase workflow step `completed` (after final payment, escrow release, certificate creation, and provenance update).

---

## 4. Resale System (8% / 6% / 5%)

- Resale start → status `resale_review`.
- Resale contract is generated automatically with correct commission (Standard 8%, VIP 6%, Royal/Black 5%).
- New registry version is prepared on platform resale completion; new certificate generated with `nextCertRef()`.
- Externally sold assets: `transfer_type = 'external'`, `warranty_void = 1`; no automatic update or new certificate.

---

## 5. Fractional Investor System

- **Allowed:** Fractional participation in a physical asset; percentage ownership; exit logic; optional dividend mechanism; configurable minimum investment.
- **Constraint:** No physical division of the object; fractional shares are contractual/registry only.
- Tables: `fractional_shares`, `fractional_transfers`; admin endpoint for fractional pool setup.

---

## 6. VIP Membership (€15,000)

- Contract includes: annual fee, 48h early access, private auction access, concierge, repair priority, reduced resale commission, invite-only events, term and cancellation rules.
- Stored with luxury document and `CTR-VIP-YYYY-XXXX`. On approval, VIP contract is generated and user role updated.

---

## 7. Digital Asset Registry

For each piece the registry holds:

- Serial number (product serial)
- Production year
- Materials & gemstone data
- Ownership history
- Service history
- Prestige metrics (hold time, service count, etc.)
- Market status, transfer type, warranty status

**API:** **GET /api/registry/masterpiece/:id** — returns full registry record (serial, production_year, materials, gemstones, ownership_history, service_history, prestige_metrics, market_status, transfer_type, warranty_void, provenance_timeline, valuation, title, category).

Certificates are generated automatically on: first purchase (workflow completed), resale completion, and admin “Generate Certificate”.

---

## 8. Service & Aftercare

- Services: cleaning, repair, stone upgrade, adjustment (stored in `service_history` and exposed in registry).
- **API:** **POST /api/admin/service/add** — adds a service record; linked to masterpiece and visible in **GET /api/registry/masterpiece/:id**.

---

## 9. Luxury PDF Design Engine

- **Design:** Black background (#0d0d0d), gold accents (#c9a227), serif typography (Georgia), centred layout.
- **Elements:** Watermark “Antonio Bellanova”; vertical brand strips; document ref, client ref, version, date; asset block; content body; **central signature block** (Atelier + Client); footer with jurisdiction, blockchain hash, “Save as PDF” note.
- **Download:** **GET /api/contracts/:id/download** returns full HTML; user opens in browser and uses Print → Save as PDF for a premium PDF.

---

## 10. Multilingualism

- **Default:** EN. Supported: DE, FR, AR (optional).
- User preference: `users.language`. Contract content can be generated in the user’s language (e.g. EN primary, DE optional); jurisdiction and tax hints in footer support international use.

---

## 11. Admin System

- **Sales overview:** **GET /api/admin/sales** — list of payments with user name, email, address (as country/region), masterpiece, amount, status.
- **Bank config:** **GET/POST /api/admin/bank-config** — store/retrieve bank details (JSON) in `admin_config`.
- **Resale:** Approve, reject, adjust, prioritise auction, buyback (existing endpoints).
- **Registry:** Admin can change data via existing masterpiece/user APIs; registry is the aggregated view of masterpieces, ownership_history, service_history, provenance.
- **Inventory export:** **GET /api/admin/inventory/export** — CSV of all masterpieces (id, serial_id, title, category, materials, gemstones, valuation, rarity, status, current_owner_id, transfer_type, warranty_void, created_at).

---

## 12. International Compliance

- **GDPR:** Data handling and consent as per platform terms; no PII in logs; user data in `users` and related tables.
- **Payments:** International payment integration ready (IBAN/reference in payments; bank config for display).
- **Tax:** Tax hint module can be added to contract footer (e.g. “VAT/tax obligations remain with the client in their jurisdiction”).
- **Jurisdiction:** Contract footer includes “Jurisdiction: [e.g. Federal Republic of Germany]” (configurable via `options.jurisdiction` in `generateLuxuryDocument`).

---

## API Summary

| Endpoint | Description |
|---------|-------------|
| `GET /api/contracts/:id/download` | Premium HTML download for contract/certificate (Print to PDF) |
| `GET /api/admin/sales` | Sales list (name, email, address, masterpiece, amount) |
| `GET/POST /api/admin/bank-config` | Bank configuration (JSON) |
| `GET /api/admin/inventory/export` | Inventory CSV export |
| `GET /api/registry/masterpiece/:id` | Full Digital Asset Registry record |

All contract and certificate creation paths use the automatic number generators; product serial is assigned on masterpiece creation when omitted.
