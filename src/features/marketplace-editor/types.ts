export type BlockSize = "sm" | "md" | "lg" | "full";

export type MarketplaceBlock = {
  id: string;
  type: "product" | "image" | "text" | "category" | "spacer";
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
};

export type MarketplaceSection = {
  id: string;
  type: "grid" | "stack" | "split";
  sortOrder: number;
  title?: string;
  subtitle?: string;
  blocks: MarketplaceBlock[];
};

export type MarketplaceLayoutDoc = {
  version: 1;
  enabled: boolean;
  sections: MarketplaceSection[];
};

export const EMPTY_MARKETPLACE_LAYOUT: MarketplaceLayoutDoc = { version: 1, enabled: false, sections: [] };
