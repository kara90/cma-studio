'use client';

/**
 * GenerationStrip — quick access to a user's recent work. Up to 6 autoplay
 * (muted) mini clips/stills under the main scope. Clicking a mini enlarges it
 * in a lightbox so it can be visualised; clicking away, scrolling, or Esc
 * shrinks it back. A "See all my work" gallery holds everything generated on
 * this account, and any item can be loaded back into the main scope.
 */
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutGrid, X, ExternalLink, Download, Clapperboard, ArrowDownToLine, TriangleAlert } from 'lucide-react';
import { useGenerations, type Generation } from '@/lib/generationStore';
import { BorderRotate } from '@/components/ui/animated-gradient-border';
import { downloadRender, renderFilename } from '@/lib/download';

/** Full-quality asset (used only in the enlarged lightbox). */
function Media({ g, className, controls = false }: { g: Generation; className?: string; controls?: boolean }) {
  if (g.output === 'image') {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={g.url} alt="" className={className} />;
  }
  return <video src={g.url} muted loop autoPlay playsInline preload="metadata" controls={controls} className={className} />;
}

/**
 * Light preview for the strip/gallery — shows the tiny self-contained thumbnail
 * so we don't re-download full videos/images. Falls back to the raw asset only
 * if no thumb could be generated (keeps working exactly like before).
 */
function Poster({ g, className }: { g: Generation; className?: string }) {
  if (g.thumb) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={g.thumb} alt="" className={className} />;
  }
  return <Media g={g} className={className} />;
}

export function GenerationStrip({ onPick }: { onPick: (g: Generation) => void }) {
  const items = useGenerations();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Generation | null>(null);
  const recent = items.slice(0, 3);

  // Close the enlarged preview on scroll / wheel / Esc.
  useEffect(() => {
    if (!expanded) return;
    const close = () => setExpanded(null);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('wheel', close, { passive: true });
    window.addEventListener('scroll', close, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('wheel', close);
      window.removeEventListener('scroll', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [expanded]);

  return (
    <div>
      {/* always-visible, unmissable storage warning */}
      <div className="mb-3 rounded-xl border border-amber-400/45 bg-amber-400/[0.08] px-4 py-3">
        <div className="flex items-start gap-2.5">
          <TriangleAlert size={16} className="mt-0.5 shrink-0 text-amber-400" />
          <p className="text-[12px] leading-relaxed text-amber-100/90">
            <span className="font-semibold text-amber-300">Download your renders from Fal within 7 days.</span>{' '}
            Fal.ai keeps each generated file for about 7 days, then{' '}
            <span className="font-semibold text-amber-300">permanently deletes it</span> — it cannot be recovered. The
            previews below are only a light reminder; the full quality is <span className="font-semibold">not stored here</span>.
            Open each render and save it from Fal to keep it.
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-white/6 bg-black/30 px-3 py-3 text-center font-mono text-[10.5px] text-[#8b909e]">
          Your last renders will appear here for quick access.
        </p>
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-[0.2em] text-[#8b8f99] uppercase">Recent work</span>
            <button
              onClick={() => setOpen(true)}
              className="inline-flex cursor-pointer items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] text-[#bc9863] uppercase transition hover:text-[#e7cfa3]"
            >
              <LayoutGrid size={12} /> See all my work · {items.length}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {recent.map((g) => (
              <button
                key={g.id}
                onClick={() => setExpanded(g)}
                className="group relative aspect-video overflow-hidden rounded-lg border border-[#bc9863]/30 bg-black transition hover:border-[#bc9863]/60"
                title={g.prompt}
              >
                <Poster g={g} className="h-full w-full object-cover" />
                <span className="pointer-events-none absolute inset-0 bg-black/0 transition group-hover:bg-black/20" />
              </button>
            ))}
          </div>
        </>
      )}

      {/* click-to-enlarge lightbox */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpanded(null)}
          >
            <motion.div
              className="relative w-full max-w-4xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              <BorderRotate animationSpeed={7} borderWidth={2} borderRadius={18} backgroundColor="#000000" className="shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]">
                <div className="overflow-hidden rounded-[16px]">
                  <Media g={expanded} controls className="max-h-[72vh] w-full bg-black object-contain" />
                </div>
              </BorderRotate>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="line-clamp-1 flex-1 text-[12px] text-[#c7c2b8]">{expanded.prompt}</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadRender(expanded.url, renderFilename(expanded.prompt, expanded.output, expanded.model))}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-3.5 py-2 text-[12px] font-semibold text-black transition hover:brightness-105"
                    title="Save the full file to your device"
                  >
                    <Download size={13} /> Download
                  </button>
                  <button
                    onClick={() => { onPick(expanded); setExpanded(null); }}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#bc9863]/40 px-3.5 py-2 text-[12px] font-semibold text-[#e7cfa3] transition hover:bg-[#bc9863]/10"
                  >
                    <ArrowDownToLine size={13} /> Load into scope
                  </button>
                  <a
                    href={expanded.url}
                    target="_blank"
                    rel="noopener"
                    className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-[#8b8f99] transition hover:text-[#e7cfa3]"
                    title="Open the full file on your Fal.ai account"
                  >
                    <ExternalLink size={15} />
                  </a>
                  <button onClick={() => setExpanded(null)} aria-label="Close" className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg border border-white/10 text-[#8b8f99] transition hover:text-[#e7cfa3]">
                    <X size={15} />
                  </button>
                </div>
              </div>
              <p className="mt-2 flex items-center gap-1.5 font-mono text-[10.5px] text-amber-300/80">
                <TriangleAlert size={12} className="shrink-0" /> Fal deletes this after ~7 days — download it now to keep it.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* full gallery */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="glass glass-gold relative max-h-[85vh] w-full max-w-5xl overflow-hidden rounded-2xl"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <Clapperboard size={18} className="text-[#bc9863]" />
                  <span className="font-[family-name:var(--font-sora)] text-[15px] font-semibold">My work</span>
                  <span className="font-mono text-[11px] text-[#8b909e]">{items.length} generations</span>
                </div>
                <button onClick={() => setOpen(false)} aria-label="Close" className="cursor-pointer text-[#8b8f99] transition hover:text-[#e7cfa3]">
                  <X size={20} />
                </button>
              </div>
              <div className="max-h-[calc(85vh-64px)] overflow-y-auto p-5">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {items.map((g) => (
                    <div key={g.id} className="group overflow-hidden rounded-xl border border-[#bc9863]/25 bg-black">
                      <button className="relative block aspect-video w-full" onClick={() => { setOpen(false); setExpanded(g); }} aria-label="Enlarge">
                        <Poster g={g} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); downloadRender(g.url, renderFilename(g.prompt, g.output, g.model)); }}
                          className="absolute right-2 top-2 grid h-8 w-8 cursor-pointer place-items-center rounded-lg bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                          title="Download"
                        >
                          <Download size={15} />
                        </button>
                      </button>
                      <div className="p-2.5">
                        <p className="line-clamp-2 text-[11px] leading-snug text-[#c7c2b8]">{g.prompt}</p>
                        <p className="mt-1 font-mono text-[9px] tracking-[0.08em] text-[#8b909e] uppercase">{g.model}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
