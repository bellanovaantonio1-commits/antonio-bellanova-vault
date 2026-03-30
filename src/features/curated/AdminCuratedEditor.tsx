import React, { useCallback, useEffect, useState } from "react";
import type { Masterpiece } from "../../types";
import { CURATED_SECTION_TYPES, clampProductIds, defaultSectionConfig, type CuratedSectionType } from "./curatedSectionTypes";
import { GripVertical, Trash2, Plus, ChevronDown, ChevronUp, Save } from "lucide-react";

type CuratedPageRow = {
  id: number;
  slug: string;
  title: string;
  nav_label: string;
  published: number;
  nav_order: number;
  section_count?: number;
};

type SectionRow = {
  id: number;
  page_id: number;
  section_type: string;
  sort_order: number;
  config: Record<string, unknown>;
};

function parseIdList(s: string, max: number): number[] {
  const parts = s.split(/[\s,;]+/).map((x) => Number(x.trim()));
  return clampProductIds(parts, max);
}

function idListToString(ids: unknown): string {
  if (!Array.isArray(ids)) return "";
  return ids.join(", ");
}

export function AdminCuratedEditor({
  masterpieces,
  notifyUser,
  t,
  onCuratedContentChanged,
}: {
  masterpieces: Masterpiece[];
  notifyUser: (msg: string, type?: "success" | "error") => void;
  t: (k: string) => string;
  /** Nach Speichern: öffentliche Maison-Navigation und aktuelle Seite im Client neu laden */
  onCuratedContentChanged?: () => void;
}) {
  const [pages, setPages] = useState<CuratedPageRow[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [newSlug, setNewSlug] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [dragId, setDragId] = useState<number | null>(null);

  const loadPages = useCallback(async () => {
    const r = await fetch("/api/admin/curated/pages", { credentials: "include" });
    if (!r.ok) return;
    const data = (await r.json()) as CuratedPageRow[];
    setPages(
      (Array.isArray(data) ? data : []).map((p) => ({
        ...p,
        published: Number(p.published) ? 1 : 0,
      }))
    );
  }, []);

  const loadSections = useCallback(async (pageId: number) => {
    const r = await fetch(`/api/admin/curated/pages/${pageId}/sections`, { credentials: "include" });
    if (!r.ok) return;
    const data = await r.json();
    setSections(data);
  }, []);

  useEffect(() => {
    void loadPages();
  }, [loadPages]);

  useEffect(() => {
    if (selectedPageId) void loadSections(selectedPageId);
    else setSections([]);
  }, [selectedPageId, loadSections]);

  const persistReorder = async (ordered: SectionRow[]) => {
    if (!selectedPageId) return;
    const r = await fetch(`/api/admin/curated/pages/${selectedPageId}/reorder`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section_ids: ordered.map((s) => s.id) }),
    });
    if (r.ok) {
      notifyUser(t("maison.admin_reorder_saved") || "Reihenfolge gespeichert.", "success");
      onCuratedContentChanged?.();
    } else notifyUser(t("errors.generic") || "Fehler", "error");
  };

  const onDragStart = (id: number) => setDragId(id);
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const onDrop = (targetId: number) => {
    if (dragId == null || dragId === targetId) return;
    const ix = sections.findIndex((s) => s.id === dragId);
    const ti = sections.findIndex((s) => s.id === targetId);
    if (ix < 0 || ti < 0) return;
    const next = [...sections];
    const [removed] = next.splice(ix, 1);
    next.splice(ti, 0, removed);
    setSections(next);
    setDragId(null);
    void persistReorder(next);
  };

  const updateSectionLocal = (id: number, patch: Partial<SectionRow>) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const saveSection = async (s: SectionRow) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/curated/sections/${s.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section_type: s.section_type, config: s.config, sort_order: s.sort_order }),
      });
      if (r.ok) {
        notifyUser(t("maison.admin_section_saved") || "Gespeichert.", "success");
        onCuratedContentChanged?.();
      } else notifyUser(t("errors.generic") || "Fehler", "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteSection = async (id: number) => {
    if (!confirm(t("maison.admin_confirm_delete_section") || "Section löschen?")) return;
    const r = await fetch(`/api/admin/curated/sections/${id}`, { method: "DELETE", credentials: "include" });
    if (r.ok) {
      setSections((prev) => prev.filter((s) => s.id !== id));
      notifyUser(t("maison.admin_deleted") || "Gelöscht.", "success");
      onCuratedContentChanged?.();
    }
  };

  const addSection = async (type: CuratedSectionType) => {
    if (!selectedPageId) return;
    const cfg = defaultSectionConfig(type);
    const r = await fetch(`/api/admin/curated/pages/${selectedPageId}/sections`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section_type: type, config: cfg }),
    });
    if (r.ok) {
      const row = await r.json();
      setSections((prev) => [...prev, row]);
      setExpandedId(row.id);
      notifyUser(t("maison.admin_section_added") || "Section hinzugefügt.", "success");
      onCuratedContentChanged?.();
    } else notifyUser(t("errors.generic") || "Fehler", "error");
  };

  const createPage = async () => {
    const slug = newSlug.trim().toLowerCase();
    if (!slug) return;
    setLoading(true);
    try {
      const r = await fetch("/api/admin/curated/pages", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, title: newTitle || slug, nav_label: newTitle || slug, published: 1, nav_order: 100 }),
      });
      if (r.ok) {
        await loadPages();
        const j = await r.json();
        setSelectedPageId(j.id);
        setNewSlug("");
        setNewTitle("");
        notifyUser(t("maison.admin_page_created") || "Seite angelegt.", "success");
        onCuratedContentChanged?.();
      } else {
        const e = await r.json().catch(() => ({}));
        notifyUser(e.error || t("errors.generic"), "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const savePageMeta = async (p: CuratedPageRow) => {
    const r = await fetch(`/api/admin/curated/pages/${p.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: p.slug,
        title: p.title,
        nav_label: p.nav_label,
        published: Number(p.published) >= 1,
        nav_order: p.nav_order,
      }),
    });
    if (r.ok) {
      await loadPages();
      notifyUser(t("maison.admin_page_saved") || "Seite gespeichert.", "success");
      onCuratedContentChanged?.();
    } else notifyUser(t("errors.generic") || "Fehler", "error");
  };

  const publishAllDrafts = async () => {
    if (!confirm(t("maison.admin_publish_all_confirm"))) return;
    setLoading(true);
    try {
      const r = await fetch("/api/admin/curated/pages/publish-drafts", {
        method: "POST",
        credentials: "include",
      });
      if (r.ok) {
        const j = (await r.json()) as { updated?: number };
        await loadPages();
        const n = Number(j.updated ?? 0);
        notifyUser(t("maison.admin_publish_all_done").replace("{{n}}", String(n)), "success");
        onCuratedContentChanged?.();
      } else notifyUser(t("errors.generic") || "Fehler", "error");
    } finally {
      setLoading(false);
    }
  };

  const deletePage = async (id: number) => {
    if (!confirm(t("maison.admin_confirm_delete_page") || "Seite löschen?")) return;
    const r = await fetch(`/api/admin/curated/pages/${id}`, { method: "DELETE", credentials: "include" });
    if (r.ok) {
      if (selectedPageId === id) setSelectedPageId(null);
      await loadPages();
      notifyUser(t("maison.admin_deleted") || "Gelöscht.", "success");
      onCuratedContentChanged?.();
    }
  };

  const renderConfigFields = (s: SectionRow) => {
    const c = { ...s.config };
    const setC = (patch: Record<string, unknown>) => updateSectionLocal(s.id, { config: { ...c, ...patch } });

    switch (s.section_type) {
      case "hero":
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-zinc-500">imageUrl
              <input className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" value={String(c.imageUrl ?? "")} onChange={(e) => setC({ imageUrl: e.target.value })} />
            </label>
            <label className="block text-xs text-zinc-500">ctaView (z.B. concierge, kontakt, maison)
              <input className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" value={String(c.ctaView ?? "")} onChange={(e) => setC({ ctaView: e.target.value })} />
            </label>
            <label className="block text-xs text-zinc-500 sm:col-span-2">title
              <input className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" value={String(c.title ?? "")} onChange={(e) => setC({ title: e.target.value })} />
            </label>
            <label className="block text-xs text-zinc-500 sm:col-span-2">subtitle
              <textarea className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" rows={2} value={String(c.subtitle ?? "")} onChange={(e) => setC({ subtitle: e.target.value })} />
            </label>
            <label className="block text-xs text-zinc-500">ctaLabel
              <input className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" value={String(c.ctaLabel ?? "")} onChange={(e) => setC({ ctaLabel: e.target.value })} />
            </label>
          </div>
        );
      case "category_block":
        return (
          <div className="grid gap-3">
            <label className="text-xs text-zinc-500">heading
              <input className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" value={String(c.heading ?? "")} onChange={(e) => setC({ heading: e.target.value })} />
            </label>
            <label className="text-xs text-zinc-500">subheading
              <textarea className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" rows={2} value={String(c.subheading ?? "")} onChange={(e) => setC({ subheading: e.target.value })} />
            </label>
            <label className="text-xs text-zinc-500">ctaLabel / ctaView
              <div className="mt-1 flex gap-2">
                <input className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" placeholder="Label" value={String(c.ctaLabel ?? "")} onChange={(e) => setC({ ctaLabel: e.target.value })} />
                <input className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" placeholder="View" value={String(c.ctaView ?? "")} onChange={(e) => setC({ ctaView: e.target.value })} />
              </div>
            </label>
          </div>
        );
      case "product_row":
        return (
          <div className="grid gap-3">
            <label className="text-xs text-zinc-500">title
              <input className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" value={String(c.title ?? "")} onChange={(e) => setC({ title: e.target.value })} />
            </label>
            <label className="text-xs text-zinc-500">subtitle
              <input className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" value={String(c.subtitle ?? "")} onChange={(e) => setC({ subtitle: e.target.value })} />
            </label>
            <label className="text-xs text-zinc-500">product IDs (max 6, kommagetrennt)
              <input
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm"
                value={idListToString(c.productIds)}
                onChange={(e) => setC({ productIds: parseIdList(e.target.value, 6) })}
              />
            </label>
            <PiecePicker selected={clampProductIds(c.productIds, 6)} max={6} masterpieces={masterpieces} onChange={(ids) => setC({ productIds: ids })} />
          </div>
        );
      case "featured_piece":
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-zinc-500">productId
              <input type="number" className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" value={c.productId != null ? String(c.productId) : ""} onChange={(e) => setC({ productId: e.target.value ? Number(e.target.value) : null })} />
            </label>
            <label className="text-xs text-zinc-500">headline
              <input className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" value={String(c.headline ?? "")} onChange={(e) => setC({ headline: e.target.value })} />
            </label>
            <label className="text-xs text-zinc-500 sm:col-span-2">subline
              <input className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" value={String(c.subline ?? "")} onChange={(e) => setC({ subline: e.target.value })} />
            </label>
            <PiecePicker selected={c.productId ? [Number(c.productId)] : []} max={1} masterpieces={masterpieces} onChange={(ids) => setC({ productId: ids[0] ?? null })} />
          </div>
        );
      case "split":
        return (
          <div className="grid gap-3">
            <label className="text-xs text-zinc-500">imageUrl
              <input className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" value={String(c.imageUrl ?? "")} onChange={(e) => setC({ imageUrl: e.target.value })} />
            </label>
            <label className="text-xs text-zinc-500">imageSide
              <select className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" value={String(c.imageSide ?? "left")} onChange={(e) => setC({ imageSide: e.target.value })}>
                <option value="left">left</option>
                <option value="right">right</option>
              </select>
            </label>
            <label className="text-xs text-zinc-500">title
              <input className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" value={String(c.title ?? "")} onChange={(e) => setC({ title: e.target.value })} />
            </label>
            <label className="text-xs text-zinc-500">body
              <textarea className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" rows={4} value={String(c.body ?? "")} onChange={(e) => setC({ body: e.target.value })} />
            </label>
            <label className="text-xs text-zinc-500">product IDs (max 6)
              <input
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm"
                value={idListToString(c.productIds)}
                onChange={(e) => setC({ productIds: parseIdList(e.target.value, 6) })}
              />
            </label>
            <PiecePicker selected={clampProductIds(c.productIds, 6)} max={6} masterpieces={masterpieces} onChange={(ids) => setC({ productIds: ids })} />
          </div>
        );
      case "editorial":
        return (
          <div className="grid gap-3">
            <label className="text-xs text-zinc-500">headline
              <input className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" value={String(c.headline ?? "")} onChange={(e) => setC({ headline: e.target.value })} />
            </label>
            <label className="text-xs text-zinc-500">align
              <select className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" value={String(c.align ?? "center")} onChange={(e) => setC({ align: e.target.value })}>
                <option value="center">center</option>
                <option value="left">left</option>
              </select>
            </label>
            <label className="text-xs text-zinc-500">body
              <textarea className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" rows={6} value={String(c.body ?? "")} onChange={(e) => setC({ body: e.target.value })} />
            </label>
          </div>
        );
      default:
        return <p className="text-xs text-zinc-500">Unknown type</p>;
    }
  };

  const selectedPage = pages.find((p) => p.id === selectedPageId);

  return (
    <div className="space-y-8 text-zinc-200">
      <div>
        <h3 className="font-serif text-xl italic text-amber-500/90">{t("maison.admin_title")}</h3>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500">{t("maison.admin_intro")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">{t("maison.admin_pages")}</h4>
          {pages.some((p) => !p.published) ? (
            <div className="mt-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => void publishAllDrafts()}
                className="w-full rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-left text-xs text-amber-200/95 hover:bg-amber-500/20 disabled:opacity-50"
              >
                {t("maison.admin_publish_all_drafts")}
              </button>
            </div>
          ) : null}
          <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto">
            {pages.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setSelectedPageId(p.id)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition ${
                    selectedPageId === p.id ? "border-amber-500/50 bg-amber-500/10" : "border-zinc-800 hover:border-zinc-600"
                  }`}
                >
                  <span>
                    <span className="font-medium text-zinc-200">{p.nav_label || p.title}</span>
                    <span className="ml-2 text-xs text-zinc-500">/{p.slug}</span>
                  </span>
                  <span className="text-[10px] uppercase text-zinc-500">{p.published ? "live" : "draft"}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-2 border-t border-zinc-800 pt-4">
            <p className="text-xs uppercase text-zinc-500">{t("maison.admin_new_page")}</p>
            <input className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm" placeholder="slug (z.B. summer-25)" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} />
            <input className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm" placeholder="Titel" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            <button type="button" disabled={loading} onClick={() => void createPage()} className="rounded-lg bg-amber-600/80 px-4 py-2 text-sm text-black disabled:opacity-50">
              {t("maison.admin_create_page")}
            </button>
          </div>
        </div>

        {selectedPage && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">{t("maison.admin_page_meta")}</h4>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-zinc-500">slug
                <input className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm" value={selectedPage.slug} onChange={(e) => setPages((prev) => prev.map((x) => (x.id === selectedPage.id ? { ...x, slug: e.target.value } : x)))} />
              </label>
              <label className="text-xs text-zinc-500">nav_order
                <input type="number" className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm" value={selectedPage.nav_order} onChange={(e) => setPages((prev) => prev.map((x) => (x.id === selectedPage.id ? { ...x, nav_order: Number(e.target.value) } : x)))} />
              </label>
              <label className="text-xs text-zinc-500 sm:col-span-2">title
                <input className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm" value={selectedPage.title} onChange={(e) => setPages((prev) => prev.map((x) => (x.id === selectedPage.id ? { ...x, title: e.target.value } : x)))} />
              </label>
              <label className="text-xs text-zinc-500 sm:col-span-2">nav_label
                <input className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm" value={selectedPage.nav_label} onChange={(e) => setPages((prev) => prev.map((x) => (x.id === selectedPage.id ? { ...x, nav_label: e.target.value } : x)))} />
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-400 sm:col-span-2">
                <input type="checkbox" checked={!!selectedPage.published} onChange={(e) => setPages((prev) => prev.map((x) => (x.id === selectedPage.id ? { ...x, published: e.target.checked ? 1 : 0 } : x)))} />
                {t("maison.admin_published")}
              </label>
              {!selectedPage.published ? (
                <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200/90 sm:col-span-2">{t("maison.admin_draft_warning")}</p>
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => void savePageMeta(pages.find((x) => x.id === selectedPage.id)!)} className="rounded-lg border border-amber-500/40 px-4 py-2 text-sm text-amber-500">
                {t("maison.admin_save_page")}
              </button>
              <button type="button" onClick={() => void deletePage(selectedPage.id)} className="rounded-lg border border-red-900/50 px-4 py-2 text-sm text-red-400">
                {t("maison.admin_delete_page")}
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedPageId && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">{t("maison.admin_sections")}</h4>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-zinc-500">{t("maison.admin_add_section")}</span>
              <select className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm" defaultValue="" onChange={(e) => { const v = e.target.value as CuratedSectionType; if (v) { void addSection(v); e.target.value = ""; } }}>
                <option value="" disabled>Typ wählen…</option>
                {CURATED_SECTION_TYPES.map((ty) => (
                  <option key={ty} value={ty}>{ty}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="mt-2 text-xs text-zinc-600">{t("maison.admin_drag_hint")}</p>

          <ul className="mt-6 space-y-3">
            {sections.map((s) => (
              <li
                key={s.id}
                draggable
                onDragStart={() => onDragStart(s.id)}
                onDragOver={onDragOver}
                onDrop={() => onDrop(s.id)}
                className={`rounded-xl border border-zinc-800 bg-zinc-950/80 ${dragId === s.id ? "opacity-60" : ""}`}
              >
                <div className="flex items-center gap-2 px-3 py-2">
                  <GripVertical className="h-5 w-5 shrink-0 cursor-grab text-zinc-600" />
                  <button type="button" className="flex flex-1 items-center justify-between text-left text-sm" onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}>
                    <span className="font-mono text-xs text-amber-500/90">{s.section_type}</span>
                    <span className="text-zinc-500">#{s.id}</span>
                    {expandedId === s.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  <button type="button" className="p-2 text-zinc-500 hover:text-red-400" aria-label="delete" onClick={() => void deleteSection(s.id)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {expandedId === s.id && (
                  <div className="border-t border-zinc-800 p-4">
                    <label className="mb-2 block text-xs text-zinc-500">section_type
                      <select className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" value={s.section_type} onChange={(e) => updateSectionLocal(s.id, { section_type: e.target.value })}>
                        {CURATED_SECTION_TYPES.map((ty) => (
                          <option key={ty} value={ty}>{ty}</option>
                        ))}
                      </select>
                    </label>
                    {renderConfigFields(s)}
                    <button type="button" disabled={loading} onClick={() => void saveSection(s)} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-600/80 px-4 py-2 text-sm text-black disabled:opacity-50">
                      <Save className="h-4 w-4" /> {t("maison.admin_save_section")}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          {sections.length === 0 && <p className="mt-6 text-sm text-zinc-600">{t("maison.admin_no_sections")}</p>}
        </div>
      )}
    </div>
  );
}

function PiecePicker({
  masterpieces,
  selected,
  max,
  onChange,
}: {
  masterpieces: Masterpiece[];
  selected: number[];
  max: number;
  onChange: (ids: number[]) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = masterpieces.filter((p) => {
    if (!q.trim()) return true;
    const n = q.toLowerCase();
    return String(p.title).toLowerCase().includes(n) || String(p.serial_id || "").toLowerCase().includes(n) || String(p.id).includes(n);
  }).slice(0, 40);

  const toggle = (id: number) => {
    if (max === 1) {
      onChange(selected.includes(id) ? [] : [id]);
      return;
    }
    if (selected.includes(id)) onChange(selected.filter((x) => x !== id));
    else if (selected.length < max) onChange([...selected, id]);
  };

  return (
    <div className="rounded-lg border border-zinc-800 p-3">
      <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1"><Plus className="h-3 w-3" /> {max === 1 ? "Stück wählen" : `Stücke wählen (max ${max})`}</p>
      <input className="mb-2 w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs" placeholder="Suche…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="max-h-40 overflow-y-auto space-y-1">
        {filtered.map((p) => (
          <button key={p.id} type="button" onClick={() => toggle(p.id)} className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs ${selected.includes(p.id) ? "bg-amber-500/20 text-amber-200" : "hover:bg-zinc-800"}`}>
            <span className="truncate">{p.title}</span>
            <span className="shrink-0 text-zinc-500">#{p.id}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
