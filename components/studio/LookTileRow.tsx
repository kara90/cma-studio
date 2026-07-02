'use client';

/**
 * LookTileRow, a visual replacement for the plain ChipRow on the Style and
 * Lighting axes. Same mono micro-label on top, but each option is a tile with
 * an aspect-video media area: a short muted clip when one is wired up in
 * lib/lookPreviews.ts, otherwise a crafted gradient poster that evokes the
 * look. A tiny "sample" chip marks poster-only tiles so the grid reads honest
 * without ever saying placeholder to the end user.
 */

import { useReducedMotion } from 'framer-motion';
import type { LookPreview } from '@/lib/lookPreviews';

/** Neutral dark gradient shown when an option id has no preview entry. */
const FALLBACK_POSTER =
  'linear-gradient(135deg, #14161a 0%, #1e2126 55%, #0b0c0f 100%)';

export function LookTileRow({
  label,
  options,
  previews,
  value,
  onChange,
}: {
  label: string;
  options: readonly { id: string; label: string; hint?: string }[];
  previews: Record<string, LookPreview>;
  value: string;
  onChange: (id: string) => void;
}) {
  const reduce = useReducedMotion();

  return (
    <div>
      <div className="mb-1.5 font-mono text-[9px] tracking-[0.18em] text-[#8b909e] uppercase">
        {label}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {options.map((o) => {
          const preview: LookPreview | undefined = previews[o.id];
          const clip = preview?.clip;
          const poster = preview?.poster ?? FALLBACK_POSTER;
          const active = value === o.id;
          const playClip = Boolean(clip) && !reduce;

          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(o.id)}
              title={o.hint}
              aria-pressed={active}
              className={`group min-h-[44px] cursor-pointer overflow-hidden rounded-xl border text-left transition ${
                active
                  ? 'border-[#bc9863] ring-1 ring-[#bc9863]/50'
                  : 'border-white/8 hover:border-[#bc9863]/40'
              }`}
            >
              <div className="relative aspect-video w-full">
                {playClip ? (
                  <video
                    src={clip}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="h-full w-full"
                    style={{ background: poster }}
                  />
                )}
                {!clip && (
                  <span className="absolute top-1.5 right-1.5 rounded border border-white/10 bg-black/55 px-1.5 py-0.5 font-mono text-[9px] tracking-[0.14em] text-[#8b8f99] uppercase">
                    sample
                  </span>
                )}
              </div>
              <div
                className={`px-2 py-1.5 font-mono text-[11px] transition ${
                  active ? 'text-[#e7cfa3]' : 'text-[#8b8f99] group-hover:text-[#c9cdd6]'
                }`}
              >
                {o.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
