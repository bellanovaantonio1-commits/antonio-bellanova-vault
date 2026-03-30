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

function arrayMoveIds(ids: string[], from: number, to: number): string[] {
  const next = [...ids];
  const [x] = next.splice(from, 1);
  if (x === undefined) return ids;
  next.splice(to, 0, x);
  return next;
}

export function splitColumnOf(block: MarketplaceBlock): "left" | "right" {
  return block.column === "right" ? "right" : "left";
}

export function findSectionIdForBlock(layout: MarketplaceLayoutDoc, blockId: string): string | undefined {
  for (const s of layout.sections) {
    if (s.blocks.some((b) => b.id === blockId)) return s.id;
  }
  return undefined;
}

/** Reorder blocks within a section using stable sortOrder order (fixes index mismatch vs. raw array). */
export function moveBlockToEndInSection(section: MarketplaceSection, blockId: string): MarketplaceSection {
  const sorted = sortBlocks([...section.blocks]);
  const i = sorted.findIndex((b) => b.id === blockId);
  if (i < 0 || i === sorted.length - 1) return section;
  const [x] = sorted.splice(i, 1);
  if (!x) return section;
  sorted.push(x);
  return { ...section, blocks: sorted.map((b, idx) => ({ ...b, sortOrder: idx })) };
}

export function reorderBlocksInSection(section: MarketplaceSection, activeId: string, overId: string): MarketplaceSection {
  if (activeId === overId) return section;
  const sorted = sortBlocks([...section.blocks]);
  const oldI = sorted.findIndex((b) => b.id === activeId);
  const newI = sorted.findIndex((b) => b.id === overId);
  if (oldI < 0 || newI < 0) return section;
  const next = arrayMoveIds(
    sorted.map((b) => b.id),
    oldI,
    newI,
  );
  const byId = new Map(sorted.map((b) => [b.id, b] as const));
  return {
    ...section,
    blocks: next.map((id, i) => {
      const b = byId.get(id);
      return { ...b!, sortOrder: i };
    }),
  };
}

function stripColumn(b: MarketplaceBlock): MarketplaceBlock {
  if (b.column === undefined) return b;
  const { column: _c, ...rest } = b;
  return rest as MarketplaceBlock;
}

function withColumn(b: MarketplaceBlock, col: "left" | "right"): MarketplaceBlock {
  return { ...b, column: col };
}

/** Move a block to another section (or reorder across columns in split). `beforeBlockId` null = append. */
export function moveBlockToSection(
  layout: MarketplaceLayoutDoc,
  blockId: string,
  fromSectionId: string,
  toSectionId: string,
  beforeBlockId: string | null,
): MarketplaceLayoutDoc {
  const sections = layout.sections.map((s) => ({ ...s, blocks: [...s.blocks] }));
  const from = sections.find((s) => s.id === fromSectionId);
  const to = sections.find((s) => s.id === toSectionId);
  if (!from || !to) return layout;
  const bi = from.blocks.findIndex((b) => b.id === blockId);
  if (bi < 0) return layout;
  const [moving] = from.blocks.splice(bi, 1);
  if (!moving) return layout;

  let m: MarketplaceBlock = { ...moving };
  if (to.type === "split") {
    if (beforeBlockId) {
      const ref = to.blocks.find((b) => b.id === beforeBlockId);
      m = withColumn(m, ref && splitColumnOf(ref) === "right" ? "right" : "left");
    } else {
      m = withColumn(m, "left");
    }
  } else {
    m = stripColumn(m);
  }

  const destOthers = sortBlocks(to.blocks.filter((b) => b.id !== blockId));
  let insertAt = destOthers.length;
  if (beforeBlockId) {
    const j = destOthers.findIndex((b) => b.id === beforeBlockId);
    if (j >= 0) insertAt = j;
  }
  to.blocks = [...destOthers.slice(0, insertAt), m, ...destOthers.slice(insertAt)].map((b, i) => ({ ...b, sortOrder: i }));
  from.blocks = sortBlocks(from.blocks).map((b, i) => ({ ...b, sortOrder: i }));

  return { ...layout, sections };
}

function rebuildSplitSection(section: MarketplaceSection, byId: Map<string, MarketplaceBlock>, leftOrder: string[], rightOrder: string[]): MarketplaceSection {
  const blocks: MarketplaceBlock[] = [];
  let i = 0;
  for (const id of leftOrder) {
    const b = byId.get(id);
    if (b) blocks.push({ ...b, column: "left", sortOrder: i++ });
  }
  for (const id of rightOrder) {
    const b = byId.get(id);
    if (b) blocks.push({ ...b, column: "right", sortOrder: i++ });
  }
  return { ...section, blocks };
}

/** Split layout: reorder within a column or move to the other column. */
export function reorderSplitSectionBlocks(section: MarketplaceSection, activeId: string, overId: string): MarketplaceSection {
  if (activeId === overId) return section;
  const sorted = sortBlocks([...section.blocks]);
  const a = sorted.find((b) => b.id === activeId);
  const o = sorted.find((b) => b.id === overId);
  if (!a || !o) return section;

  const byId = new Map(sorted.map((b) => [b.id, { ...b }] as const));
  let leftOrder = sorted.filter((b) => splitColumnOf(b) === "left").map((b) => b.id);
  let rightOrder = sorted.filter((b) => splitColumnOf(b) === "right").map((b) => b.id);
  const aCol = splitColumnOf(a);
  const oCol = splitColumnOf(o);

  if (aCol === oCol) {
    const order = aCol === "left" ? [...leftOrder] : [...rightOrder];
    const oldI = order.indexOf(activeId);
    const newI = order.indexOf(overId);
    if (oldI < 0 || newI < 0) return section;
    const nextOrder = arrayMoveIds(order, oldI, newI);
    if (aCol === "left") leftOrder = nextOrder;
    else rightOrder = nextOrder;
    return rebuildSplitSection(section, byId, leftOrder, rightOrder);
  }

  if (aCol === "left") leftOrder = leftOrder.filter((id) => id !== activeId);
  else rightOrder = rightOrder.filter((id) => id !== activeId);
  byId.set(activeId, withColumn(byId.get(activeId)!, oCol));
  if (oCol === "left") {
    const idx = leftOrder.indexOf(overId);
    leftOrder = idx >= 0 ? [...leftOrder.slice(0, idx), activeId, ...leftOrder.slice(idx)] : [...leftOrder, activeId];
  } else {
    const idx = rightOrder.indexOf(overId);
    rightOrder = idx >= 0 ? [...rightOrder.slice(0, idx), activeId, ...rightOrder.slice(idx)] : [...rightOrder, activeId];
  }
  return rebuildSplitSection(section, byId, leftOrder, rightOrder);
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
