import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Eye, EyeOff, GripVertical, Image as ImageIcon, LayoutGrid, Maximize2, Minus } from "lucide-react";
import type { Masterpiece } from "../../types";
import type { BlockSize, CtaAction, MarketplaceBlock, MarketplaceLayoutDoc, MarketplaceSection, ProductDisplayMode } from "./types";
import {
  cloneBlock,
  colClass,
  findSectionIdForBlock,
  moveBlockToSection,
  newId,
  moveBlockToEndInSection,
  reorderBlocksInSection,
  reorderSplitSectionBlocks,
  sortBlocks,
  sortSections,
  splitColumnOf,
} from "./layoutHelpers";
import { MarketplaceSortableBlock } from "./MarketplaceSortableBlock";
import { LuxuryImagePlaceholder } from "../../components/LuxuryImagePlaceholder";

const DND_MIME = "application/x-ab-marketplace";

type DragPayload = { kind: "section"; index: number };

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

function EmptySectionDropTarget({ sectionId, t }: { sectionId: string; t: (k: string) => string }) {
  const { setNodeRef, isOver } = useDroppable({ id: `mkt-empty-${sectionId}` });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[120px] rounded-2xl border-2 border-dashed flex items-center justify-center text-[10px] uppercase tracking-[0.25em] px-4 text-center transition-all ${
        isOver ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]" : "border-[var(--border-soft)] text-[#555555]"
      }`}
    >
      {t("marketplace.editor.drop_zone_empty")}
    </div>
  );
}

function SectionAppendDropZone({ sectionId }: { sectionId: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: `mkt-append-${sectionId}` });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg transition-all min-h-3 mt-2 ${isOver ? "min-h-10 ring-2 ring-[#D4AF37] bg-[#D4AF37]/8" : ""}`}
    />
  );
}

function piecePrimaryImageUrl(piece: Masterpiece): string {
  return String(piece.image_url || "").trim();
}

function defaultBlock(type: MarketplaceBlock["type"], order: number): MarketplaceBlock {
  const id = newId("blk");
  switch (type) {
    case "product":
      return { id, type, size: "md", sortOrder: order, display_mode: "full" };
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
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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

  const handleBlockDragStart = (e: DragStartEvent) => {
    if (!editMode) return;
    setActiveBlockId(String(e.active.id));
  };

  const handleBlockDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveBlockId(null);
    if (!over) return;
    const aid = String(active.id);
    const oid = String(over.id);

    if (oid.startsWith("mkt-append-")) {
      const toSid = oid.slice("mkt-append-".length);
      const fromSid = findSectionIdForBlock(layout, aid);
      if (!fromSid) return;
      if (fromSid === toSid) {
        const sec = layout.sections.find((s) => s.id === toSid);
        if (!sec || sec.type === "split") return;
        onChange({
          ...layout,
          sections: layout.sections.map((s) => (s.id === toSid ? moveBlockToEndInSection(s, aid) : s)),
        });
      } else {
        onChange(moveBlockToSection(layout, aid, fromSid, toSid, null));
      }
      return;
    }

    if (oid.startsWith("mkt-empty-")) {
      const toSid = oid.slice("mkt-empty-".length);
      const fromSid = findSectionIdForBlock(layout, aid);
      if (!fromSid || fromSid === toSid) return;
      onChange(moveBlockToSection(layout, aid, fromSid, toSid, null));
      return;
    }

    const fromSid = findSectionIdForBlock(layout, aid);
    const toSid = findSectionIdForBlock(layout, oid);
    if (!fromSid || !toSid) return;
    const toSec = layout.sections.find((s) => s.id === toSid);
    if (!toSec) return;

    if (fromSid === toSid) {
      if (toSec.type === "split") {
        const updated = reorderSplitSectionBlocks(toSec, aid, oid);
        onChange({ ...layout, sections: layout.sections.map((s) => (s.id === toSid ? updated : s)) });
      } else {
        const updated = reorderBlocksInSection(toSec, aid, oid);
        onChange({ ...layout, sections: layout.sections.map((s) => (s.id === toSid ? updated : s)) });
      }
    } else {
      onChange(moveBlockToSection(layout, aid, fromSid, toSid, oid));
    }
  };

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
        const mode: ProductDisplayMode = block.display_mode ?? "full";
        const filtered = !piecePassesFilter(pid);
        const img = piecePrimaryImageUrl(piece);
        const openPiece = () => onOpenPiece(piece);

        let card: React.ReactNode;
        if (mode === "image_only") {
          card = (
            <button
              type="button"
              className={`group block w-full max-w-none text-left bg-transparent border-0 p-0 m-0 rounded-none ${
                filtered
                  ? editMode
                    ? "opacity-50 cursor-default"
                    : "opacity-45 pointer-events-none cursor-default"
                  : "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
              }`}
              onClick={filtered ? undefined : wrapClick(openPiece)}
            >
              <div className="relative overflow-hidden bg-[#0A0A0A] aspect-[3/4] md:aspect-[4/5]">
                {img ? (
                  <img
                    src={img}
                    alt={piece.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-[transform,filter] duration-[680ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06] group-hover:brightness-[1.04]"
                  />
                ) : (
                  <LuxuryImagePlaceholder label="IMAGE_PRODUCT" mode="fill" roundedClass="rounded-none border-zinc-700/40" compact />
                )}
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ boxShadow: "inset 0 0 90px rgba(212,175,55,0.14)" }}
                />
              </div>
            </button>
          );
        } else if (mode === "minimal") {
          card = (
            <div className={filtered ? (editMode ? "opacity-50" : "opacity-45 pointer-events-none") : ""}>
              <button
                type="button"
                className="group block w-full text-left bg-transparent border-0 p-0 rounded-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
                onClick={filtered ? undefined : wrapClick(openPiece)}
              >
                <div className="relative overflow-hidden bg-[#0A0A0A] aspect-square">
                  {img ? (
                    <img
                      src={img}
                      alt={piece.title}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                    />
                  ) : (
                    <LuxuryImagePlaceholder label="IMAGE_PRODUCT" mode="fill" roundedClass="rounded-none border-zinc-700/40" compact />
                  )}
                </div>
              </button>
              <h4 className="mt-6 md:mt-8 font-[family-name:var(--font-serif)] text-lg md:text-xl text-[#F5F5F5] tracking-wide leading-snug">
                {piece.title}
              </h4>
            </div>
          );
        } else {
          card = <>{renderProductCard(piece, filtered)}</>;
        }

        const isFeatured = Number(piece.featured_masterpiece) === 1;
        if (isFeatured) {
          if (mode === "full") {
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
          return (
            <div className="space-y-5 md:space-y-6 p-2 md:p-4">
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#D4AF37]/95 text-center md:text-left px-1">{t("marketplace.editor.featured_badge")}</p>
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
              <LuxuryImagePlaceholder
                label="IMAGE_GALLERY"
                mode="fill"
                roundedClass="rounded-2xl"
                className="min-h-[200px] max-h-[70vh] border-[var(--border-soft)]"
              />
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

  const renderEditableBlock = (section: MarketplaceSection, block: MarketplaceBlock, layoutClassName?: string) => (
    <MarketplaceSortableBlock
      block={block}
      section={section}
      layoutClassName={layoutClassName}
      editMode={editMode}
      activeBlockId={activeBlockId}
      showMenu={menu?.sectionId === section.id && menu?.blockId === block.id}
      menuRef={menuRef}
      onToggleMenu={() =>
        setMenu(menu?.sectionId === section.id && menu?.blockId === block.id ? null : { sectionId: section.id, blockId: block.id })
      }
      onEdit={() => {
        setEditTarget({ sectionId: section.id, block: { ...block } });
        setMenu(null);
      }}
      onDuplicate={() => dupBlock(section.id, block)}
      onDelete={() => deleteBlock(section.id, block.id)}
      onSetSize={(sz) => setSize(section.id, block.id, sz)}
      onSetProductDisplayMode={
        block.type === "product"
          ? (m) => {
              updateSection(section.id, (s) => ({
                ...s,
                blocks: s.blocks.map((b) => (b.id === block.id ? { ...b, display_mode: m } : b)),
              }));
            }
          : undefined
      }
      t={t}
    >
      {renderBlockInner(section, block)}
    </MarketplaceSortableBlock>
  );

  const blockGrid = (section: MarketplaceSection, blocks: MarketplaceBlock[]) => {
    const blockIds = blocks.map((b) => b.id);
    const gridGap =
      section.experienceKind === "product_grid" ? "md:gap-x-12 md:gap-y-20 md:[&>*:nth-child(odd)]:translate-x-1" : "";

    if (!editMode) {
      if (section.type === "stack") {
        return (
          <div className="flex flex-col gap-8">
            {blocks.map((block) => (
              <React.Fragment key={block.id}>{renderBlockInner(section, block)}</React.Fragment>
            ))}
          </div>
        );
      }
      if (section.type === "split") {
        const sorted = sortBlocks(blocks);
        const left = sorted.filter((b) => splitColumnOf(b) === "left");
        const right = sorted.filter((b) => splitColumnOf(b) === "right");
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-start">
            <div className="flex flex-col gap-8">
              {left.map((block) => (
                <React.Fragment key={block.id}>{renderBlockInner(section, block)}</React.Fragment>
              ))}
            </div>
            <div className="flex flex-col gap-8">
              {right.map((block) => (
                <React.Fragment key={block.id}>{renderBlockInner(section, block)}</React.Fragment>
              ))}
            </div>
          </div>
        );
      }
      return (
        <div className={`grid grid-cols-12 gap-6 md:gap-8 ${gridGap}`}>
          {blocks.map((block) => (
            <div key={block.id} className={colClass(block.size)}>
              {renderBlockInner(section, block)}
            </div>
          ))}
        </div>
      );
    }

    if (section.type === "stack") {
      return (
        <>
          <SortableContext id={`${section.id}-stack`} items={blockIds} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-8">
              {blocks.map((block) => (
                <div key={block.id}>{renderEditableBlock(section, block)}</div>
              ))}
            </div>
          </SortableContext>
          <SectionAppendDropZone sectionId={section.id} />
        </>
      );
    }

    if (section.type === "split") {
      const sorted = sortBlocks(blocks);
      const left = sorted.filter((b) => splitColumnOf(b) === "left");
      const right = sorted.filter((b) => splitColumnOf(b) === "right");
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-start">
          <SortableContext id={`${section.id}-left`} items={left.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-8">
              {left.map((block) => (
                <div key={block.id}>{renderEditableBlock(section, block)}</div>
              ))}
            </div>
          </SortableContext>
          <SortableContext id={`${section.id}-right`} items={right.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-8">
              {right.map((block) => (
                <div key={block.id}>{renderEditableBlock(section, block)}</div>
              ))}
            </div>
          </SortableContext>
        </div>
      );
    }

    return (
      <>
        <SortableContext id={`${section.id}-grid`} items={blockIds} strategy={rectSortingStrategy}>
          <div className={`grid grid-cols-12 gap-6 md:gap-8 ${gridGap}`}>
            {blocks.map((block) => (
              <React.Fragment key={block.id}>{renderEditableBlock(section, block, colClass(block.size))}</React.Fragment>
            ))}
          </div>
        </SortableContext>
        <SectionAppendDropZone sectionId={section.id} />
      </>
    );
  };

  const dragOverlayBlock = useMemo(() => {
    if (!activeBlockId) return null;
    for (const s of layout.sections) {
      const b = s.blocks.find((x) => x.id === activeBlockId);
      if (b) return { section: s, block: b };
    }
    return null;
  }, [activeBlockId, layout.sections]);

  const shellClass = previewMode === "mobile" ? "max-w-[420px] mx-auto border-x border-[var(--border-soft)] px-3 min-h-[200px]" : "";

  const mainContent = (
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
          {editMode && sortBlocks(section.blocks).length === 0 ? (
            <EmptySectionDropTarget sectionId={section.id} t={t} />
          ) : (
            blockGrid(section, sortBlocks(section.blocks))
          )}
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
            {editTarget.block.type === "product" && (
              <label className="block space-y-2 mb-4">
                <span className="text-xs uppercase tracking-wider text-[#888888]">{t("marketplace.editor.display_label")}</span>
                <select
                  className="w-full bg-[#121212] border border-[var(--border-soft)] rounded-xl py-2 px-3 text-[#F5F5F5] text-sm"
                  value={editTarget.block.display_mode ?? "full"}
                  onChange={(e) =>
                    setEditTarget({
                      ...editTarget,
                      block: { ...editTarget.block, display_mode: e.target.value as ProductDisplayMode },
                    })
                  }
                >
                  <option value="full">{t("marketplace.editor.display_full")}</option>
                  <option value="image_only">{t("marketplace.editor.display_image_only")}</option>
                  <option value="minimal">{t("marketplace.editor.display_minimal")}</option>
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

  if (!editMode) {
    return mainContent;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleBlockDragStart} onDragEnd={handleBlockDragEnd}>
      {mainContent}
      <DragOverlay
        dropAnimation={{
          duration: 220,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {dragOverlayBlock ? (
          <div className="rounded-2xl border-2 border-[#D4AF37] bg-[#121212]/95 shadow-[0_28px_80px_rgba(0,0,0,0.72)] scale-[1.05] max-w-[min(100vw-2rem,440px)] pointer-events-none overflow-hidden">
            <div className="px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] border-b border-[#D4AF37]/25">{t("marketplace.editor.drag_preview")}</div>
            <div className="p-3 opacity-[0.96] max-h-[min(50vh,380px)] overflow-hidden">
              {renderBlockInner(dragOverlayBlock.section, dragOverlayBlock.block)}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
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
