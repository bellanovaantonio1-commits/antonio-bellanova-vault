import type { Application } from "express";
import type { DbInterface } from "../../lib/db.js";

const SECTION_TYPES = new Set([
  "hero",
  "category_block",
  "product_row",
  "featured_piece",
  "split",
  "editorial",
]);

function slugOk(s: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s) && s.length <= 80;
}

export function registerCuratedMaisonRoutes(app: Application, db: DbInterface): void {
  app.get("/api/curated/pages/public", async (_req, res) => {
    try {
      const rows = (await (
        await db.prepare(
          "SELECT slug, nav_label, nav_order FROM curated_pages WHERE published = 1 ORDER BY nav_order ASC, id ASC"
        )
      ).all()) as { slug: string; nav_label: string; nav_order: number }[];
      res.json(rows);
    } catch (e) {
      console.error("[curated/public pages]", e);
      res.status(500).json({ error: "Failed to load pages" });
    }
  });

  app.get("/api/curated/page/:slug", async (req, res) => {
    const slug = String(req.params.slug || "").toLowerCase();
    if (!slugOk(slug)) return res.status(400).json({ error: "Invalid slug" });
    try {
      const page = (await (await db.prepare("SELECT * FROM curated_pages WHERE slug = ? AND published = 1")).get(slug)) as Record<
        string,
        unknown
      > | undefined;
      if (!page) return res.status(404).json({ error: "Not found" });
      const pageId = Number(page.id);
      const sections = (await (
        await db.prepare(
          "SELECT id, section_type, sort_order, config FROM curated_sections WHERE page_id = ? ORDER BY sort_order ASC, id ASC"
        )
      ).all(pageId)) as { id: number; section_type: string; sort_order: number; config: string }[];
      const parsed = sections.map((s) => {
        let cfg: Record<string, unknown> = {};
        try {
          cfg = JSON.parse(s.config || "{}") as Record<string, unknown>;
        } catch {
          cfg = {};
        }
        return { id: s.id, section_type: s.section_type, sort_order: s.sort_order, config: cfg };
      });
      res.json({
        page: {
          id: page.id,
          slug: page.slug,
          title: page.title,
          nav_label: page.nav_label,
        },
        sections: parsed,
      });
    } catch (e) {
      console.error("[curated/page]", e);
      res.status(500).json({ error: "Failed to load page" });
    }
  });

  /** Setzt alle Maison-Seiten von Entwurf auf veröffentlicht (Navigation + öffentliche Ansicht). */
  app.post("/api/admin/curated/pages/publish-drafts", async (_req, res) => {
    try {
      const r = await (await db.prepare("UPDATE curated_pages SET published = 1, updated_at = CURRENT_TIMESTAMP WHERE published = 0")).run();
      res.json({ ok: true, updated: Number(r.changes ?? 0) });
    } catch (e) {
      console.error("[curated/publish-drafts]", e);
      res.status(500).json({ error: "Failed" });
    }
  });

  app.get("/api/admin/curated/pages", async (_req, res) => {
    try {
      const rows = (await (
        await db.prepare(
          `SELECT p.*, (SELECT COUNT(*) FROM curated_sections s WHERE s.page_id = p.id) AS section_count
           FROM curated_pages p ORDER BY p.nav_order ASC, p.id ASC`
        )
      ).all()) as Record<string, unknown>[];
      res.json(rows);
    } catch (e) {
      console.error("[curated/admin pages]", e);
      res.status(500).json({ error: "Failed" });
    }
  });

  app.post("/api/admin/curated/pages", async (req, res) => {
    const slug = String(req.body?.slug || "")
      .toLowerCase()
      .trim();
    const title = String(req.body?.title ?? "").slice(0, 200);
    const nav_label = String(req.body?.nav_label ?? title).slice(0, 200);
    const published = req.body?.published ? 1 : 0;
    const nav_order = Math.floor(Number(req.body?.nav_order) || 0);
    if (!slugOk(slug)) return res.status(400).json({ error: "Invalid slug" });
    try {
      const r = await (
        await db.prepare(
          "INSERT INTO curated_pages (slug, title, nav_label, published, nav_order) VALUES (?, ?, ?, ?, ?)"
        )
      ).run(slug, title, nav_label, published, nav_order);
      res.json({ id: Number(r.lastInsertRowid), slug, title, nav_label, published, nav_order });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      const code = (e as { code?: string })?.code;
      if (msg.includes("UNIQUE") || code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Slug already exists" });
      res.status(500).json({ error: "Failed to create" });
    }
  });

  app.patch("/api/admin/curated/pages/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });
    try {
      const cur = (await (await db.prepare("SELECT * FROM curated_pages WHERE id = ?")).get(id)) as Record<string, unknown> | undefined;
      if (!cur) return res.status(404).json({ error: "Not found" });
      const title = req.body?.title !== undefined ? String(req.body.title).slice(0, 200) : String(cur.title ?? "");
      const nav_label =
        req.body?.nav_label !== undefined ? String(req.body.nav_label).slice(0, 200) : String(cur.nav_label ?? "");
      const published = req.body?.published !== undefined ? (req.body.published ? 1 : 0) : Number(cur.published ?? 0);
      const nav_order = req.body?.nav_order !== undefined ? Math.floor(Number(req.body.nav_order) || 0) : Number(cur.nav_order ?? 0);
      let slug = String(cur.slug ?? "");
      if (req.body?.slug !== undefined) {
        const ns = String(req.body.slug || "")
          .toLowerCase()
          .trim();
        if (!slugOk(ns)) return res.status(400).json({ error: "Invalid slug" });
        slug = ns;
      }
      await (
        await db.prepare(
          "UPDATE curated_pages SET slug = ?, title = ?, nav_label = ?, published = ?, nav_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        )
      ).run(slug, title, nav_label, published, nav_order, id);
      res.json({ ok: true });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      const code = (e as { code?: string })?.code;
      if (msg.includes("UNIQUE") || code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Slug conflict" });
      res.status(500).json({ error: "Failed" });
    }
  });

  app.delete("/api/admin/curated/pages/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });
    await (await db.prepare("DELETE FROM curated_pages WHERE id = ?")).run(id);
    res.json({ ok: true });
  });

  app.get("/api/admin/curated/pages/:id/sections", async (req, res) => {
    const pageId = Number(req.params.id);
    const rows = (await (
      await db.prepare(
        "SELECT id, page_id, section_type, sort_order, config FROM curated_sections WHERE page_id = ? ORDER BY sort_order ASC, id ASC"
      )
    ).all(pageId)) as { id: number; page_id: number; section_type: string; sort_order: number; config: string }[];
    const parsed = rows.map((s) => {
      let cfg: Record<string, unknown> = {};
      try {
        cfg = JSON.parse(s.config || "{}") as Record<string, unknown>;
      } catch {
        cfg = {};
      }
      return { id: s.id, page_id: s.page_id, section_type: s.section_type, sort_order: s.sort_order, config: cfg };
    });
    res.json(parsed);
  });

  app.post("/api/admin/curated/pages/:id/sections", async (req, res) => {
    const pageId = Number(req.params.id);
    if (!pageId) return res.status(400).json({ error: "Invalid page" });
    const section_type = String(req.body?.section_type || "");
    if (!SECTION_TYPES.has(section_type)) return res.status(400).json({ error: "Invalid section type" });
    let config: Record<string, unknown> = {};
    if (req.body?.config && typeof req.body.config === "object" && !Array.isArray(req.body.config)) {
      config = req.body.config as Record<string, unknown>;
    }
    const cfgStr = JSON.stringify(config);
    const maxRow = (await (await db.prepare("SELECT COALESCE(MAX(sort_order), -1) AS m FROM curated_sections WHERE page_id = ?")).get(
      pageId
    )) as { m: number } | undefined;
    const sort_order = Number(maxRow?.m ?? -1) + 1;
    const r = await (
      await db.prepare("INSERT INTO curated_sections (page_id, section_type, sort_order, config) VALUES (?, ?, ?, ?)")
    ).run(pageId, section_type, sort_order, cfgStr);
    res.json({ id: Number(r.lastInsertRowid), page_id: pageId, section_type, sort_order, config });
  });

  app.patch("/api/admin/curated/sections/:id", async (req, res) => {
    const id = Number(req.params.id);
    const cur = (await (await db.prepare("SELECT * FROM curated_sections WHERE id = ?")).get(id)) as
      | Record<string, unknown>
      | undefined;
    if (!cur) return res.status(404).json({ error: "Not found" });
    const section_type =
      req.body?.section_type !== undefined ? String(req.body.section_type) : String(cur.section_type ?? "");
    if (!SECTION_TYPES.has(section_type)) return res.status(400).json({ error: "Invalid section type" });
    let configStr = String(cur.config ?? "{}");
    if (req.body?.config !== undefined) {
      configStr = JSON.stringify(typeof req.body.config === "object" && req.body.config !== null ? req.body.config : {});
    }
    const sort_order =
      req.body?.sort_order !== undefined ? Math.floor(Number(req.body.sort_order) || 0) : Number(cur.sort_order ?? 0);
    await (
      await db.prepare(
        "UPDATE curated_sections SET section_type = ?, sort_order = ?, config = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      )
    ).run(section_type, sort_order, configStr, id);
    res.json({ ok: true });
  });

  app.delete("/api/admin/curated/sections/:id", async (req, res) => {
    const id = Number(req.params.id);
    await (await db.prepare("DELETE FROM curated_sections WHERE id = ?")).run(id);
    res.json({ ok: true });
  });

  app.post("/api/admin/curated/pages/:id/reorder", async (req, res) => {
    const pageId = Number(req.params.id);
    const ids = Array.isArray(req.body?.section_ids)
      ? (req.body.section_ids as unknown[]).map((x) => Number(x)).filter((n) => n > 0)
      : [];
    if (!ids.length) return res.status(400).json({ error: "section_ids required" });
    try {
      await db.transaction(async (tx) => {
        for (let i = 0; i < ids.length; i++) {
          await (
            await tx.prepare(
              "UPDATE curated_sections SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND page_id = ?"
            )
          ).run(i, ids[i], pageId);
        }
      });
      res.json({ ok: true });
    } catch (e) {
      console.error("[curated/reorder]", e);
      res.status(500).json({ error: "Reorder failed" });
    }
  });
}
