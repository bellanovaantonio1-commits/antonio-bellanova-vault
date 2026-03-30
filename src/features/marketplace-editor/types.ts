export type BlockSize = "sm" | "md" | "lg" | "full";

/** Product block presentation in custom marketplace layout (admin-controlled). */
export type ProductDisplayMode = "full" | "image_only" | "minimal";

export type CtaAction = "consultation" | "contact" | "view" | "external" | "piece";

export type ExperienceKind = "hero" | "category" | "featured" | "product_grid" | "story" | "service" | "custom";

export type MarketplaceBlock = {
  id: string;
  type: "product" | "image" | "text" | "category" | "spacer" | "cta";
  size: BlockSize;
  sortOrder: number;
  column?: "left" | "right";
  productId?: number;
  display_mode?: ProductDisplayMode;
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

export const EMPTY_MARKETPLACE_LAYOUT: MarketplaceLayoutDoc = { version: 1, enabled: false, sections: [] };
