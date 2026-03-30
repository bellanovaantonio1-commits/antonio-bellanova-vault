import React from "react";
import type { Masterpiece } from "../../types";
import { MessageCircle, ChevronRight } from "lucide-react";

export type MaisonLayoutSection = {
  id: number;
  section_type: string;
  sort_order: number;
  config: Record<string, unknown>;
};

type TFn = (k: string) => string;

function str(v: unknown): string {
  return v == null ? "" : String(v);
}

function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function idsArr(v: unknown, max: number): number[] {
  if (!Array.isArray(v)) return [];
  const out: number[] = [];
  for (const x of v) {
    const n = Number(x);
    if (Number.isFinite(n) && n > 0 && !out.includes(n)) out.push(n);
    if (out.length >= max) break;
  }
  return out;
}

export function MaisonPageView({
  pageTitle,
  sections,
  masterpiecesById,
  onNavigateView,
  onOpenPiece,
  openConsultationBriefModal,
  liteInquiryPrefillForPiece,
  setKontaktPrefillSnippet,
  setView,
  pieceRequiresConsultationFirst,
  t,
}: {
  pageTitle: string;
  sections: MaisonLayoutSection[];
  masterpiecesById: Map<number, Masterpiece>;
  onNavigateView: (view: string) => void;
  onOpenPiece: (p: Masterpiece) => void;
  openConsultationBriefModal: (p: Masterpiece) => void;
  liteInquiryPrefillForPiece: (p: Masterpiece) => string;
  setKontaktPrefillSnippet: (s: string | null) => void;
  setView: (v: string) => void;
  pieceRequiresConsultationFirst: (p: Masterpiece) => boolean;
  t: TFn;
}) {
  const renderPieceCard = (piece: Masterpiece, compact?: boolean) => {
    const consultFirst = pieceRequiresConsultationFirst(piece);
    const img = piece.image_url || `https://picsum.photos/seed/${piece.id}/800/800`;
    return (
      <div
        key={piece.id}
        className={`group cursor-pointer ${compact ? "" : "max-w-md mx-auto"}`}
        onClick={() => onOpenPiece(piece)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onOpenPiece(piece)}
      >
        <div
          className={`relative overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-zinc-900/40 ${
            compact ? "aspect-[4/5]" : "aspect-square"
          }`}
        >
          <img src={img} alt={piece.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-left">
            <p className="font-serif italic text-lg text-[#F5F5F5] tracking-wide">{piece.title}</p>
            {piece.serial_id && <p className="text-[10px] uppercase tracking-[0.2em] text-[#AAAAAA] mt-1">{piece.serial_id}</p>}
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
          {consultFirst ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openConsultationBriefModal(piece);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#C6A15B] px-8 py-3 text-sm font-medium text-black transition hover:bg-[#d4b068]"
              >
                <MessageCircle className="h-4 w-4" />
                {t("consultation_piece_chat_cta")}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setKontaktPrefillSnippet(liteInquiryPrefillForPiece(piece));
                  setView("kontakt");
                }}
                className="inline-flex items-center justify-center rounded-full border border-[var(--border-soft)] px-6 py-2.5 text-xs text-[#AAAAAA] transition hover:border-[#C6A15B]/35 hover:text-[#F5F5F5]"
              >
                {t("cta.lite_inquiry")}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenPiece(piece);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#C6A15B]/40 px-8 py-3 text-sm text-[#C6A15B] transition hover:bg-[#C6A15B]/10"
            >
              {t("marketplace.cta_purchase_request")}
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="maison-curated space-y-24 pb-32 pt-4">
      {pageTitle && (
        <header className="luxury-container border-b border-[var(--border-soft)] pb-10">
          <h1 className="luxury-display text-3xl tracking-[0.12em] text-[#F5F5F5] sm:text-4xl">{pageTitle}</h1>
        </header>
      )}

      {sections.map((sec) => {
        const c = sec.config || {};
        switch (sec.section_type) {
          case "hero": {
            const bg = str(c.imageUrl);
            return (
              <section key={sec.id} className="luxury-container">
                <div
                  className="relative min-h-[56vh] overflow-hidden rounded-3xl border border-[var(--border-soft)]"
                  style={
                    bg
                      ? { backgroundImage: `url(${bg})`, backgroundSize: "cover", backgroundPosition: "center" }
                      : { background: "linear-gradient(145deg, #1a1510 0%, #0a0a0a 50%, #12100c 100%)" }
                  }
                >
                  <div className="absolute inset-0 bg-black/45" />
                  <div className="relative flex min-h-[56vh] flex-col items-center justify-center px-8 py-20 text-center">
                    <h2 className="max-w-3xl font-serif text-4xl italic leading-tight text-[#F5F5F5] sm:text-5xl">{str(c.title)}</h2>
                    {str(c.subtitle) && (
                      <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-[#CCCCCC]">{str(c.subtitle)}</p>
                    )}
                    {str(c.ctaLabel) && str(c.ctaView) && (
                      <button
                        type="button"
                        onClick={() => onNavigateView(str(c.ctaView))}
                        className="mt-12 rounded-full bg-[#C6A15B] px-10 py-4 text-sm font-medium text-black transition hover:bg-[#d4b068]"
                      >
                        {str(c.ctaLabel)}
                      </button>
                    )}
                  </div>
                </div>
              </section>
            );
          }
          case "category_block":
            return (
              <section key={sec.id} className="luxury-container text-center">
                <p className="text-[10px] uppercase tracking-[0.35em] text-[#C6A15B]/90">{t("maison.section_category")}</p>
                <h3 className="mt-4 font-serif text-3xl italic text-[#F5F5F5] sm:text-4xl">{str(c.heading)}</h3>
                {str(c.subheading) && <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-[#AAAAAA]">{str(c.subheading)}</p>}
                {str(c.ctaLabel) && str(c.ctaView) && (
                  <button
                    type="button"
                    onClick={() => onNavigateView(str(c.ctaView))}
                    className="mt-10 rounded-full border border-[#C6A15B]/50 px-8 py-3 text-sm text-[#C6A15B] transition hover:bg-[#C6A15B]/10"
                  >
                    {str(c.ctaLabel)}
                  </button>
                )}
              </section>
            );
          case "product_row": {
            const pids = idsArr(c.productIds, 6);
            const pieces = pids.map((id) => masterpiecesById.get(id)).filter(Boolean) as Masterpiece[];
            return (
              <section key={sec.id} className="luxury-container">
                {(str(c.title) || str(c.subtitle)) && (
                  <div className="mb-14 max-w-2xl">
                    {str(c.title) && <h3 className="font-serif text-3xl italic text-[#F5F5F5]">{str(c.title)}</h3>}
                    {str(c.subtitle) && <p className="mt-3 text-[15px] leading-relaxed text-[#888888]">{str(c.subtitle)}</p>}
                  </div>
                )}
                {pieces.length === 0 ? (
                  <p className="text-sm text-zinc-600">{t("maison.no_pieces_section")}</p>
                ) : (
                  <div className="grid grid-cols-1 gap-16 md:grid-cols-2 lg:grid-cols-3">
                    {pieces.map((p) => (
                      <div key={p.id}>{renderPieceCard(p, true)}</div>
                    ))}
                  </div>
                )}
              </section>
            );
          }
          case "featured_piece": {
            const pid = num(c.productId);
            const piece = pid ? masterpiecesById.get(pid) : undefined;
            return (
              <section key={sec.id} className="luxury-container">
                <div className="mx-auto max-w-4xl text-center">
                  {str(c.headline) && (
                    <h3 className="font-serif text-3xl italic text-[#F5F5F5] sm:text-4xl">{str(c.headline)}</h3>
                  )}
                  {str(c.subline) && <p className="mt-4 text-[15px] text-[#AAAAAA]">{str(c.subline)}</p>}
                </div>
                {piece ? (
                  <div className="mt-16">{renderPieceCard(piece, false)}</div>
                ) : (
                  <p className="mt-12 text-center text-sm text-zinc-600">{t("maison.featured_placeholder")}</p>
                )}
              </section>
            );
          }
          case "split": {
            const side = str(c.imageSide) === "right" ? "right" : "left";
            const pids = idsArr(c.productIds, 6);
            const pieces = pids.map((id) => masterpiecesById.get(id)).filter(Boolean) as Masterpiece[];
            const img = str(c.imageUrl);
            const textBlock = (
              <div className="flex flex-col justify-center py-8">
                <h3 className="font-serif text-3xl italic text-[#F5F5F5]">{str(c.title)}</h3>
                <div className="mt-6 whitespace-pre-line text-[15px] leading-[1.85] text-[#AAAAAA]">{str(c.body)}</div>
              </div>
            );
            const imgBlock = (
              <div className="relative min-h-[320px] overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-zinc-900/50 lg:min-h-[420px]">
                {img ? (
                  <img src={img} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full min-h-[320px] items-center justify-center text-zinc-600">{t("maison.split_image_placeholder")}</div>
                )}
              </div>
            );
            return (
              <section key={sec.id} className="luxury-container">
                <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
                  {side === "left" ? (
                    <>
                      {imgBlock}
                      {textBlock}
                    </>
                  ) : (
                    <>
                      {textBlock}
                      {imgBlock}
                    </>
                  )}
                </div>
                {pieces.length > 0 && (
                  <div className="mt-20 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
                    {pieces.map((p) => (
                      <div key={p.id}>{renderPieceCard(p, true)}</div>
                    ))}
                  </div>
                )}
              </section>
            );
          }
          case "editorial": {
            const align = str(c.align) === "left" ? "text-left" : "text-center";
            return (
              <section key={sec.id} className="luxury-container">
                <div className={`mx-auto max-w-3xl ${align}`}>
                  {str(c.headline) && (
                    <h3 className="font-serif text-2xl italic text-[#E8E8E8] sm:text-3xl">{str(c.headline)}</h3>
                  )}
                  <div className="mt-8 whitespace-pre-line text-[16px] leading-[1.9] text-[#999999]">{str(c.body)}</div>
                </div>
              </section>
            );
          }
          default:
            return null;
        }
      })}

      {sections.length === 0 && (
        <div className="luxury-container py-24 text-center text-[#666666]">
          <p>{t("maison.empty_page")}</p>
        </div>
      )}
    </div>
  );
}
