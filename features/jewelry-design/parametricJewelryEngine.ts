/**
 * Parametric high-jewelry design: structured spec (source of truth) + image prompt derived from it.
 * Used by POST /api/ai/jewelry-design/generate — spec is produced first; rendering prompt embeds the same numbers.
 */

export const JEWELRY_PARAMETRIC_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    piece_type: {
      type: "string",
      description: "Primary jewelry category, e.g. ring, necklace, bracelet, earrings, pendant, brooch, other",
    },
    main_stone: {
      type: "object",
      additionalProperties: false,
      properties: {
        type: { type: "string", description: "Gem species / variety, e.g. Fancy Yellow Diamond" },
        dimensions_mm: { type: "string", description: 'Table dimensions as LxW or diameter, e.g. "14x10" or "8.0"' },
        cut: { type: "string", description: "Cut / shape, e.g. oval, emerald, round brilliant" },
        carat: { type: "number", description: "Computed carat weight consistent with dimensions_mm and gem type" },
      },
      required: ["type", "dimensions_mm", "cut", "carat"],
    },
    side_stones: {
      type: "object",
      additionalProperties: false,
      properties: {
        type: { type: "string", description: "Material, e.g. Diamonds, calibre rubies" },
        count: { type: "integer", minimum: 0, description: "Number of side / melee stones" },
        size_mm: { type: "string", description: "Typical diameter or size per stone, e.g. 2.5" },
        carat_per_stone: { type: "number", description: "Estimated carat per side stone (0 if count is 0)" },
        total_carat: { type: "number", description: "Must align with count * carat_per_stone (within rounding)" },
        cut: { type: "string", description: "Cut for side stones" },
      },
      required: ["type", "count", "size_mm", "carat_per_stone", "total_carat", "cut"],
    },
    mounting: {
      type: "object",
      additionalProperties: false,
      properties: {
        metal: { type: "string" },
        finish: { type: "string" },
      },
      required: ["metal", "finish"],
    },
    structure: {
      type: "object",
      additionalProperties: false,
      properties: {
        chain_width_mm: { type: "string", description: "Width of chain or shank where relevant; use empty string if N/A" },
        chain_length_mm: { type: "string", description: "Necklace/bracelet length; empty if N/A" },
        band_width_mm: { type: "string", description: "Ring band width; empty if N/A" },
        overall_proportions_note: { type: "string", description: "One line on balance / silhouette vs. stones" },
      },
      required: ["chain_width_mm", "chain_length_mm", "band_width_mm", "overall_proportions_note"],
    },
    design_intent_summary: {
      type: "string",
      description: "One short paragraph: how the brief maps to this exact configuration (assumptions stated)",
    },
  },
  required: [
    "piece_type",
    "main_stone",
    "side_stones",
    "mounting",
    "structure",
    "design_intent_summary",
  ],
} as const;

export const PARAMETRIC_SPEC_SYSTEM_INSTRUCTION = `You are a senior high-jewelry designer and gemologist for Antonio Bellanova Atelier.

From the client's brief you must define exactly ONE coherent, producible piece. All measurements and carat weights must be internally consistent: derive main stone carat from stated or implied dimensions and gem type using standard industry reasoning (e.g. mm size to carat for the given cut and material). Side stone total_carat must match count × carat_per_stone within normal rounding.

Do not output generic marketing fluff in JSON fields — only precise technical labels and numbers where requested.

You respond ONLY as JSON matching the provided schema.`;

export function buildJewelryImagePromptFromSpec(clientBrief: string, spec: Record<string, unknown>): string {
  const specJson = JSON.stringify(spec, null, 2);
  return `Photorealistic luxury jewelry product render, high jewelry maison quality.

MANDATORY VISUAL CONSTRAINTS:
- Pure black background (#000), no gradient, no props, no hands, no mannequin.
- Studio macro lighting: crisp highlights on metal and facets, controlled reflections.
- Physically plausible proportions: the centerpiece and melee must match the specification below exactly.

CLIENT BRIEF (intent):
${clientBrief.trim()}

AUTHORITATIVE TECHNICAL SPECIFICATION (the image MUST reflect these numbers and types — this is not optional):
${specJson}

Render a single hero view appropriate for the piece_type (e.g. top-three-quarter for a ring). Ultra-sharp, editorial high-jewelry campaign quality.`;
}

export function extractTextFromGenerateContentResponse(response: unknown): string {
  const r = response as {
    text?: string;
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  if (typeof r?.text === "string" && r.text.trim()) return r.text.trim();
  const parts = r?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    const joined = parts.map((p) => (typeof p?.text === "string" ? p.text : "")).join("");
    if (joined.trim()) return joined.trim();
  }
  return "";
}
