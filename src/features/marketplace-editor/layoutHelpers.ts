import type { BlockSize, MarketplaceBlock, MarketplaceLayoutDoc, MarketplaceSection } from "./types";

export function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function sortSections(doc: MarketplaceLayoutDoc): MarketplaceSection[] {
  return [...doc.sections].sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
}

export function sortBlocks(blocks: MarketplaceBlock[]): MarketplaceBlock[] {
  return [...blocks].sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
}

export function colClass(size: BlockSize): string {
  switch (size) {
    case "sm":
      return "col-span-12 md:col-span-3";
    case "md":
      return "col-span-12 md:col-span-6";
    case "lg":
      return "col-span-12 md:col-span-8";
    case "full":
    default:
      return "col-span-12";
  }
}

export function cloneBlock(b: MarketplaceBlock): MarketplaceBlock {
  return { ...JSON.parse(JSON.stringify(b)), id: newId("blk"), sortOrder: b.sortOrder + 0.5 };
}

export function buildLayoutFromProductIds(ids: number[]): MarketplaceLayoutDoc {
  const blocks: MarketplaceBlock[] = ids.map((productId, i) => ({
    id: newId("blk"),
    type: "product" as const,
    size: "md" as const,
    sortOrder: i,
    productId,
  }));
  return {
    version: 1,
    enabled: true,
    sections: [
      {
        id: newId("sec"),
        type: "grid",
        sortOrder: 0,
        title: "",
        blocks,
      },
    ],
  };
}
