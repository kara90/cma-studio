import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clapperboard, ArrowRight } from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { TrademarkNotice } from '@/components/TrademarkNotice';
import { decodeRecipeId, recipeSummary } from '@/lib/recipes';
import {
  findCamera,
  findLens,
  findAnamorphic,
  findStyle,
  findShot,
  findMove,
  findGrade,
  findSpeed,
} from '@/lib/vcpManifest';

/**
 * /r/[id] — PUBLIC camera-recipe share page (like photographers sharing EXIF).
 * The id IS the recipe: a versioned, validated payload — no server storage
 * needed, so links work today. Only redacted-manifest labels are shown; the
 * server-side prompt recipe never appears here.
 * ⚠ SEAM (accounts/storage pass): per-recipe render thumbnails replace the
 * brand OG card once render storage + accounts land.
 */

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const settings = decodeRecipeId(decodeURIComponent(id));
  if (!settings) return { title: 'Camera recipe | CMA Studio' };
  const camera = findCamera(settings.cameraKey)?.label ?? 'Camera';
  const lens = findLens(settings.lensKey)?.label ?? 'Lens';
  return {
    title: `${camera} · ${lens} · ${settings.focalLength}mm — Camera recipe | CMA Studio`,
    description: recipeSummary(settings),
    openGraph: {
      title: `CMA camera recipe — ${camera} · ${lens}`,
      description: recipeSummary(settings),
      images: ['/og-recipe.png'],
    },
  };
}

export default async function RecipeSharePage({ params }: Props) {
  const { id } = await params;
  const settings = decodeRecipeId(decodeURIComponent(id));
  if (!settings) notFound();

  const camera = findCamera(settings.cameraKey)!;
  const lens = findLens(settings.lensKey)!;
  const ana = findAnamorphic(settings.anamorphic);

  const rows: [string, string][] = [
    ['Body', camera.label],
    ['Glass', lens.label],
    ['Focal', `${settings.focalLength}mm`],
    ['Aperture', `T${settings.aperture.toFixed(1)}`],
    ['ISO', String(settings.iso)],
    ['Film grain', `${settings.grain}%`],
    ['Shutter', `${settings.shutter}°`],
    ['Anamorphic', ana.id === 'none' ? 'None · spherical' : ana.label],
    ...(ana.id !== 'none' ? ([['Flares', settings.flare === 'gold' ? 'Golden' : 'Blue']] as [string, string][]) : []),
    ['Style', findStyle(settings.style).label],
    ['Lighting', settings.genre],
    ['Shot', findShot(settings.shotSize).label],
    ['Move', findMove(settings.cameraMove).label],
    ['Speed', findSpeed(settings.speed).label],
    ['Grade', findGrade(settings.grade).label],
  ];

  return (
    <div className="relative min-h-screen">
      <SiteHeader />

      <main className="relative z-10 mx-auto max-w-2xl px-6 pb-24 pt-10">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#bc9863] bg-[#bc9863]/12 px-4 py-1.5 font-mono text-[11px] tracking-[0.24em] text-[#e7cfa3] uppercase">
            <Clapperboard size={13} /> Camera recipe
          </div>
          <h1 className="font-[family-name:var(--font-sora)] text-[clamp(1.7rem,3.6vw,2.4rem)] font-bold tracking-[-0.03em]">
            {camera.label} <span className="text-[#bc9863]">·</span> {lens.label}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[0.95rem] leading-relaxed text-[#8b8f99]">
            A full CMA Director Studio setup, shared like EXIF. Open it in the studio and the whole rig loads exactly
            as dialled.
          </p>
        </div>

        <div className="glass glass-gold rounded-2xl p-5">
          <dl className="flex flex-col gap-2.5 font-mono text-[12px]">
            {rows.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-b-0 last:pb-0">
                <dt className="tracking-[0.14em] text-[#8b909e] uppercase">{k}</dt>
                <dd className="text-right text-[#e7cfa3]">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={`/studio?recipe=${encodeURIComponent(id)}`}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-6 py-3 text-[14.5px] font-semibold text-black shadow-[0_10px_30px_rgba(188,152,99,0.3)] transition hover:brightness-105"
          >
            Open in CMA Director Studio <ArrowRight size={16} />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex min-h-[40px] cursor-pointer items-center font-mono text-[12px] tracking-[0.14em] text-[#8b8f99] uppercase transition hover:text-[#e7cfa3]"
          >
            See plans →
          </Link>
        </div>
        <p className="mt-4 text-center font-mono text-[10px] leading-relaxed text-[#8b909e]">
          The prompt engineering behind this rig stays server side. The recipe carries the visible settings only.
        </p>
      </main>

      <footer className="relative z-10 border-t border-white/6 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 font-mono text-[12px] tracking-[0.04em] text-[#8b909e] sm:flex-row">
          <span>© 2026 CineMaster Academy · CMA Studio</span>
          <div className="flex items-center gap-5">
            <a href="/privacy" className="transition hover:text-[#e7cfa3]">Privacy</a>
            <a href="/terms" className="transition hover:text-[#e7cfa3]">Terms</a>
            <a href="/refunds" className="transition hover:text-[#e7cfa3]">Refunds</a>
          </div>
        </div>
        <TrademarkNotice className="mx-auto mt-4 max-w-6xl text-center" />
      </footer>
    </div>
  );
}
