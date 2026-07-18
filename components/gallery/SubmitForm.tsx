'use client';

/**
 * SubmitForm — community-gallery submission. The visitor picks a frame/image
 * of their render; we downscale it CLIENT-SIDE into a small JPEG data URI
 * (the durable visual we keep) and send it with name/title/tool + optional
 * link. Everything lands in the PENDING queue: nothing appears publicly until
 * the owner approves it.
 */
import { useRef, useState } from 'react';
import { ImagePlus, Check, AlertTriangle } from 'lucide-react';
import { GALLERY_CATEGORIES, type GalleryCategoryId } from '@/lib/galleryCategories';

/** Legacy `tool` value kept on records for back-compat with older entries. */
function legacyToolFor(category: GalleryCategoryId): string {
  return category === 'cma-director-studio' ? 'director-studio' : 'video';
}

/** Downscale an image file to a ≤640px JPEG data URI (~<200KB). */
async function makeSubmissionThumb(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('unreadable image'));
      el.src = url;
    });
    const scale = Math.min(1, 640 / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function SubmitForm() {
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<GalleryCategoryId>('cma-director-studio');
  const [link, setLink] = useState('');
  const [thumb, setThumb] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function pick(file: File | undefined) {
    if (!file || !file.type.startsWith('image/')) return;
    setError('');
    try {
      setThumb(await makeSubmissionThumb(file));
    } catch {
      setError('That image could not be read. Try a JPEG or PNG.');
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === 'busy' || state === 'done') return;
    if (!thumb) {
      setError('Add a frame or image of your render.');
      return;
    }
    setState('busy');
    setError('');
    try {
      const res = await fetch('/api/gallery/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          title,
          category,
          tool: legacyToolFor(category),
          thumb,
          url: link.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) setState('done');
      else {
        setState('error');
        setError(data.error ?? 'Submission failed. Try again.');
      }
    } catch {
      setState('error');
      setError('Could not reach the server. Try again.');
    }
  }

  if (state === 'done') {
    return (
      <div className="glass glass-gold rounded-2xl p-8 text-center">
        <p className="inline-flex items-center gap-2 text-[17px] font-semibold text-[#e7cfa3]">
          <Check size={18} /> Submitted for review.
        </p>
        <p className="mx-auto mt-3 max-w-md text-[13.5px] leading-relaxed text-[#8b909e]">
          Thank you. Every submission is reviewed by the studio before it appears — if yours is approved, you&apos;ll
          find it on the homepage community wall.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="glass glass-gold flex flex-col gap-4 rounded-2xl p-5">
      {/* the frame we keep */}
      <div>
        <div className="mb-1.5 font-mono text-[9px] tracking-[0.18em] text-[#8b909e] uppercase">A frame of your render</div>
        {thumb ? (
          <div className="relative overflow-hidden rounded-xl border border-[#bc9863]/25">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumb} alt="Submission preview" className="block max-h-64 w-full object-cover" />
            <button
              type="button"
              onClick={() => {
                setThumb('');
                if (fileRef.current) fileRef.current.value = '';
              }}
              className="absolute right-2 top-2 cursor-pointer rounded-lg bg-black/70 px-2.5 py-1 font-mono text-[10px] text-[#c7c2b8] transition hover:text-red-400"
            >
              Replace
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="grid w-full cursor-pointer place-items-center rounded-xl border border-dashed border-white/15 bg-black/30 px-4 py-10 transition hover:border-[#bc9863]/50"
          >
            <span className="flex flex-col items-center gap-2">
              <ImagePlus size={22} className="text-[#bc9863]" />
              <span className="text-[13.5px] font-medium text-[#c7c2b8]">Choose an image or exported frame</span>
              <span className="font-mono text-[10px] text-[#8b909e]">Downscaled on your device before upload</span>
            </span>
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} aria-label="Render frame" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="sub-name" className="mb-1.5 block font-mono text-[9px] tracking-[0.18em] text-[#8b909e] uppercase">
            Your name or handle
          </label>
          <input
            id="sub-name"
            type="text"
            required
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ava Chen"
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-[14px] text-[#f4efe6] outline-none transition focus:border-[#bc9863] placeholder:text-[#8b909e]"
          />
        </div>
        <div>
          <label htmlFor="sub-title" className="mb-1.5 block font-mono text-[9px] tracking-[0.18em] text-[#8b909e] uppercase">
            Title
          </label>
          <input
            id="sub-title"
            type="text"
            required
            maxLength={140}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Dawn over the sunken cathedral"
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-[14px] text-[#f4efe6] outline-none transition focus:border-[#bc9863] placeholder:text-[#8b909e]"
          />
        </div>
      </div>

      <div>
        <div className="mb-1.5 font-mono text-[9px] tracking-[0.18em] text-[#8b909e] uppercase">
          Model category · file it where it was made
        </div>
        <div className="flex flex-wrap gap-1.5">
          {GALLERY_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              aria-pressed={category === c.id}
              className={`inline-flex min-h-[40px] cursor-pointer items-center rounded-lg border px-3 py-1.5 font-mono text-[11px] transition sm:min-h-0 ${
                category === c.id ? 'border-[#bc9863] bg-[#bc9863]/12 text-[#e7cfa3]' : 'border-white/8 text-[#8b8f99] hover:border-[#bc9863]/40'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-[#8b909e]">
          The wall is organized by model. Your piece appears in this category once approved.
        </p>
      </div>

      <div>
        <label htmlFor="sub-link" className="mb-1.5 block font-mono text-[9px] tracking-[0.18em] text-[#8b909e] uppercase">
          Link to the full render · optional
        </label>
        <input
          id="sub-link"
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://…"
          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 font-mono text-[12.5px] text-[#f4efe6] outline-none transition focus:border-[#bc9863] placeholder:text-[#8b909e]"
        />
      </div>

      <button
        type="submit"
        disabled={state === 'busy'}
        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-5 py-3.5 text-[15px] font-semibold text-black transition hover:brightness-105 disabled:opacity-50"
      >
        {state === 'busy' ? 'Submitting…' : 'Submit for review'}
      </button>
      <p className="text-center text-[11.5px] leading-relaxed text-[#8b909e]">
        Nothing appears publicly until the studio approves it. Submit only work you made and have the right to share.
      </p>
      {error && (
        <p role="alert" className="flex items-center justify-center gap-2 font-mono text-[11px] text-red-400">
          <AlertTriangle size={12} /> {error}
        </p>
      )}
    </form>
  );
}
