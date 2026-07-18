'use client';

/**
 * CommunityGallery — homepage section showing OWNER-APPROVED community work.
 * Reads /api/gallery (approved entries only — pending items are never exposed
 * by that route). Thumbs are self-contained data URIs so the wall stays alive
 * even after a fal render URL expires.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, ArrowRight, ExternalLink } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import type { GalleryEntry } from '@/lib/platformStore';
import { GALLERY_CATEGORIES, entryCategory, categoryLabel } from '@/lib/galleryCategories';

export const TOOL_LABELS: Record<string, string> = {
  'director-studio': 'CMA Director Studio',
  video: 'Video generator',
  image: 'Image generator',
  audio: 'Audio generator',
};

export function CommunityGallery() {
  const [entries, setEntries] = useState<GalleryEntry[] | null>(null);

  useEffect(() => {
    let live = true;
    fetch('/api/gallery')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (live && d?.ok) setEntries(d.entries as GalleryEntry[]);
      })
      .catch(() => {
        if (live) setEntries([]);
      });
    return () => {
      live = false;
    };
  }, []);

  return (
    <section id="community" className="mx-auto max-w-6xl scroll-mt-6 px-6 py-16">
      <Reveal className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.26em] text-[#bc9863] uppercase">
            <Users size={13} /> Community
          </div>
          <h2 className="font-[family-name:var(--font-sora)] text-[clamp(1.9rem,4vw,3rem)] font-bold tracking-[-0.03em]">
            Made with <span className="bg-gradient-to-r from-[#e7cfa3] to-[#bc9863] bg-clip-text text-transparent">CMA Studio.</span>
          </h2>
          <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed text-[#8b8f99]">
            Featured work from the people using the studio. Every piece here was submitted by its creator and approved
            before it appeared — nothing publishes itself.
          </p>
        </div>
        <Link
          href="/gallery/submit"
          className="inline-flex flex-none cursor-pointer items-center gap-2 rounded-xl border border-[#bc9863]/40 bg-[#bc9863]/8 px-4 py-2.5 text-[13.5px] font-semibold text-[#e7cfa3] transition hover:border-[#bc9863] hover:bg-[#bc9863]/14"
        >
          Submit your work <ArrowRight size={15} />
        </Link>
      </Reveal>

      {entries === null ? (
        /* skeleton while loading — reserves space, no jump */
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-video animate-pulse rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="glass rounded-2xl px-6 py-10 text-center">
          <p className="text-[15px] text-[#c7c2b8]">The wall is fresh. Be the first on it.</p>
          <p className="mx-auto mt-2 max-w-md text-[12.5px] leading-relaxed text-[#8b909e]">
            Render something you&apos;re proud of, submit it, and it appears here once approved.
          </p>
        </div>
      ) : (
        /* PER-MODEL CATEGORIES: approved work displays grouped by the model it
           was made with (lib/galleryCategories.ts) — never mixed together. Only
           categories that actually have approved work render a section. */
        <div className="flex flex-col gap-10">
          {GALLERY_CATEGORIES.map((cat) => {
            const catEntries = entries.filter((e) => entryCategory(e) === cat.id);
            if (catEntries.length === 0) return null;
            return (
              <div key={cat.id}>
                <div className="mb-3 flex items-baseline gap-3">
                  <h3 className="font-[family-name:var(--font-sora)] text-[17px] font-semibold text-[#e7cfa3]">
                    {cat.label}
                  </h3>
                  <span className="font-mono text-[10px] tracking-[0.14em] text-[#8b909e] uppercase">
                    {catEntries.length} {catEntries.length === 1 ? 'piece' : 'pieces'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {catEntries.map((e, i) => (
                    <Reveal key={e.id} delay={Math.min(i * 0.04, 0.3)}>
                      <figure className="group overflow-hidden rounded-xl border border-white/8 bg-black/40 transition hover:border-[#bc9863]/40">
                        <div className="relative aspect-video overflow-hidden">
                          {/* data-URI thumb — self-contained, survives expired render URLs */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={e.thumb}
                            alt={e.title}
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                          />
                        </div>
                        <figcaption className="flex items-start justify-between gap-2 px-3 py-2.5">
                          <span className="min-w-0">
                            <span className="block truncate text-[12.5px] font-medium text-[#f4efe6]">{e.title}</span>
                            <span className="block truncate font-mono text-[10px] text-[#8b909e]">
                              {e.name} · {categoryLabel(entryCategory(e))}
                            </span>
                          </span>
                          {e.url && (
                            <a
                              href={e.url}
                              target="_blank"
                              rel="noopener nofollow"
                              aria-label={`Open ${e.title}`}
                              className="mt-0.5 flex-none cursor-pointer text-[#8b8f99] transition hover:text-[#e7cfa3]"
                            >
                              <ExternalLink size={13} />
                            </a>
                          )}
                        </figcaption>
                      </figure>
                    </Reveal>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
