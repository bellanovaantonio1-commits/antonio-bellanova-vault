import type { Application } from "express";
import type { DbInterface } from "../../lib/db.js";

const MAX_SECTIONS = 40;
const MAX_BLOCKS = 80;
const MAX_STR = 4000;

export type BlockSize = "sm" | "md" | "lg" | "full";

export type CtaAction = "consultation" | "contact" | "view" | "external" | "piece";

export type ExperienceKind = "hero" | "category" | "featured" | "product_grid" | "story" | "service" | "custom";

export type MarketplaceBlock = {
  id: string;
  type: "product" | "image" | "text" | "category" | "spacer" | "cta";
  size: BlockSize;
  sortOrder: number;
  column?: "left" | "right";
  productId?: number;
  imageUrl?: string;
  imageAlt?: string;
  linkType?: "none" | "piece" | "view" | "external";
  linkPieceId?: number;
  linkView?: string;
  linkUrl?: string;
  headline?: string;
  body?: string;
  categoryLabel?: string;
  categorySubline?: string;
  spacerPx?: number;
  ctaLabel?: string;
  ctaSubline?: string;
  ctaAction?: CtaAction;
  ctaView?: string;
  ctaUrl?: string;
  ctaPieceId?: number;
};

export type MarketplaceSection = {
  id: string;
  type: "grid" | "stack" | "split";
  sortOrder: number;
  title?: string;
  subtitle?: string;
  hidden?: boolean;
  experienceKind?: ExperienceKind;
  blocks: MarketplaceBlock[];
};

export type MarketplaceLayoutDoc = {
  version: 1;
  enabled: boolean;
  sections: MarketplaceSection[];
};

function clip(s: unknown, n: number): string {
  return String(s ?? "")
    .slice(0, n)
    .trim();
}

function sanitizeSize(v: unknown): BlockSize {
  return v === "sm" || v === "md" || v === "lg" || v === "full" ? v : "md";
}

function splitColumn(raw: unknown): "left" | "right" | undefined {
  const c = (raw as Record<string, unknown>)?.column;
  return c === "left" || c === "right" ? c : undefined;
}

function sanitizeBlock(raw: unknown, index: number, sectionType: string): MarketplaceBlock | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  const id = clip(b.id, 120) || `blk_${index}`;
  const type = b.type;
  if (type !== "product" && type !== "image" && type !== "text" && type !== "category" && type !== "spacer" && type !== "cta") return null;
  const size = sanitizeSize(b.size);
  const sortOrder = Number.isFinite(Number(b.sortOrder)) ? Number(b.sortOrder) : index;
  const column = sectionType === "split" ? splitColumn(raw) : undefined;
  const withCol = <T extends MarketplaceBlock>(x: T): T =>
    column ? ({ ...x, column } as T) : x;
  const base: MarketplaceBlock = { id, type, size, sortOrder };
  if (type === "product") {
    const pid = Math.floor(Number(b.productId) || 0);
    return withCol({ ...base, productId: pid > 0 ? pid : undefined });
  }
  if (type === "image") {
    const lid = Math.floor(Number(b.linkPieceId) || 0);
    return withCol({
      ...base,
      imageUrl: clip(b.imageUrl, MAX_STR) || undefined,
      imageAlt: clip(b.imageAlt, 500) || undefined,
      linkType: ["none", "piece", "view", "external"].includes(String(b.linkType)) ? (b.linkType as MarketplaceBlock["linkType"]) : "none",
      linkPieceId: lid > 0 ? lid : undefined,
      linkView: clip(b.linkView, 80) || undefined,
      linkUrl: clip(b.linkUrl, MAX_STR) || undefined,
    });
  }
  if (type === "text") {
    return withCol({
      ...base,
      headline: clip(b.headline, 500) || undefined,
      body: clip(b.body, MAX_STR) || undefined,
    });
  }
  if (type === "category") {
    return withCol({
      ...base,
      categoryLabel: clip(b.categoryLabel, 500) || undefined,
      categorySubline: clip(b.categorySubline, MAX_STR) || undefined,
      linkView: clip(b.linkView, 80) || undefined,
    });
  }
  if (type === "cta") {
    const act = String(b.ctaAction || "consultation");
    const ctaAction: CtaAction = ["consultation", "contact", "view", "external", "piece"].includes(act) ? (act as CtaAction) : "consultation";
    const lid = Math.floor(Number(b.ctaPieceId) || 0);
    return withCol({
      ...base,
      type: "cta",
      ctaLabel: clip(b.ctaLabel, 200) || "Beratung",
      ctaSubline: clip(b.ctaSubline, MAX_STR) || undefined,
      ctaAction,
      ctaView: clip(b.ctaView, 80) || undefined,
      ctaUrl: clip(b.ctaUrl, MAX_STR) || undefined,
      ctaPieceId: lid > 0 ? lid : undefined,
    });
  }
  const sp = Math.min(240, Math.max(8, Math.floor(Number(b.spacerPx) || 32)));
  return withCol({ ...base, spacerPx: sp });
}

function sanitizeLayout(raw: unknown): MarketplaceLayoutDoc | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (Number(o.version) !== 1) return null;
  const enabled = Boolean(o.enabled);
  const sectionsIn = Array.isArray(o.sections) ? o.sections : [];
  const sections: MarketplaceSection[] = [];
  for (let si = 0; si < Math.min(sectionsIn.length, MAX_SECTIONS); si++) {
    const s = sectionsIn[si];
    if (!s || typeof s !== "object") continue;
    const rec = s as Record<string, unknown>;
    const id = clip(rec.id, 120) || `sec_${si}`;
    const st = rec.type;
    const type = st === "stack" || st === "split" ? st : "grid";
    const title = clip(rec.title, 300) || undefined;
    const subtitle = clip(rec.subtitle, 500) || undefined;
    const hidden = Boolean(rec.hidden);
    const ekRaw = clip(rec.experienceKind, 40);
    const allowedKinds: readonly string[] = ["hero", "category", "featured", "product_grid", "story", "service", "custom"];
    const experienceKind: ExperienceKind | undefined = allowedKinds.includes(ekRaw) ? (ekRaw as ExperienceKind) : undefined;
    const blocksIn = Array.isArray(rec.blocks) ? rec.blocks : [];
    const blocks: MarketplaceBlock[] = [];
    for (let bi = 0; bi < Math.min(blocksIn.length, MAX_BLOCKS); bi++) {
      const blk = sanitizeBlock(blocksIn[bi], bi, type);
      if (blk) blocks.push(blk);
    }
    sections.push({ id, type, sortOrder: si, title, subtitle, hidden, experienceKind, blocks });
  }
  return { version: 1, enabled, sections };
}

const DEFAULT_JSON = JSON.stringify({ version: 1, enabled: false, sections: [] } satisfies MarketplaceLayoutDoc);

export function registerMarketplaceLayoutRoutes(app: Application, db: DbInterface): void {
  app.get("/api/marketplace/layout", async (_req, res) => {
    try {
      const row = (await (await db.prepare("SELECT layout_json FROM marketplace_layout WHERE id = 1")).get()) as
        | { layout_json: string }
        | undefined;
      if (!row?.layout_json) {
        return res.json({ layout: JSON.parse(DEFAULT_JSON) as MarketplaceLayoutDoc });
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(row.layout_json);
      } catch {
        return res.json({ layout: JSON.parse(DEFAULT_JSON) as MarketplaceLayoutDoc });
      }
      const doc = sanitizeLayout(parsed);
      if (!doc) return res.json({ layout: JSON.parse(DEFAULT_JSON) as MarketplaceLayoutDoc });
      res.json({ layout: doc });
    } catch (e) {
      console.error("[marketplace/layout GET]", e);
      res.status(500).json({ error: "Failed to load layout" });
    }
  });

  app.put("/api/admin/marketplace/layout", async (req, res) => {
    try {
      const body = req.body?.layout ?? req.body;
      const doc = sanitizeLayout(body);
      if (!doc) return res.status(400).json({ error: "Invalid layout document" });
      const json = JSON.stringify(doc);
      if (json.length > 2_000_000) return res.status(400).json({ error: "Layout too large" });
      if (db.isMySQL) {
        await (
          await db.prepare(
            "INSERT INTO marketplace_layout (id, layout_json, updated_at) VALUES (1, ?, CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE layout_json = VALUES(layout_json), updated_at = CURRENT_TIMESTAMP"
          )
        ).run(json);
      } else {
        await (
          await db.prepare(
            "INSERT INTO marketplace_layout (id, layout_json, updated_at) VALUES (1, ?, datetime('now')) ON CONFLICT(id) DO UPDATE SET layout_json = excluded.layout_json, updated_at = datetime('now')"
          )
        ).run(json);
      }
      res.json({ ok: true, layout: doc });
    } catch (e) {
      console.error("[marketplace/layout PUT]", e);
      res.status(500).json({ error: "Failed to save layout" });
    }
  });
}
