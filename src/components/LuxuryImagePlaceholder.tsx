import React from "react";

export function normalizeImagePlaceholderLabel(label: string): string {
  const s = label.trim();
  if (s.startsWith("[") && s.endsWith("]")) return s.slice(1, -1);
  return s;
}

type Props = {
  label: string;
  /** framed: eigenes Seitenverhältnis (Standard). fill: Eltern braucht position relative + Höhe */
  mode?: "framed" | "fill";
  aspectClass?: string;
  roundedClass?: string;
  className?: string;
  compact?: boolean;
};

export function LuxuryImagePlaceholder({
  label,
  mode = "framed",
  aspectClass = "aspect-[16/9]",
  roundedClass = "rounded-3xl",
  className = "",
  compact = false,
}: Props) {
  const token = normalizeImagePlaceholderLabel(label);
  const frame =
    mode === "fill"
      ? "absolute inset-0 h-full w-full min-h-[80px]"
      : `w-full min-h-[120px] ${aspectClass}`;

  return (
    <div
      role="img"
      aria-label={token}
      className={`relative isolate overflow-hidden border border-amber-500/35 bg-zinc-950 ${roundedClass} ${frame} ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-zinc-800/55 via-zinc-950 to-black" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_35%,rgba(212,175,55,0.1),transparent_65%)]" />
      <div className="pointer-events-none absolute inset-0 skeleton opacity-40" />
      <div className="absolute inset-0 flex items-center justify-center px-2 py-4">
        <span
          className={`max-w-[95%] text-center font-mono uppercase leading-tight tracking-[0.2em] text-white/55 ${
            compact ? "text-[6px] sm:text-[7px]" : "text-[9px] sm:text-[11px]"
          }`}
        >
          {token}
        </span>
      </div>
    </div>
  );
}
