import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, GripVertical, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { BlockSize, MarketplaceBlock, MarketplaceSection } from "./types";

export type MarketplaceSortableBlockProps = {
  block: MarketplaceBlock;
  section: MarketplaceSection;
  /** Grid: column span wrapper class; stack/split: optional layout class */
  layoutClassName?: string;
  editMode: boolean;
  activeBlockId: string | null;
  showMenu: boolean;
  menuRef: React.RefObject<HTMLDivElement | null>;
  onToggleMenu: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSetSize: (sz: BlockSize) => void;
  t: (k: string) => string;
  children: React.ReactNode;
};

export function MarketplaceSortableBlock({
  block,
  section,
  layoutClassName = "",
  editMode,
  activeBlockId,
  showMenu,
  menuRef,
  onToggleMenu,
  onEdit,
  onDuplicate,
  onDelete,
  onSetSize,
  t,
  children,
}: MarketplaceSortableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({
    id: block.id,
    data: { type: "block" as const, sectionId: section.id },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? "transform 200ms cubic-bezier(0.22, 1, 0.36, 1)",
  };

  if (!editMode) {
    return <div className={layoutClassName}>{children}</div>;
  }

  const dropHighlight = isOver && activeBlockId && activeBlockId !== block.id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        layoutClassName,
        "relative rounded-2xl",
        dropHighlight ? "ring-2 ring-[#D4AF37] ring-offset-2 ring-offset-[#0A0A0A] z-10" : "",
        isDragging ? "opacity-[0.35] z-20" : "",
        "transition-[opacity,box-shadow] duration-200 ease-out",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="relative group/block rounded-2xl h-full min-h-0 transition-shadow duration-200 ease-out">
        <div className="absolute top-2 left-2 z-40 flex gap-1">
          <button
            type="button"
            className="p-1.5 rounded-lg bg-[#1a1a1a]/95 border border-[var(--border-soft)] text-[#D4AF37] cursor-grab active:cursor-grabbing touch-none shadow-lg hover:bg-black hover:border-[#D4AF37]/40"
            title={t("marketplace.editor.move")}
            aria-label={t("marketplace.editor.move")}
            {...listeners}
            {...attributes}
          >
            <GripVertical className="w-4 h-4" />
          </button>
        </div>
        <div className="absolute top-2 right-2 z-30" ref={showMenu ? menuRef : undefined}>
          <button
            type="button"
            className="p-2 rounded-lg bg-black/70 border border-[var(--border-soft)] text-[#E8E8E8] hover:bg-black/90"
            onClick={onToggleMenu}
            aria-label={t("marketplace.editor.more")}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-1 w-52 rounded-xl border border-[var(--border-soft)] bg-[#121212] shadow-2xl py-1 text-sm z-50">
              <button
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-white/5 text-[#E8E8E8]"
                onClick={onEdit}
              >
                <Pencil className="w-3.5 h-3.5 inline mr-2 opacity-70" /> {t("marketplace.editor.edit")}
              </button>
              <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-[#666666]">{t("marketplace.editor.size")}</div>
              {(["sm", "md", "lg", "full"] as BlockSize[]).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  className="w-full text-left px-3 py-1.5 hover:bg-white/5 text-[#AAAAAA] pl-6"
                  onClick={() => onSetSize(sz)}
                >
                  {t(`marketplace.editor.size_${sz}`)}
                </button>
              ))}
              <button type="button" className="w-full text-left px-3 py-2 hover:bg-white/5 text-[#E8E8E8]" onClick={onDuplicate}>
                <Copy className="w-3.5 h-3.5 inline mr-2 opacity-70" /> {t("marketplace.editor.duplicate")}
              </button>
              <button type="button" className="w-full text-left px-3 py-2 hover:bg-red-950/40 text-red-300" onClick={onDelete}>
                <Trash2 className="w-3.5 h-3.5 inline mr-2 opacity-70" /> {t("marketplace.editor.delete")}
              </button>
            </div>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
