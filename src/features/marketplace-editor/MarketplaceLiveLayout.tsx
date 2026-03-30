import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Image as ImageIcon,
  LayoutGrid,
  Maximize2,
  Minus,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import type { Masterpiece } from "../../types";
import type { BlockSize, CtaAction, MarketplaceBlock, MarketplaceLayoutDoc, MarketplaceSection } from "./types";
import { cloneBlock, colClass, newId, sortBlocks, sortSections } from "./layoutHelpers";

const DND_MIME = "application/x-ab-marketplace";

type DragPayload =
  | { kind: "section"; index: number }
  | { kind: "block"; sectionId: string; blockIndex: number };

export type MarketplaceLiveLayoutProps = {
  layout: MarketplaceLayoutDoc;
  onChange: (next: MarketplaceLayoutDoc) => void;
  editMode: boolean;
  previewMode: "desktop" | "mobile";
  masterpieces: Masterpiece[];
  piecePassesFilter: (pieceId: number) => boolean;
  renderProductCard: (piece: Masterpiece, filteredOut: boolean) => React.ReactNode;
  onNavigateView: (view: string) => void;
  onOpenPiece: (piece: Masterpiece) => void;
  onCtaAction?: (payload: { action: CtaAction; view?: string; url?: string; pieceId?: number }) => void;
  t: (k: string) => string;
  onUploadImage?: (dataUrl: string) => Promise<string | null>;
};

const VIEW_KEYS = [
  "marketplace",
  "maison",
  "concierge",
  "vault",
  "kontakt",
  "drops",
  "auctions",
  "world",
  "resale",
] as const;

function defaultBlock(type: MarketplaceBlock["type"], order: number): MarketplaceBlock {
  const id = newId("blk");
  switch (type) {
    case "product":
      return { id, type, size: "md", sortOrder: order };
    case "image":
      return { id, type, size: "lg", sortOrder: order, linkType: "none", imageUrl: "", imageAlt: "" };
    case "text":
      return { id, type, size: "full", sortOrder: order, headline: "", body: "" };
    case "category":
      return { id, type, size: "full", sortOrder: order, categoryLabel: "Kategorie", categorySubline: "" };
    case "spacer":
      return { id, type, size: "full", sortOrder: order, spacerPx: 48 };
    case "cta":
      return {
        id,
        type,
        size: "md",
        sortOrder: order,
        ctaLabel: "Persönliche Beratung",
        ctaSubline: "",
        ctaAction: "consultation",
      };
    default:
      return { id, type: "text", size: "full", sortOrder: order, headline: "", body: "" };
  }
}

export function MarketplaceLiveLayout({
  layout,
  onChange,
  editMode,
  previewMode,
  masterpieces,
  piecePassesFilter,
  renderProductCard,
  onNavigateView,
  onOpenPiece,
  onCtaAction,
  t,
  onUploadImage,
}: MarketplaceLiveLayoutProps) {
  const [menu, setMenu] = useState<{ sectionId: string; blockId: string } | null>(null);
  const [editTarget, setEditTarget] = useState<{ sectionId: string; block: MarketplaceBlock } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenu(null);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const pieceById = useMemo(() => {
    const m = new Map<number, Masterpiece>();
    for (const p of masterpieces) m.set(p.id, p);
    return m;
  }, [masterpieces]);

  const sectionsToRender = useMemo(() => {
    const sorted = sortSections(layout);
    if (editMode) return sorted;
    return sorted.filter((s) => !s.hidden);
  }, [layout, editMode]);

  const invokeCta = useCallback(
    (block: MarketplaceBlock) => {
      if (block.type !== "cta") return;
      if (editMode) return;
      const act = block.ctaAction ?? "consultation";
      if (onCtaAction) {
        onCtaAction({ action: act, view: block.ctaView, url: block.ctaUrl, pieceId: block.ctaPieceId });
        return;
      }
      if (act === "consultation") onNavigateView("concierge");
      else if (act === "contact") onNavigateView("kontakt");
      else if (act === "view" && block.ctaView) onNavigateView(block.ctaView);
      else if (act === "external" && block.ctaUrl) window.open(block.ctaUrl, "_blank", "noopener,noreferrer");
      else if (act === "piece" && block.ctaPieceId) {
        const p = pieceById.get(block.ctaPieceId);
        if (p) onOpenPiece(p);
      }
    },
    [editMode, onCtaAction, onNavigateView, onOpenPiece, pieceById],
  );

  const updateSection = useCallback(
    (sectionId: string, fn: (s: MarketplaceSection) => MarketplaceSection) => {
      onChange({
        ...layout,
        sections: layout.sections.map((s) => (s.id === sectionId ? fn(s) : s)),
      });
    },
    [layout, onChange],
  );

  const moveBlock = useCallback(
    (fromSid: string, fromI: number, toSid: string, toI: number) => {
      const secs = layout.sections.map((s) => ({ ...s, blocks: [...s.blocks] }));
      const fromSec = secs.find((s) => s.id === fromSid);
      const toSec = secs.find((s) => s.id === toSid);
      if (!fromSec || !toSec) return;
      const [removed] = fromSec.blocks.splice(fromI, 1);
      if (!removed) return;
      let insertAt = toI;
      if (fromSid === toSid && fromI < toI) insertAt -= 1;
      insertAt = Math.max(0, Math.min(insertAt, toSec.blocks.length));
      toSec.blocks.splice(insertAt, 0, removed);
      const reindex = (blocks: MarketplaceBlock[]) =>
        blocks.map((b, i) => ({ ...b, sortOrder: i }));
      onChange({
        ...layout,
        sections: secs.map((s) => ({ ...s, blocks: reindex(sortBlocks(s.blocks)) })),
      });
    },
    [layout, onChange],
  );

  const moveSection = useCallback(
    (from: number, to: number) => {
      const sorted = sortSections(layout);
      if (from === to || from < 0 || to < 0 || from >= sorted.length || to >= sorted.length) return;
      const next = [...sorted];
      const [x] = next.splice(from, 1);
      next.splice(to, 0, x);
      onChange({
        ...layout,
        sections: next.map((s, i) => ({ ...s, sortOrder: i })),
      });
    },
    [layout, onChange],
  );

  const onDragStartBlock = (e: React.DragEvent, sectionId: string, blockIndex: number) => {
    if (!editMode) return;
    e.dataTransfer.setData(DND_MIME, JSON.stringify({ kind: "block", sectionId, blockIndex } satisfies DragPayload));
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragStartSection = (e: React.DragEvent, index: number) => {
    if (!editMode) return;
    e.dataTransfer.setData(DND_MIME, JSON.stringify({ kind: "section", index } satisfies DragPayload));
    e.dataTransfer.effectAllowed = "move";
  };

  const parsePayload = (e: React.DragEvent): DragPayload | null => {
    try {
      return JSON.parse(e.dataTransfer.getData(DND_MIME)) as DragPayload;
    } catch {
      return null;
    }
  };

  const handleBlockDrop = (e: React.DragEvent, sectionId: string, dropIndex: number) => {
    e.preventDefault();
    const p = parsePayload(e);
    if (!p || p.kind !== "block") return;
    moveBlock(p.sectionId, p.blockIndex, sectionId, dropIndex);
  };

  const handleSectionDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const p = parsePayload(e);
    if (!p || p.kind !== "section") return;
    moveSection(p.index, dropIndex);
  };

  const deleteBlock = (sectionId: string, blockId: string) => {
    updateSection(sectionId, (s) => ({
      ...s,
      blocks: s.blocks.filter((b) => b.id !== blockId).map((b, i) => ({ ...b, sortOrder: i })),
    }));
    setMenu(null);
  };

  const dupBlock = (sectionId: string, block: MarketplaceBlock) => {
    const c = cloneBlock(block);
    updateSection(sectionId, (s) => {
      const blocks = sortBlocks(s.blocks);
      const maxO = blocks.reduce((m, b) => Math.max(m, b.sortOrder), -1);
      return { ...s, blocks: [...s.blocks, { ...c, sortOrder: maxO + 1 }] };
    });
    setMenu(null);
  };

  const setSize = (sectionId: string, blockId: string, size: BlockSize) => {
    updateSection(sectionId, (s) => ({
      ...s,
      blocks: s.blocks.map((b) => (b.id === blockId ? { ...b, size } : b)),
    }));
    setMenu(null);
  };

  const addBlock = (sectionId: string, type: MarketplaceBlock["type"]) => {
    updateSection(sectionId, (s) => {
      const maxO = s.blocks.reduce((m, b) => Math.max(m, b.sortOrder), -1);
      return { ...s, blocks: [...s.blocks, defaultBlock(type, maxO + 1)] };
    });
  };

  const addSection = (type: MarketplaceSection["type"]) => {
    const maxO = layout.sections.reduce((m, s) => Math.max(m, s.sortOrder), -1);
    const sec: MarketplaceSection = {
      id: newId("sec"),
      type,
      sortOrder: maxO + 1,
      title: "",
      blocks: [],
    };
    onChange({ ...layout, sections: [...layout.sections, sec] });
  };

  const removeSection = (sectionId: string) => {
    onChange({ ...layout, sections: layout.sections.filter((s) => s.id !== sectionId) });
  };

  const saveEditModal = () => {
    if (!editTarget) return;
    const { sectionId, block } = editTarget;
    updateSection(sectionId, (s) => ({
      ...s,
      blocks: s.blocks.map((b) => (b.id === block.id ? { ...block } : b)),
    }));
    setEditTarget(null);
  };

  const renderBlockInner = (section: MarketplaceSection, block: MarketplaceBlock) => {
    const wrapClick = (fn: () => void) => (e: React.MouseEvent) => {
      if (editMode) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      fn();
    };

    switch (block.type) {
      case "product": {
        const pid = block.productId;
        if (!pid) {
          return (
            <div className="rounded-2xl border border-dashed border-[var(--border-soft)] bg-[#121212]/80 p-12 text-center text-[#888888] text-sm">
              {t("marketplace.editor.no_product")}
            </div>
          );
        }
        const piece = pieceById.get(pid);
        if (!piece) {
          return (
            <div className="rounded-2xl border border-dashed border-red-900/40 bg-red-950/20 p-8 text-center text-sm text-red-300/90">
              {t("marketplace.editor.product_missing")}
            </div>
          );
        }
        const filtered = !piecePassesFilter(pid);
        const card = <>{renderProductCard(piece, filtered)}</>;
        const isFeatured = Number(piece.featured_masterpiece) === 1;
        if (isFeatured) {
          const desc = (piece.description || "").trim();
          return (
            <div className="rounded-[2rem] border border-[#D4AF37]/25 bg-gradient-to-b from-[rgba(212,175,55,0.07)] to-transparent p-6 md:p-10 space-y-6">
              <p className="text-[10px] uppercase tracking-[0.4em] text-[#D4AF37] text-center md:text-left">{t("marketplace.editor.featured_badge")}</p>
              {desc ? (
                <p className="text-sm md:text-base text-[#A0A0A0] leading-relaxed max-w-2xl mx-auto md:mx-0 font-[family-name:var(--font-serif)] italic line-clamp-5">
                  {desc}
                </p>
              ) : null}
              {card}
            </div>
          );
        }
        return card;
      }
      case "image": {
        const url = block.imageUrl || "";
        const clickable =
          !editMode &&
          ((block.linkType === "piece" && block.linkPieceId && pieceById.get(block.linkPieceId)) ||
            (block.linkType === "view" && block.linkView) ||
            (block.linkType === "external" && block.linkUrl));
        const go = () => {
          if (block.linkType === "piece" && block.linkPieceId) {
            const p = pieceById.get(block.linkPieceId);
            if (p) onOpenPiece(p);
          } else if (block.linkType === "view" && block.linkView) onNavigateView(block.linkView);
          else if (block.linkType === "external" && block.linkUrl) window.open(block.linkUrl, "_blank", "noopener,noreferrer");
        };
        return (
          <div
            className={`relative overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[#121212] ${clickable ? "cursor-pointer" : ""}`}
            onClick={clickable ? wrapClick(go) : undefined}
            role={clickable ? "button" : undefined}
          >
            {url ? (
              <img src={url} alt={block.imageAlt || ""} className="w-full h-full min-h-[200px] max-h-[70vh] object-cover" />
            ) : (
              <div className="min-h-[200px] flex items-center justify-center text-[#666666] text-sm">{t("marketplace.editor.image_placeholder")}</div>
            )}
          </div>
        );
      }
      case "text": {
        const story = section.experienceKind === "story";
        return (
          <div
            className={
              story
                ? "px-4 md:px-8 py-6 text-center md:text-left"
                : "rounded-2xl border border-[var(--border-soft)] bg-[#121212]/60 px-8 py-10 backdrop-blur-sm"
            }
          >
            {block.headline && (
              <h4
                className={
                  story
                    ? "font-[family-name:var(--font-serif)] text-3xl md:text-5xl italic text-[#FFFFFF] tracking-wide mb-8 leading-tight"
                    : "font-[family-name:var(--font-serif)] text-2xl md:text-3xl text-[#FFFFFF] tracking-wide mb-4"
                }
              >
                {block.headline}
              </h4>
            )}
            {block.body && (
              <p className={story ? "text-[#B8B8B8] leading-[1.85] whitespace-pre-wrap text-lg md:text-xl font-light max-w-prose mx-auto md:mx-0" : "text-[#A0A0A0] leading-relaxed whitespace-pre-wrap"}>
                {block.body}
              </p>
            )}
          </div>
        );
      }
      case "category": {
        const catLux = section.experienceKind === "category";
        return (
          <div
            className={
              catLux
                ? "text-center py-16 md:py-24 px-6 md:px-12 rounded-[2rem] border border-[rgba(212,175,55,0.15)] bg-[#121212]/50 min-h-[220px] flex flex-col justify-center"
                : "text-center py-8 px-4"
            }
          >
            <p className={`text-[10px] uppercase tracking-[0.35em] mb-3 ${catLux ? "text-[#D4AF37]/95" : "text-[#C6A36A]/90"}`}>{t("marketplace.editor.category_eyebrow")}</p>
            {block.categoryLabel && (
              <h4 className={`font-[family-name:var(--font-serif)] italic text-[#F5F5F5] ${catLux ? "text-4xl md:text-6xl" : "text-3xl md:text-4xl"}`}>{block.categoryLabel}</h4>
            )}
            {block.categorySubline && <p className={`mt-6 text-[#A0A0A0] max-w-xl mx-auto leading-relaxed ${catLux ? "text-base md:text-lg" : ""}`}>{block.categorySubline}</p>}
            {block.linkView && !editMode && (
              <button
                type="button"
                onClick={() => onNavigateView(block.linkView!)}
                className={`mt-10 text-sm uppercase tracking-[0.25em] transition-colors ${catLux ? "text-[#D4AF37] hover:text-[#e4c04a]" : "text-[#C6A36A] hover:text-[#d4b87a]"}`}
              >
                {t("common.learn_more")}
              </button>
            )}
          </div>
        );
      }
      case "spacer":
        return <div style={{ height: block.spacerPx ?? 32 }} className={editMode ? "bg-[rgba(198,163,106,0.06)] rounded-lg border border-dashed border-[rgba(198,163,106,0.15)]" : ""} aria-hidden />;
      case "cta": {
        const act = block.ctaAction ?? "consultation";
        const btnKey =
          act === "consultation"
            ? "marketplace.editor.cta_btn_consultation"
            : act === "contact"
              ? "marketplace.editor.cta_btn_contact"
              : act === "view"
                ? "marketplace.editor.cta_btn_view"
                : act === "external"
                  ? "marketplace.editor.cta_btn_external"
                  : "marketplace.editor.cta_btn_piece";
        return (
          <div className="flex flex-col items-center justify-center text-center py-14 px-6 md:px-16 rounded-[2rem] border border-[rgba(212,175,55,0.22)] bg-[#121212]/35">
            {block.ctaSubline ? <p className="text-[10px] uppercase tracking-[0.35em] text-[#D4AF37]/90 mb-5 max-w-lg">{block.ctaSubline}</p> : null}
            {block.ctaLabel ? <h4 className="font-[family-name:var(--font-serif)] text-2xl md:text-4xl text-white mb-10 leading-tight max-w-xl">{block.ctaLabel}</h4> : null}
            <button
              type="button"
              onClick={wrapClick(() => invokeCta(block))}
              className="inline-flex items-center justify-center px-12 py-4 rounded-full border border-[#D4AF37] text-[#D4AF37] text-[11px] uppercase tracking-[0.28em] hover:bg-[rgba(212,175,55,0.1)] transition-colors"
            >
              {t(btnKey)}
            </button>
          </div>
        );
      }
      default:
        return null;
    }
  };

  const blockGrid = (section: MarketplaceSection, blocks: MarketplaceBlock[]) => {
    if (section.type === "stack") {
      return (
        <div className="flex flex-col gap-8">
          {blocks.map((block, bi) => (
            <React.Fragment key={block.id}>{renderBlockShell(section, block, bi)}</React.Fragment>
          ))}
        </div>
      );
    }
    if (section.type === "split") {
      const left = blocks.filter((b) => b.column !== "right");
      const right = blocks.filter((b) => b.column === "right");
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-start">
          <div className="flex flex-col gap-8">
            {left.map((block) => (
              <React.Fragment key={block.id}>{renderBlockShell(section, block, section.blocks.indexOf(block))}</React.Fragment>
            ))}
          </div>
          <div className="flex flex-col gap-8">
            {right.map((block) => (
              <React.Fragment key={block.id}>{renderBlockShell(section, block, section.blocks.indexOf(block))}</React.Fragment>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div
        className={`grid grid-cols-12 gap-6 md:gap-8 ${section.experienceKind === "product_grid" ? "md:gap-x-12 md:gap-y-20 md:[&>*:nth-child(odd)]:translate-x-1" : ""}`}
      >
        {blocks.map((block, bi) => (
          <div key={block.id} className={colClass(block.size)}>
            {renderBlockShell(section, block, bi)}
          </div>
        ))}
      </div>
    );
  };

  const renderBlockShell = (section: MarketplaceSection, block: MarketplaceBlock, bi: number) => {
    const showMenu = menu?.sectionId === section.id && menu?.blockId === block.id;
    const inner = renderBlockInner(section, block);
    if (!editMode) return <>{inner}</>;

    return (
      <div
        className="relative group/block rounded-2xl ring-1 ring-transparent hover:ring-[rgba(198,163,106,0.25)] transition-all duration-300"
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        }}
        onDrop={(e) => handleBlockDrop(e, section.id, bi)}
      >
        {editMode && (
          <div className="absolute -top-1 -left-1 z-20 flex gap-1 opacity-0 group-hover/block:opacity-100 transition-opacity">
            <button
              type="button"
              draggable
              onDragStart={(e) => onDragStartBlock(e, section.id, bi)}
              className="p-1.5 rounded-lg bg-[#1a1a1a] border border-[var(--border-soft)] text-[#888888] cursor-grab active:cursor-grabbing"
              title={t("marketplace.editor.move")}
              aria-label={t("marketplace.editor.move")}
            >
              <GripVertical className="w-4 h-4" />
            </button>
          </div>
        )}
        {editMode && (
          <div className="absolute top-2 right-2 z-30" ref={showMenu ? menuRef : undefined}>
            <button
              type="button"
              className="p-2 rounded-lg bg-black/70 border border-[var(--border-soft)] text-[#E8E8E8] hover:bg-black/90"
              onClick={() => setMenu(showMenu ? null : { sectionId: section.id, blockId: block.id })}
              aria-label={t("marketplace.editor.more")}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1 w-52 rounded-xl border border-[var(--border-soft)] bg-[#121212] shadow-2xl py-1 text-sm z-50">
                <button type="button" className="w-full text-left px-3 py-2 hover:bg-white/5 text-[#E8E8E8]" onClick={() => { setEditTarget({ sectionId: section.id, block: { ...block } }); setMenu(null); }}>
                  <Pencil className="w-3.5 h-3.5 inline mr-2 opacity-70" /> {t("marketplace.editor.edit")}
                </button>
                <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-[#666666]">{t("marketplace.editor.size")}</div>
                {(["sm", "md", "lg", "full"] as BlockSize[]).map((sz) => (
                  <button key={sz} type="button" className="w-full text-left px-3 py-1.5 hover:bg-white/5 text-[#AAAAAA] pl-6" onClick={() => setSize(section.id, block.id, sz)}>
                    {t(`marketplace.editor.size_${sz}`)}
                  </button>
                ))}
                <button type="button" className="w-full text-left px-3 py-2 hover:bg-white/5 text-[#E8E8E8]" onClick={() => dupBlock(section.id, block)}>
                  <Copy className="w-3.5 h-3.5 inline mr-2 opacity-70" /> {t("marketplace.editor.duplicate")}
                </button>
                <button type="button" className="w-full text-left px-3 py-2 hover:bg-red-950/40 text-red-300" onClick={() => deleteBlock(section.id, block.id)}>
                  <Trash2 className="w-3.5 h-3.5 inline mr-2 opacity-70" /> {t("marketplace.editor.delete")}
                </button>
              </div>
            )}
          </div>
        )}
        {inner}
      </div>
    );
  };

  const shellClass = previewMode === "mobile" ? "max-w-[420px] mx-auto border-x border-[var(--border-soft)] px-3 min-h-[200px]" : "";

  return (
    <div className={`space-y-16 md:space-y-24 ${shellClass}`}>
      {sectionsToRender.map((section, si) => (
        <section
          key={section.id}
          className={`relative rounded-3xl border border-transparent ${sectionShellClass(section, editMode)}`}
          onDragOver={(e) => {
            if (!editMode) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
          }}
          onDrop={(e) => handleSectionDrop(e, si)}
        >
          {editMode && (
            <div className="space-y-4 mb-6 pb-4 border-b border-[var(--border-soft)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    draggable
                    onDragStart={(e) => onDragStartSection(e, si)}
                    className="p-2 rounded-lg bg-[#1a1a1a] border border-[var(--border-soft)] text-[#888888] cursor-grab"
                    title={t("marketplace.editor.move_section")}
                    aria-label={t("marketplace.editor.move_section")}
                  >
                    <GripVertical className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#666666]">{section.type}</span>
                  <button
                    type="button"
                    className="p-2 rounded-lg border border-[var(--border-soft)] text-[#AAAAAA] hover:text-[#D4AF37]"
                    title={section.hidden ? t("marketplace.editor.section_show") : t("marketplace.editor.section_hide")}
                    onClick={() =>
                      onChange({
                        ...layout,
                        sections: layout.sections.map((s) => (s.id === section.id ? { ...s, hidden: !s.hidden } : s)),
                      })
                    }
                  >
                    {section.hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  {section.hidden ? (
                    <span className="text-[10px] uppercase tracking-wider text-[#D4AF37]/80">{t("marketplace.editor.section_hidden_badge")}</span>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    className="bg-[#121212] border border-[var(--border-soft)] rounded-lg text-xs text-[#CCCCCC] py-1.5 px-2 max-w-[140px]"
                    value={section.type}
                    onChange={(e) => {
                      const nt = e.target.value as MarketplaceSection["type"];
                      onChange({
                        ...layout,
                        sections: layout.sections.map((s) => (s.id === section.id ? { ...s, type: nt } : s)),
                      });
                    }}
                  >
                    <option value="grid">Grid</option>
                    <option value="stack">Stack</option>
                    <option value="split">Split</option>
                  </select>
                  <select
                    className="bg-[#121212] border border-[var(--border-soft)] rounded-lg text-xs text-[#CCCCCC] py-1.5 px-2 max-w-[160px]"
                    value={section.experienceKind ?? "custom"}
                    onChange={(e) => {
                      const v = e.target.value;
                      const experienceKind = v === "custom" ? undefined : (v as MarketplaceSection["experienceKind"]);
                      onChange({
                        ...layout,
                        sections: layout.sections.map((s) => (s.id === section.id ? { ...s, experienceKind } : s)),
                      });
                    }}
                  >
                    <option value="custom">{t("marketplace.editor.kind_custom")}</option>
                    <option value="hero">{t("marketplace.editor.kind_hero")}</option>
                    <option value="category">{t("marketplace.editor.kind_category")}</option>
                    <option value="featured">{t("marketplace.editor.kind_featured")}</option>
                    <option value="product_grid">{t("marketplace.editor.kind_product_grid")}</option>
                    <option value="story">{t("marketplace.editor.kind_story")}</option>
                    <option value="service">{t("marketplace.editor.kind_service")}</option>
                  </select>
                  <button type="button" className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border-soft)] text-[#AAAAAA] hover:text-[#FFFFFF]" onClick={() => addBlock(section.id, "product")}>
                    + {t("marketplace.editor.block_product")}
                  </button>
                  <button type="button" className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border-soft)] text-[#AAAAAA]" onClick={() => addBlock(section.id, "image")}>
                    + {t("marketplace.editor.block_image")}
                  </button>
                  <button type="button" className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border-soft)] text-[#AAAAAA]" onClick={() => addBlock(section.id, "text")}>
                    + {t("marketplace.editor.block_text")}
                  </button>
                  <button type="button" className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border-soft)] text-[#AAAAAA]" onClick={() => addBlock(section.id, "category")}>
                    + {t("marketplace.editor.block_category")}
                  </button>
                  <button type="button" className="text-xs px-3 py-1.5 rounded-lg border border-[#D4AF37]/35 text-[#D4AF37]/90" onClick={() => addBlock(section.id, "cta")}>
                    + {t("marketplace.editor.block_cta")}
                  </button>
                  <button type="button" className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border-soft)] text-[#AAAAAA]" onClick={() => addBlock(section.id, "spacer")}>
                    + {t("marketplace.editor.block_spacer")}
                  </button>
                  <button type="button" className="text-xs px-3 py-1.5 rounded-lg border border-red-900/40 text-red-400/90" onClick={() => removeSection(section.id)}>
                    {t("marketplace.editor.remove_section")}
                  </button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  className="flex-1 bg-[#121212] border border-[var(--border-soft)] rounded-lg text-xs text-[#E8E8E8] py-2 px-3"
                  placeholder={t("marketplace.editor.section_title_field")}
                  value={section.title ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...layout,
                      sections: layout.sections.map((s) => (s.id === section.id ? { ...s, title: e.target.value } : s)),
                    })
                  }
                />
                <input
                  className="flex-1 bg-[#121212] border border-[var(--border-soft)] rounded-lg text-xs text-[#AAAAAA] py-2 px-3"
                  placeholder={t("marketplace.editor.section_subtitle_field")}
                  value={section.subtitle ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...layout,
                      sections: layout.sections.map((s) => (s.id === section.id ? { ...s, subtitle: e.target.value } : s)),
                    })
                  }
                />
              </div>
            </div>
          )}
          {(section.title || section.subtitle) && (
            <header className="mb-10 text-center md:text-left">
              {section.title && <h3 className="font-[family-name:var(--font-serif)] text-2xl md:text-3xl italic text-[#F5F5F5]">{section.title}</h3>}
              {section.subtitle && <p className="mt-3 text-[#A0A0A0] max-w-2xl">{section.subtitle}</p>}
            </header>
          )}
          {blockGrid(section, sortBlocks(section.blocks))}
        </section>
      ))}

      {editMode && (
        <div className="flex flex-wrap gap-3 justify-center pt-4">
          <button type="button" className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-[#C6A36A]/40 text-[#C6A36A] text-sm hover:bg-[rgba(198,163,106,0.08)]" onClick={() => addSection("grid")}>
            <LayoutGrid className="w-4 h-4" /> {t("marketplace.editor.add_section_grid")}
          </button>
          <button type="button" className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-[var(--border-soft)] text-[#AAAAAA] text-sm" onClick={() => addSection("stack")}>
            <Maximize2 className="w-4 h-4" /> {t("marketplace.editor.add_section_stack")}
          </button>
          <button type="button" className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-[var(--border-soft)] text-[#AAAAAA] text-sm" onClick={() => addSection("split")}>
            <Minus className="w-4 h-4" /> {t("marketplace.editor.add_section_split")}
          </button>
        </div>
      )}

      {editTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setEditTarget(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border-soft)] bg-[#0A0A0A] p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-lg font-serif italic text-[#F5F5F5] mb-4">{t("marketplace.editor.edit_block")}</h4>
            {editTarget.block.type === "product" && (
              <label className="block space-y-2 mb-4">
                <span className="text-xs uppercase tracking-wider text-[#888888]">{t("marketplace.editor.product_id")}</span>
                <select
                  className="w-full bg-[#121212] border border-[var(--border-soft)] rounded-xl py-2 px-3 text-[#F5F5F5]"
                  value={editTarget.block.productId ?? ""}
                  onChange={(e) =>
                    setEditTarget({
                      ...editTarget,
                      block: { ...editTarget.block, productId: e.target.value ? Number(e.target.value) : undefined },
                    })
                  }
                >
                  <option value="">{t("marketplace.editor.pick_product")}</option>
                  {masterpieces.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} · {p.serial_id}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {editTarget.block.type === "image" && (
              <div className="space-y-3 mb-4">
                <label className="block space-y-1">
                  <span className="text-xs text-[#888888]">URL</span>
                  <input
                    className="w-full bg-[#121212] border border-[var(--border-soft)] rounded-xl py-2 px-3 text-sm text-[#F5F5F5]"
                    value={editTarget.block.imageUrl ?? ""}
                    onChange={(e) => setEditTarget({ ...editTarget, block: { ...editTarget.block, imageUrl: e.target.value } })}
                  />
                </label>
                {onUploadImage && (
                  <label className="inline-flex items-center gap-2 text-sm text-[#C6A36A] cursor-pointer">
                    <ImageIcon className="w-4 h-4" />
                    <span>{t("marketplace.editor.upload_image")}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const r = new FileReader();
                        r.onload = async () => {
                          const url = await onUploadImage(String(r.result));
                          if (url) setEditTarget((prev) => (prev ? { ...prev, block: { ...prev.block, imageUrl: url } } : null));
                        };
                        r.readAsDataURL(f);
                      }}
                    />
                  </label>
                )}
                <label className="block space-y-1">
                  <span className="text-xs text-[#888888]">Alt</span>
                  <input
                    className="w-full bg-[#121212] border border-[var(--border-soft)] rounded-xl py-2 px-3 text-sm"
                    value={editTarget.block.imageAlt ?? ""}
                    onChange={(e) => setEditTarget({ ...editTarget, block: { ...editTarget.block, imageAlt: e.target.value } })}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-[#888888]">{t("marketplace.editor.link_type")}</span>
                  <select
                    className="w-full bg-[#121212] border border-[var(--border-soft)] rounded-xl py-2 px-3 text-sm"
                    value={editTarget.block.linkType ?? "none"}
                    onChange={(e) =>
                      setEditTarget({
                        ...editTarget,
                        block: { ...editTarget.block, linkType: e.target.value as MarketplaceBlock["linkType"] },
                      })
                    }
                  >
                    <option value="none">—</option>
                    <option value="piece">{t("marketplace.editor.link_piece")}</option>
                    <option value="view">{t("marketplace.editor.link_view")}</option>
                    <option value="external">URL</option>
                  </select>
                </label>
                {editTarget.block.linkType === "piece" && (
                  <select
                    className="w-full bg-[#121212] border border-[var(--border-soft)] rounded-xl py-2 px-3 text-sm"
                    value={editTarget.block.linkPieceId ?? ""}
                    onChange={(e) =>
                      setEditTarget({
                        ...editTarget,
                        block: { ...editTarget.block, linkPieceId: e.target.value ? Number(e.target.value) : undefined },
                      })
                    }
                  >
                    <option value="">{t("marketplace.editor.pick_product")}</option>
                    {masterpieces.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                )}
                {editTarget.block.linkType === "view" && (
                  <select
                    className="w-full bg-[#121212] border border-[var(--border-soft)] rounded-xl py-2 px-3 text-sm"
                    value={editTarget.block.linkView ?? ""}
                    onChange={(e) => setEditTarget({ ...editTarget, block: { ...editTarget.block, linkView: e.target.value } })}
                  >
                    <option value="">{t("marketplace.editor.pick_view")}</option>
                    {VIEW_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                )}
                {editTarget.block.linkType === "external" && (
                  <input
                    className="w-full bg-[#121212] border border-[var(--border-soft)] rounded-xl py-2 px-3 text-sm"
                    placeholder="https://"
                    value={editTarget.block.linkUrl ?? ""}
                    onChange={(e) => setEditTarget({ ...editTarget, block: { ...editTarget.block, linkUrl: e.target.value } })}
                  />
                )}
              </div>
            )}
            {editTarget.block.type === "text" && (
              <div className="space-y-3 mb-4">
                <input
                  className="w-full bg-[#121212] border border-[var(--border-soft)] rounded-xl py-2 px-3 text-sm"
                  placeholder={t("marketplace.editor.headline")}
                  value={editTarget.block.headline ?? ""}
                  onChange={(e) => setEditTarget({ ...editTarget, block: { ...editTarget.block, headline: e.target.value } })}
                />
                <textarea
                  className="w-full bg-[#121212] border border-[var(--border-soft)] rounded-xl py-2 px-3 text-sm min-h-[120px]"
                  placeholder={t("marketplace.editor.body")}
                  value={editTarget.block.body ?? ""}
                  onChange={(e) => setEditTarget({ ...editTarget, block: { ...editTarget.block, body: e.target.value } })}
                />
              </div>
            )}
            {editTarget.block.type === "category" && (
              <div className="space-y-3 mb-4">
                <input
                  className="w-full bg-[#121212] border border-[var(--border-soft)] rounded-xl py-2 px-3 text-sm"
                  value={editTarget.block.categoryLabel ?? ""}
                  onChange={(e) => setEditTarget({ ...editTarget, block: { ...editTarget.block, categoryLabel: e.target.value } })}
                />
                <textarea
                  className="w-full bg-[#121212] border border-[var(--border-soft)] rounded-xl py-2 px-3 text-sm min-h-[80px]"
                  value={editTarget.block.categorySubline ?? ""}
                  onChange={(e) => setEditTarget({ ...editTarget, block: { ...editTarget.block, categorySubline: e.target.value } })}
                />
                <select
                  className="w-full bg-[#121212] border border-[var(--border-soft)] rounded-xl py-2 px-3 text-sm"
                  value={editTarget.block.linkView ?? ""}
                  onChange={(e) => setEditTarget({ ...editTarget, block: { ...editTarget.block, linkView: e.target.value } })}
                >
                  <option value="">{t("marketplace.editor.cta_view_optional")}</option>
                  {VIEW_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {editTarget.block.type === "cta" && (
              <div className="space-y-3 mb-4">
                <label className="block space-y-1">
                  <span className="text-xs text-[#888888]">{t("marketplace.editor.cta_headline")}</span>
                  <input
                    className="w-full bg-[#121212] border border-[var(--border-soft)] rounded-xl py-2 px-3 text-sm text-[#F5F5F5]"
                    value={editTarget.block.ctaLabel ?? ""}
                    onChange={(e) => setEditTarget({ ...editTarget, block: { ...editTarget.block, ctaLabel: e.target.value } })}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-[#888888]">{t("marketplace.editor.cta_eyebrow")}</span>
                  <input
                    className="w-full bg-[#121212] border border-[var(--border-soft)] rounded-xl py-2 px-3 text-sm"
                    value={editTarget.block.ctaSubline ?? ""}
                    onChange={(e) => setEditTarget({ ...editTarget, block: { ...editTarget.block, ctaSubline: e.target.value } })}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-[#888888]">{t("marketplace.editor.cta_action")}</span>
                  <select
                    className="w-full bg-[#121212] border border-[var(--border-soft)] rounded-xl py-2 px-3 text-sm"
                    value={editTarget.block.ctaAction ?? "consultation"}
                    onChange={(e) =>
                      setEditTarget({
                        ...editTarget,
                        block: { ...editTarget.block, ctaAction: e.target.value as CtaAction },
                      })
                    }
                  >
                    <option value="consultation">{t("marketplace.editor.cta_action_consultation")}</option>
                    <option value="contact">{t("marketplace.editor.cta_action_contact")}</option>
                    <option value="view">{t("marketplace.editor.cta_action_view")}</option>
                    <option value="external">{t("marketplace.editor.cta_action_external")}</option>
                    <option value="piece">{t("marketplace.editor.cta_action_piece")}</option>
                  </select>
                </label>
                {editTarget.block.ctaAction === "view" && (
                  <select
                    className="w-full bg-[#121212] border border-[var(--border-soft)] rounded-xl py-2 px-3 text-sm"
                    value={editTarget.block.ctaView ?? ""}
                    onChange={(e) => setEditTarget({ ...editTarget, block: { ...editTarget.block, ctaView: e.target.value } })}
                  >
                    <option value="">{t("marketplace.editor.pick_view")}</option>
                    {VIEW_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                )}
                {editTarget.block.ctaAction === "external" && (
                  <input
                    className="w-full bg-[#121212] border border-[var(--border-soft)] rounded-xl py-2 px-3 text-sm"
                    placeholder="https://"
                    value={editTarget.block.ctaUrl ?? ""}
                    onChange={(e) => setEditTarget({ ...editTarget, block: { ...editTarget.block, ctaUrl: e.target.value } })}
                  />
                )}
                {editTarget.block.ctaAction === "piece" && (
                  <select
                    className="w-full bg-[#121212] border border-[var(--border-soft)] rounded-xl py-2 px-3 text-sm"
                    value={editTarget.block.ctaPieceId ?? ""}
                    onChange={(e) =>
                      setEditTarget({
                        ...editTarget,
                        block: { ...editTarget.block, ctaPieceId: e.target.value ? Number(e.target.value) : undefined },
                      })
                    }
                  >
                    <option value="">{t("marketplace.editor.pick_product")}</option>
                    {masterpieces.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
            {editTarget.block.type === "spacer" && (
              <label className="block space-y-2 mb-4">
                <span className="text-xs text-[#888888]">{t("marketplace.editor.spacer_px")}</span>
                <input
                  type="number"
                  min={8}
                  max={240}
                  className="w-full bg-[#121212] border border-[var(--border-soft)] rounded-xl py-2 px-3 text-sm"
                  value={editTarget.block.spacerPx ?? 32}
                  onChange={(e) =>
                    setEditTarget({
                      ...editTarget,
                      block: { ...editTarget.block, spacerPx: Math.min(240, Math.max(8, Number(e.target.value) || 32)) },
                    })
                  }
                />
              </label>
            )}
            {sectionAllowsColumn(layout.sections.find((s) => s.id === editTarget.sectionId)?.type) && (
              <label className="block space-y-2 mb-4">
                <span className="text-xs text-[#888888]">{t("marketplace.editor.column_split")}</span>
                <select
                  className="w-full bg-[#121212] border border-[var(--border-soft)] rounded-xl py-2 px-3 text-sm"
                  value={editTarget.block.column ?? "left"}
                  onChange={(e) =>
                    setEditTarget({
                      ...editTarget,
                      block: { ...editTarget.block, column: e.target.value as "left" | "right" },
                    })
                  }
                >
                  <option value="left">{t("marketplace.editor.column_left")}</option>
                  <option value="right">{t("marketplace.editor.column_right")}</option>
                </select>
              </label>
            )}
            {(editTarget.block.type === "text" || editTarget.block.type === "category" || editTarget.block.type === "image" || editTarget.block.type === "cta") && (
              <label className="block space-y-2 mb-4">
                <span className="text-xs text-[#888888]">{t("marketplace.editor.section_title_optional")}</span>
                <p className="text-[10px] text-[#666666]">{t("marketplace.editor.section_title_hint")}</p>
                <input
                  className="w-full bg-[#121212] border border-[var(--border-soft)] rounded-xl py-2 px-3 text-sm"
                  value={layout.sections.find((s) => s.id === editTarget.sectionId)?.title ?? ""}
                  onChange={(e) => {
                    const sid = editTarget.sectionId;
                    onChange({
                      ...layout,
                      sections: layout.sections.map((s) => (s.id === sid ? { ...s, title: e.target.value } : s)),
                    });
                  }}
                />
              </label>
            )}
            <div className="flex gap-3 mt-6">
              <button type="button" className="flex-1 py-3 rounded-xl bg-[#C6A36A] text-black text-sm font-medium" onClick={saveEditModal}>
                {t("save")}
              </button>
              <button type="button" className="flex-1 py-3 rounded-xl border border-[var(--border-soft)] text-[#AAAAAA] text-sm" onClick={() => setEditTarget(null)}>
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function sectionAllowsColumn(st?: string): boolean {
  return st === "split";
}

function sectionShellClass(section: MarketplaceSection, editMode: boolean): string {
  const hidden = editMode && section.hidden ? "opacity-55 ring-1 ring-dashed ring-[#D4AF37]/30" : "";
  const edit = editMode ? "border-[rgba(198,163,106,0.12)] bg-[rgba(198,163,106,0.02)] p-4 md:p-6" : "";
  switch (section.experienceKind) {
    case "hero":
      return `${edit} py-16 md:py-24 px-1 md:px-4 min-h-[36vh] flex flex-col justify-center ${hidden}`.trim();
    case "category":
      return `${edit} py-12 md:py-20 ${hidden}`.trim();
    case "featured":
      return `${edit} py-14 md:py-28 ${hidden}`.trim();
    case "product_grid":
      return `${edit} py-10 md:py-20 ${hidden}`.trim();
    case "story":
      return `${edit} py-16 md:py-28 ${hidden}`.trim();
    case "service":
      return `${edit} py-14 md:py-22 my-6 border border-[rgba(212,175,55,0.1)] bg-[#121212]/35 px-2 md:px-8 ${hidden}`.trim();
    default:
      return `${edit} ${!editMode ? "py-8 md:py-14" : ""} ${hidden}`.trim();
  }
}
