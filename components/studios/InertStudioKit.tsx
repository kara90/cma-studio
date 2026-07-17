'use client';

/**
 * InertStudioKit — shared building blocks for the INERT preview studios
 * (CMA Marketing Studio, CMA Real Estate Studio).
 *
 * HARD GUARANTEE OF THIS PASS: nothing in this file performs any network
 * request. No fetch, no upload, no render, no payment. Uploads preview via a
 * local object URL that never leaves the visitor's device. The render bar is
 * a disabled control that states the studio is a preview.
 *
 * The Director Studio does NOT use this kit — its console
 * (components/studio/StudioConsole.tsx) is untouched.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ImagePlus, X, Lock, Wand2 } from 'lucide-react';

export const CARD = 'glass glass-gold rounded-2xl';

/** A card section with the same Sora heading language as the Director console. */
export function StudioCard({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <div className={`${CARD} p-4`}>
      <h3 className="mb-1 border-b border-[#bc9863]/12 pb-2 font-[family-name:var(--font-sora)] text-[13px] font-semibold tracking-[0.01em] text-[#e7cfa3]">
        {title}
      </h3>
      {sub && <p className="mb-3 pt-1 text-[11.5px] leading-relaxed text-[#8b909e]">{sub}</p>}
      <div className={`flex flex-col gap-4 ${sub ? '' : 'pt-2'}`}>{children}</div>
    </div>
  );
}

/** A labelled row of pill options (same look as the Director console's chips). */
export function Chips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { id: T; label: string; hint?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 font-mono text-[9px] tracking-[0.18em] text-[#8b909e] uppercase">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            title={o.hint}
            aria-pressed={value === o.id}
            className={`inline-flex min-h-[40px] cursor-pointer items-center justify-center rounded-lg border px-3 py-1.5 font-mono text-[11px] transition sm:min-h-0 ${
              value === o.id
                ? 'border-[#bc9863] bg-[#bc9863]/12 text-[#e7cfa3]'
                : 'border-white/8 text-[#8b8f99] hover:border-[#bc9863]/40'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Labelled single-line text input, styled like the console inputs. */
export function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <div className="mb-1.5 font-mono text-[9px] tracking-[0.18em] text-[#8b909e] uppercase">{label}</div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-[14px] text-[#f4efe6] outline-none transition focus:border-[#bc9863] placeholder:text-[#8b909e]"
      />
    </div>
  );
}

/**
 * Local-only image drop tile. The picked file is previewed with an object URL
 * and NEVER uploaded anywhere in this pass (rendering is inert).
 */
export function UploadTile({ label, note }: { label: string; note?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Release the object URL when replaced/cleared/unmounted.
  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  function pick(file: File | undefined) {
    if (!file || !file.type.startsWith('image/')) return;
    setUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setName(file.name);
  }

  return (
    <div>
      <div className="mb-1.5 font-mono text-[9px] tracking-[0.18em] text-[#8b909e] uppercase">{label}</div>
      {url ? (
        <div className="relative overflow-hidden rounded-xl border border-[#bc9863]/25">
          {/* local object URL preview — stays on the visitor's device */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={`${label} preview`} className="block max-h-52 w-full object-cover" />
          <div className="flex items-center justify-between gap-2 bg-black/60 px-3 py-2">
            <span className="truncate font-mono text-[10px] text-[#c7c2b8]">{name}</span>
            <button
              type="button"
              onClick={() => {
                setUrl(null);
                setName('');
                if (inputRef.current) inputRef.current.value = '';
              }}
              aria-label={`Remove ${label}`}
              className="inline-flex cursor-pointer items-center gap-1 font-mono text-[10px] text-[#8b8f99] transition hover:text-red-400"
            >
              <X size={12} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="grid w-full cursor-pointer place-items-center rounded-xl border border-dashed border-white/15 bg-black/30 px-4 py-8 text-center transition hover:border-[#bc9863]/50"
        >
          <span className="flex flex-col items-center gap-2">
            <ImagePlus size={20} className="text-[#bc9863]" />
            <span className="text-[13px] font-medium text-[#c7c2b8]">Choose an image</span>
            <span className="font-mono text-[10px] text-[#8b909e]">Stays on your device in this preview</span>
          </span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
        aria-label={label}
      />
      {note && <p className="mt-1.5 text-[11px] leading-relaxed text-[#8b909e]">{note}</p>}
    </div>
  );
}

/**
 * The INERT render bar. A deliberately disabled control: this studio cannot
 * render and cannot charge anything until Sebastien wires its dedicated skill.
 */
export function InertRenderBar({ studio }: { studio: string }) {
  return (
    <div className={`${CARD} p-4`}>
      <button
        type="button"
        disabled
        aria-disabled="true"
        className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-[#bc9863]/30 bg-[#bc9863]/8 px-5 py-3.5 text-[15px] font-semibold text-[#bc9863] opacity-80"
      >
        <Lock size={16} /> Rendering opens when {studio} launches
      </button>
      <p className="mt-2.5 text-center text-[12px] leading-relaxed text-[#8b909e]">
        This studio is a preview. Explore every control — nothing renders, nothing is charged, and your images stay on
        your device.
      </p>
      {/* Section C seam: the dedicated skill for this studio plugs in server-side
          later (lib/skills/*). The Director Studio's engine is not used here. */}
      <p className="mt-1 flex items-center justify-center gap-1.5 text-center font-mono text-[10px] tracking-[0.06em] text-[#8b909e]">
        <Wand2 size={11} className="text-[#bc9863]" /> Engine hookup pending: this studio gets its own dedicated CMA
        skill.
      </p>
    </div>
  );
}
