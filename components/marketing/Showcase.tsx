'use client';

/**
 * Showcase: the "From the wire" grid on the homepage. Reads its feed from
 * lib/showcase.ts (Sebastien drops real media URLs there; tiles auto-render
 * them: video = muted inline loop, image = full-bleed, audio = poster with a
 * native player). Placeholder entries render their gradient poster with a
 * "sample" chip. Masonry-feel rhythm: first item is a 2x2 feature, sixth is
 * a wide strip, the rest are squares.
 */

import { useEffect, useRef } from 'react';
import { Video, Image as ImageIcon, AudioLines } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { ITEMS, type ShowcaseItem } from '@/lib/showcase';

/**
 * Lazy autoplaying loop: the file only starts downloading and playing once the
 * tile is near the viewport, and pauses again off-screen — 7 tiles no longer
 * fight the hero for first-load bandwidth (a ~4MB saving on initial paint).
 */
function LazyLoop({ src, className }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const v = e.target as HTMLVideoElement;
          if (e.isIntersecting) {
            if (!v.src) v.src = v.dataset.src ?? '';
            v.muted = true;
            v.play().catch(() => {});
          } else {
            v.pause();
          }
        }
      },
      { rootMargin: '200px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <video ref={ref} data-src={src} muted loop playsInline preload="none" className={className} />;
}

const KIND_ICON = {
  video: Video,
  image: ImageIcon,
  audio: AudioLines,
} as const;

/**
 * Layout rhythm by array position. Squares set the row height everywhere, so
 * the 2x2 feature (also square) and the 2:1 wide strip always line up.
 */
const SPANS = [
  'col-span-2 row-span-2 aspect-square', // 0: feature
  'aspect-square', // 1
  'aspect-square', // 2
  'aspect-square', // 3
  'aspect-square', // 4
  'col-span-2 aspect-[2/1]', // 5: wide strip
  'aspect-square', // 6
  'aspect-square', // 7
];

function Tile({ item, span }: { item: ShowcaseItem; span: string }) {
  const Icon = KIND_ICON[item.kind];
  const isSample = !item.src;

  return (
    <figure
      className={`group relative overflow-hidden rounded-2xl border border-white/8 transition duration-300 hover:border-[#bc9863]/40 ${span}`}
    >
      {/* poster ground: always present, doubles as the loading swatch */}
      <div className="absolute inset-0" style={{ background: item.poster }} aria-hidden />

      {/* real media, when Sebastien has dropped a src into lib/showcase.ts */}
      {item.src && item.kind === 'video' && (
        <LazyLoop
          src={item.src}
          className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
      )}
      {item.src && item.kind === 'image' && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.src}
          alt={item.title}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
      )}
      {item.src && item.kind === 'audio' && (
        <audio
          src={item.src}
          controls
          preload="none"
          className="absolute inset-x-3 bottom-3 z-10 h-10 w-[calc(100%-24px)] opacity-90"
        />
      )}

      {/* kind chip, top left */}
      <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/45 px-2 py-1 font-mono text-[11px] text-[#c7c2b8] backdrop-blur-sm">
        <Icon size={12} className="text-[#bc9863]" />
        {item.kind}
      </span>

      {/* sample chip, top right, only while the slot is a placeholder */}
      {isSample && (
        <span className="absolute top-3 right-3 rounded-lg border border-white/8 bg-black/35 px-2 py-1 font-mono text-[11px] tracking-[0.12em] text-[#8b8f99] uppercase backdrop-blur-sm">
          sample
        </span>
      )}

      {/* spec chip, top right, for concept pieces referencing an existing brand */}
      {item.disclaimer && (
        <span
          title={item.disclaimer}
          className="absolute top-3 right-3 rounded-lg border border-white/10 bg-black/45 px-2 py-1 font-mono text-[11px] tracking-[0.12em] text-[#c7c2b8] uppercase backdrop-blur-sm"
        >
          spec
        </span>
      )}

      {/* hover overlay: title + author */}
      <figcaption className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-4 pt-10 pb-3.5 opacity-0 transition duration-300 group-hover:opacity-100">
        <span className="font-[family-name:var(--font-sora)] text-[14px] font-semibold tracking-[-0.01em] text-[#f4efe6]">
          {item.title}
        </span>
        {item.author && (
          <span className="font-mono text-[11px] tracking-[0.14em] text-[#8b909e] uppercase">{item.author}</span>
        )}
        {item.disclaimer && (
          <span className="mt-1 text-[11px] leading-snug text-[#8b8f99]">{item.disclaimer}</span>
        )}
      </figcaption>
    </figure>
  );
}

export function Showcase() {
  return (
    <section id="showcase" className="mx-auto max-w-6xl scroll-mt-6 px-6 py-20">
      <Reveal className="mb-10 max-w-2xl">
        <div className="mb-4 font-mono text-[11px] tracking-[0.26em] text-[#bc9863] uppercase">From the wire</div>
        <h2 className="font-[family-name:var(--font-sora)] text-[clamp(1.9rem,4vw,3rem)] font-bold tracking-[-0.03em]">
          Made on <span className="text-[#bc9863]">the platform.</span>
        </h2>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[#8b8f99]">
          Real work from the platform. Community sharing is coming soon.
        </p>
      </Reveal>

      <Reveal delay={0.08}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {ITEMS.map((item, i) => (
            <Tile key={item.id} item={item} span={SPANS[i % SPANS.length]} />
          ))}
        </div>
      </Reveal>

      {ITEMS.some((item) => item.disclaimer) && (
        <p className="mt-4 text-center text-[12px] leading-relaxed text-[#5b5f6a]">
          Pieces marked &ldquo;spec&rdquo; are unsolicited creative exercises. Any brands shown are not affiliated
          with, sponsoring or endorsing CMA Studio.
        </p>
      )}
    </section>
  );
}
