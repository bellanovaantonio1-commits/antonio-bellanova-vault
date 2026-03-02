# Controlled Resale Ecosystem

Resale is strategically tied to the platform without legally prohibiting external sales.

## 1. Certified Resale (Platform)

When resale runs **through the platform**:

- Registry is updated (ownership, provenance).
- New Certificate of Authenticity is generated.
- Warranty remains valid (`warranty_void = 0`, `transfer_type = 'platform'`).
- Prestige Score remains active.
- Service history stays linked.

## 2. External Transfer

When an asset is **sold or transferred outside** the platform:

- Registry is marked as **"extern transferiert"** (`transfer_type = 'external'`).
- No automatic registry update or new certificate.
- **Warranty lapses** (`warranty_void = 1`).
- No Prestige tracking for that asset.

**Endpoint:** `POST /api/masterpieces/:id/mark-external` with `userId` (current owner) or `adminId` (admin). Only admin or current owner may call. Sets `transfer_type = 'external'`, `warranty_void = 1`, and adds a provenance entry.

## 3. Contract Addendum

**Purchase / Deposit Agreement** includes:

- Recommendation to conduct future resale via the Antonio Bellanova Vault platform.
- Note that platform resale ensures Registry update, new certificate, warranty continuity, and preservation of Prestige Score and Service History.
- Clarification that these benefits do not apply to external transfers.

**Resale Commission Agreement** includes:

- Certified Resale Benefits: only platform resale triggers registry update, new certificate, warranty validity, active Prestige, linked service history.
- External transfer: no prohibition, but registry marked "externally transferred", no auto update/certificate, warranty lapses, Prestige discontinued.

## 4. Resale Commission (Existing)

- Standard 8%, VIP 6%, Royal/Black 5%.
- Automatic contract generation on Resale Start.

## 5. Schema

- **masterpieces:** `transfer_type` TEXT DEFAULT 'platform' ('platform' | 'external'), `warranty_void` INTEGER DEFAULT 0.
- On platform resale completion (and Maison buyback): `transfer_type = 'platform'`, `warranty_void = 0`.
