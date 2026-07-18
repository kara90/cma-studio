'use client';

/**
 * GenerationStrip — quick access to a user's work. Up to 3 autoplay (muted)
 * mini clips/stills under the main scope, plus the "My files" library.
 *
 * The library is SERVER-BACKED: /api/files lists everything stored in CMA
 * storage for this account (kept for the plan's retention window, 30 days to a
 * year by tier), so files follow the user across devices. When storage is
 * unreachable (signed out, local dev without bindings) it falls back to this
 * device's local history exactly as before.
 */
import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutGrid, X, ExternalLink, Download, Clapperboard, ArrowDownToLine, TriangleAlert, AudioLines, Film, Image as ImageIcon, Clock } from 'lucide-react';
import { useGenerations, type Generation } from '@/lib/generationStore';
import { BorderRotate } from '@/components/ui/animated-gradient-border';
import { downloadRender, renderFilename } from '@/lib/download';
import type { FilesResult, StoredFile } from '@/lib/vcpTypes';

/** Full-quality asset (used only in the enlarged lightbox). */
function Media({ g, className, controls = false }: { g: Generation; className?: string; controls?: boolean }) {
  if (g.output === 'image') {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={g.url} alt="" className={className} />;
  }
  if (g.output === 'audio') {
    return (
      <div className="flex min-h-[220px] w-full flex-col items-center justify-center gap-4 bg-[radial-gradient(70%_90%_at_50%_30%,rgba(188,152,99,0.12),#05060a)] px-8 py-10">
        <span className="grid h-14 w-14 place-items-center rounded-full border border-[#bc9863]/35 bg-[#bc9863]/10 text-[#e7cfa3]">
          <AudioLines size={24} />
        </span>
        <audio src={g.url} controls preload="metadata" className="w-full max-w-md" />
      </div>
    );
  }
  return <video src={g.url} muted loop autoPlay playsInline preload="metadata" controls={controls} className={className} />;
}

/**
 * Light preview for the strip/gallery — shows the tiny self-contained thumbnail
 * so we don't re-download full videos/images. Falls back to a glyph tile.
 */
function Poster({ g, className }: { g: Generation; className?: string }) {
  if (g.thumb) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={g.thumb} alt="" className={className} />;
  }
  if (g.output === 'audio') {
    return (
      <div className={`grid place-items-center bg-[radial-gradient(70%_90%_at_50%_30%,rgba(188,152,99,0.14),#0a0b10)] text-[#bc9863] ${className ?? ''}`}>
        <AudioLines size={22} />
      </div>
    );
  }
  return <Media g={g} className={className} />;
}

/** Glyph for a server-stored file (no thumbnails stored server-side — light tiles). */
function KindGlyph({ output }: { output: StoredFile['output'] }) {
  const Icon = output === 'audio' ? AudioLines : output === 'image' ? ImageIcon : Film;
  return (
    <div className="grid aspect-video w-full place-items-center bg-[radial-gradient(70%_90%_at_50%_30%,rgba(188,152,99,0.12),#0a0b10)] text-[#bc9863]">
      <Icon size={24} />
    </div>
  );
}

export function GenerationStrip({ onPick, skipServer = false }: { onPick: (g: Generation) => void; skipServer?: boolean }) {
  const items = useGenerations();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Generation | null>(null);
  const [server, setServer] = useState<{ files: StoredFile[]; retentionDays: number } | null>(null);
  const recent = items.slice(0, 3);

  // Load the account library (fails quietly → device-local fallback).
  // skipServer: locked marketing embeds (e.g. the homepage console) pass true so
  // anonymous visitors never fire a guaranteed-401 /api/files request.
  const loadFiles = useCallback(async () => {
    if (skipServer) return;
    try {
      const res = await fetch('/api/files');
      const data: FilesResult = await res.json();
      if (data.ok && data.files && !data.storageOffline) {
        setServer({ files: data.files, retentionDays: data.retentionDays ?? 30 });
      }
    } catch {
      /* signed out / storage offline — local history still works */
    }
  }, [skipServer]);
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

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

  const openStored = (f: StoredFile) => {
    setOpen(false);
    setExpanded({
      id: f.id,
      url: `/api/files/${f.id}`,
      output: f.output,
      prompt: f.note || f.model,
      model: f.model,
      createdAt: Date.parse(f.createdAt),
    });
  };

  const libraryCount = server ? server.files.length : items.length;

  return (
    <div>
      {/* storage banner — reflects what is actually true for this session */}
      {server ? (
        <div className="mb-3 rounded-xl border border-[#bc9863]/30 bg-[#bc9863]/[0.06] px-4 py-3">
          <div className="flex items-start gap-2.5">
            <Clock size={15} className="mt-0.5 shrink-0 text-[#bc9863]" />
            <p className="text-[12px] leading-relaxed text-[#c7c2b8]">
              <span className="font-semibold text-[#e7cfa3]">Every finished render is saved to your CMA library</span>{' '}
              and kept for your plan&apos;s storage window (about {server.retentionDays} days on your current plan, fair use).
              Download anything you want to keep offline for good.
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-3 rounded-xl border border-amber-400/45 bg-amber-400/[0.08] px-4 py-3">
          <div className="flex items-start gap-2.5">
            <TriangleAlert size={16} className="mt-0.5 shrink-0 text-amber-400" />
            <p className="text-[12px] leading-relaxed text-amber-100/90">
              <span className="font-semibold text-amber-300">Sign in so your renders are saved to your CMA library.</span>{' '}
              Without it, Fal keeps each file for about 7 days and then{' '}
              <span className="font-semibold text-amber-300">permanently deletes it</span>. On a plan, finished renders
              are stored for 30 days to a year, by tier.
            </p>
          </div>
        </div>
      )}

      {items.length === 0 && libraryCount === 0 ? (
        <p className="rounded-lg border border-white/6 bg-black/30 px-3 py-3 text-center font-mono text-[10.5px] text-[#8b909e]">
          Your last renders will appear here for quick access.
        </p>
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-[0.2em] text-[#8b8f99] uppercase">Recent work</span>
            <button
              onClick={() => { loadFiles(); setOpen(true); }}
              className="inline-flex cursor-pointer items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] text-[#bc9863] uppercase transition hover:text-[#e7cfa3]"
            >
              <LayoutGrid size={12} /> My files · {libraryCount}
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
                    title="Open the full file"
                  >
                    <ExternalLink size={15} />
                  </a>
                  <button onClick={() => setExpanded(null)} aria-label="Close" className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg border border-white/10 text-[#8b8f99] transition hover:text-[#e7cfa3]">
                    <X size={15} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* full library */}
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
                  <span className="font-[family-name:var(--font-sora)] text-[15px] font-semibold">My files</span>
                  <span className="font-mono text-[11px] text-[#8b909e]">
                    {server ? `${server.files.length} stored · kept about ${server.retentionDays} days` : `${items.length} on this device`}
                  </span>
                </div>
                <button onClick={() => setOpen(false)} aria-label="Close" className="cursor-pointer text-[#8b8f99] transition hover:text-[#e7cfa3]">
                  <X size={20} />
                </button>
              </div>
              <div className="max-h-[calc(85vh-64px)] overflow-y-auto p-5">
                {server ? (
                  server.files.length === 0 ? (
                    <p className="py-10 text-center font-mono text-[11px] text-[#8b909e]">
                      Nothing stored yet. Finished renders land here automatically.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {server.files.map((f) => (
                        <div key={f.id} className="group overflow-hidden rounded-xl border border-[#bc9863]/25 bg-black">
                          {/* no <a> inside <button> (invalid nesting) — same
                              span[role=button] pattern as the local grid below */}
                          <button className="relative block w-full cursor-pointer" onClick={() => openStored(f)} aria-label="Open">
                            <KindGlyph output={f.output} />
                            <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[8px] tracking-[0.1em] text-[#e7cfa3] uppercase">
                              {f.daysLeft}d left
                            </span>
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => { e.stopPropagation(); window.open(`/api/files/${f.id}?download=1`, '_blank'); }}
                              onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); window.open(`/api/files/${f.id}?download=1`, '_blank'); } }}
                              className="absolute right-2 top-2 grid h-8 w-8 cursor-pointer place-items-center rounded-lg bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                              title="Download"
                              aria-label="Download"
                            >
                              <Download size={15} />
                            </span>
                          </button>
                          <div className="p-2.5">
                            <p className="line-clamp-2 text-[11px] leading-snug text-[#c7c2b8]">{f.note || 'Untitled render'}</p>
                            <p className="mt-1 font-mono text-[9px] tracking-[0.08em] text-[#8b909e] uppercase">
                              {f.model} · {new Date(f.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {items.map((g) => (
                      <div key={g.id} className="group overflow-hidden rounded-xl border border-[#bc9863]/25 bg-black">
                        <button className="relative block aspect-video w-full cursor-pointer" onClick={() => { setOpen(false); setExpanded(g); }} aria-label="Enlarge">
                          <Poster g={g} className="h-full w-full object-cover" />
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => { e.stopPropagation(); downloadRender(g.url, renderFilename(g.prompt, g.output, g.model)); }}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); downloadRender(g.url, renderFilename(g.prompt, g.output, g.model)); } }}
                            className="absolute right-2 top-2 grid h-8 w-8 cursor-pointer place-items-center rounded-lg bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                            title="Download"
                          >
                            <Download size={15} />
                          </span>
                        </button>
                        <div className="p-2.5">
                          <p className="line-clamp-2 text-[11px] leading-snug text-[#c7c2b8]">{g.prompt}</p>
                          <p className="mt-1 font-mono text-[9px] tracking-[0.08em] text-[#8b909e] uppercase">{g.model}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
