export const CURATED_SECTION_TYPES = [
  "hero",
  "category_block",
  "product_row",
  "featured_piece",
  "split",
  "editorial",
] as const;

export type CuratedSectionType = (typeof CURATED_SECTION_TYPES)[number];

export function defaultSectionConfig(type: CuratedSectionType): Record<string, unknown> {
  switch (type) {
    case "hero":
      return {
        imageUrl: "",
        title: "",
        subtitle: "",
        ctaLabel: "",
        ctaView: "concierge",
      };
    case "category_block":
      return { heading: "", subheading: "", ctaLabel: "", ctaView: "" };
    case "product_row":
      return { title: "", subtitle: "", productIds: [] as number[] };
    case "featured_piece":
      return { productId: null as number | null, headline: "", subline: "" };
    case "split":
      return {
        imageUrl: "",
        imageSide: "left",
        title: "",
        body: "",
        productIds: [] as number[],
      };
    case "editorial":
      return { headline: "", body: "", align: "center" };
    default:
      return {};
  }
}

export function clampProductIds(ids: unknown, max = 6): number[] {
  if (!Array.isArray(ids)) return [];
  const out: number[] = [];
  for (const x of ids) {
    const n = Number(x);
    if (Number.isFinite(n) && n > 0 && !out.includes(n)) out.push(n);
    if (out.length >= max) break;
  }
  return out;
}
