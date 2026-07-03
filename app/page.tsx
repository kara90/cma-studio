import Link from 'next/link';
import {
  ArrowRight,
  Archive,
  AudioLines,
  Boxes,
  Clapperboard,
  Hourglass,
  Image as ImageIcon,
  KeyRound,
  ShieldCheck,
  Smartphone,
  TerminalSquare,
  Trash2,
  Video,
} from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { GetAppButton } from '@/components/PwaProvider';
import { StudioConsole } from '@/components/studio/StudioConsole';
import { CinematicFooter } from '@/components/ui/motion-footer';
import { SiteHeader } from '@/components/SiteHeader';
import { Pillars } from '@/components/marketing/Pillars';
import { Showcase } from '@/components/marketing/Showcase';
import { Particles } from '@/components/Particles';
import { BlurText } from '@/components/BlurText';
import { WistiaPlayer } from '@/components/WistiaPlayer';
import { BorderRotate } from '@/components/ui/animated-gradient-border';

/**
 * app/page.tsx: CMA Studio platform homepage. The cinematic ground (grain,
 * vignette, drifting leaks) is provided globally by <Atmosphere/> in the layout.
 *
 * Positioning: a professional layer for AI production. Every frontier model in
 * one place, plain generators at /video /image /audio, the DP Studio at /studio
 * as the flagship, storage included. One low flat software fee; compute runs on
 * the user's own fal.ai key at fal's own rate with zero markup. We attack the
 * category of expiring credit subscriptions, never a competitor.
 */

const MARQUEE = [
  'Seedance 2',
  'Kling 3',
  'Veo 3.1',
  'Hailuo 2.3',
  'Nano Banana Pro',
  'GPT Image 2',
  'Lyria 2',
  'ElevenLabs',
  'Stable Audio 2.5',
];

const TOOLS = [
  {
    href: '/video',
    icon: Video,
    title: 'Video',
    body: 'Every top video model in one clean console. Prompt it plain or push it far.',
    flagship: false,
  },
  {
    href: '/image',
    icon: ImageIcon,
    title: 'Image',
    body: 'Stills, boards and key art from the sharpest image models in the business.',
    flagship: false,
  },
  {
    href: '/audio',
    icon: AudioLines,
    title: 'Audio',
    body: 'Music, voices and sound design from the leading audio engines.',
    flagship: false,
  },
  {
    href: '/studio',
    icon: Clapperboard,
    title: 'Studio Pro',
    body: 'A server-side DP engine built on 21+ years behind the camera as a working Director of Photography. Real camera, lens and lighting choices become the shot.',
    flagship: true,
  },
] as const;

export default function Home() {
  return (
    <div className="relative min-h-screen">
      {/* scroll-aware frosted header: transparent over the hero, condenses on scroll */}
      <SiteHeader />

      <main className="relative z-10">
        {/* hero — FULL-BLEED cinematic film behind the copy, edge to edge */}
        <section className="relative flex min-h-[88vh] w-full items-center justify-center overflow-hidden">
          {/* Sebastien's render as the full-page background, feathered top and
              bottom so the edges disappear into the page (no hard video edges) */}
          <div className="pointer-events-none absolute inset-0 -z-[2]" aria-hidden="true">
            <video
              src="/clips/home-hero.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="h-full w-full object-cover opacity-50 motion-reduce:hidden"
              style={{
                maskImage: 'linear-gradient(180deg, transparent 0%, #000 14%, #000 82%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 14%, #000 82%, transparent 100%)',
              }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(80%_70%_at_50%_45%,rgba(0,0,0,0.25),rgba(0,0,0,0.62))]" />
          </div>
          {/* drifting gold particles behind the hero copy */}
          <Particles className="pointer-events-none absolute inset-0 -z-[1]" count={80} />
          <div className="relative mx-auto max-w-4xl px-6 py-20 text-center">
          <Reveal>
            <div className="mb-5 inline-flex items-center gap-2.5 font-mono text-[11px] tracking-[0.26em] text-[#bc9863] uppercase">
              <span className="h-px w-6 bg-gradient-to-r from-transparent to-[#bc9863]" />
              The professional&apos;s AI production platform
              <span className="h-px w-6 bg-gradient-to-l from-transparent to-[#bc9863]" />
            </div>
          </Reveal>
          {/* feature badge pills — plain language, the three reliefs */}
          <Reveal delay={0.05}>
            <div className="mb-7 flex flex-wrap items-center justify-center gap-2.5">
              {[
                { icon: KeyRound, t: 'No credits, ever' },
                { icon: Archive, t: 'Your renders, never deleted' },
                { icon: Boxes, t: 'All the top models' },
              ].map((b) => (
                <span
                  key={b.t}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[13px] text-[#c7c2b8] backdrop-blur-md"
                >
                  <b.icon size={14} className="text-[#bc9863]" /> {b.t}
                </span>
              ))}
            </div>
          </Reveal>
          {/* A/B VARIANT for a later test: H1 "The credit trap ends here." */}
          <h1 className="font-[family-name:var(--font-sora)] text-[clamp(2.4rem,6vw,4.8rem)] font-bold leading-[1.02] tracking-[-0.035em]">
            <BlurText text="Stop renting credits that expire." className="block" delay={0.1} />
            <BlurText
              block
              text="Start owning your renders."
              className="block bg-gradient-to-r from-[#e7cfa3] via-[#bc9863] to-[#8a6c40] bg-clip-text text-transparent"
              delay={0.5}
            />
          </h1>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-6 max-w-xl text-[clamp(1rem,1.7vw,1.2rem)] leading-relaxed text-[#8b8f99]">
              Every top AI video, image, and audio model in one cinematic studio. Compute runs on{' '}
              <span className="text-[#f4efe6]">your own fal.ai key</span> at fal&apos;s published rate,{' '}
              <span className="text-[#f4efe6]">no markup</span>, no credit packs, and your renders stay in your
              library instead of vanishing.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="#studio-pro"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-7 py-3.5 text-[15px] font-semibold text-black shadow-[0_14px_44px_rgba(188,152,99,0.36)] transition hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_20px_60px_rgba(188,152,99,0.5)]"
              >
                Explore the studio free <ArrowRight size={17} />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex min-h-[40px] items-center gap-2 font-mono text-[12px] tracking-[0.14em] text-[#8b8f99] uppercase transition hover:text-[#e7cfa3]"
              >
                See plans →
              </Link>
            </div>
          </Reveal>
          </div>
        </section>

        {/* ── PAIN — name it, agitate it, relieve it, before any feature talk ── */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <Reveal className="mb-10 max-w-2xl">
            <div className="mb-4 font-mono text-[11px] tracking-[0.26em] text-[#bc9863] uppercase">Sound familiar?</div>
            <h2 className="font-[family-name:var(--font-sora)] text-[clamp(1.9rem,4vw,3rem)] font-bold tracking-[-0.03em]">
              You know <span className="text-[#bc9863]">this pain.</span>
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                icon: Hourglass,
                title: 'Credits that evaporate',
                body: 'You bought a credit pack. The month ended. The credits died. On credit platforms your unused budget simply disappears, and if you have been on one for six months, you have almost certainly paid for renders you never made. Here there are no credits: compute is billed by fal at fal’s rate, only when you render.',
              },
              {
                icon: TerminalSquare,
                title: 'Tools built for developers, not filmmakers',
                body: 'Raw render platforms are engineered for engineers: scattered model pages, technical settings, no unified library, no mobile. You fight the interface before you ever fight the shot. CMA Studio is the cockpit: every model in one cinematic interface a filmmaker actually enjoys using.',
              },
              {
                icon: Trash2,
                title: 'Your work, deleted in days',
                body: 'On raw platforms, generated files are removed after about 7 days. Miss the window and the shot is gone forever. Here every render lands in your library automatically, kept by plan tier, from 30 days to a year.',
              },
            ].map((c, i) => (
              <Reveal key={c.title} delay={i * 0.08}>
                <div className="glass flex h-full flex-col rounded-2xl p-6">
                  <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl border border-[#bc9863]/25 bg-[#bc9863]/8 text-[#bc9863]">
                    <c.icon size={20} />
                  </div>
                  <h3 className="mb-2.5 font-[family-name:var(--font-sora)] text-[1.1rem] font-semibold text-[#f4efe6]">
                    {c.title}
                  </h3>
                  <p className="text-[0.93rem] leading-relaxed text-[#8b8f99]">{c.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.2}>
            <p className="mt-10 text-center font-[family-name:var(--font-sora)] text-[1.25rem] font-semibold text-[#e7cfa3]">
              One studio fixes all three.
            </p>
          </Reveal>
        </section>

        {/* ── IDENTITY — the right visitor self-identifies before seeing a price ── */}
        <section className="mx-auto max-w-4xl px-6 pb-20">
          <Reveal className="mb-8 text-center">
            <h2 className="font-[family-name:var(--font-sora)] text-[clamp(1.7rem,3.6vw,2.6rem)] font-bold tracking-[-0.03em]">
              Built for people who take <span className="text-[#bc9863]">the frame seriously.</span>
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Reveal>
              <div className="glass glass-gold h-full rounded-2xl border border-[#bc9863]/30 p-6">
                <div className="mb-3 font-mono text-[11px] tracking-[0.22em] text-[#e7cfa3] uppercase">This is for you</div>
                <p className="text-[0.95rem] leading-relaxed text-[#cfcabf]">
                  You make films, ads, music videos, or client work. You care what the shot looks like. You want
                  frontier models without babysitting five subscriptions. You want your money going into renders, not
                  markup.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="glass h-full rounded-2xl p-6">
                <div className="mb-3 font-mono text-[11px] tracking-[0.22em] text-[#8b909e] uppercase">This is not for you</div>
                <p className="text-[0.95rem] leading-relaxed text-[#8b8f99]">
                  You want a meme generator. You never render more than once a month. You enjoy losing credits.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* showcase: real renders from the platform */}
        <Showcase />

        {/* ── THE APP — kept right after social proof, never lost behind a dismissed banner ── */}
        <section id="get-the-app" className="mx-auto max-w-4xl scroll-mt-6 px-6 pb-24">
          <Reveal>
            <div className="glass glass-gold flex flex-col items-center gap-6 rounded-3xl p-8 text-center sm:p-12">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/icon-192.png" alt="CMA Studio app icon" className="h-16 w-16 rounded-2xl border border-white/10 shadow-[0_14px_40px_rgba(0,0,0,0.6)]" />
              <div>
                <div className="mb-3 font-mono text-[11px] tracking-[0.26em] text-[#bc9863] uppercase">In your pocket</div>
                <h2 className="font-[family-name:var(--font-sora)] text-[clamp(1.7rem,4vw,2.6rem)] font-bold tracking-[-0.03em]">
                  Your DP tools. <span className="text-[#bc9863]">Everywhere.</span>
                </h2>
                <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-[#8b8f99]">
                  Install CMA Studio on your phone or tablet: same account, same key, same library. Direct a shot
                  from set, from the car, from anywhere. No app store needed.
                </p>
              </div>
              <GetAppButton className="inline-flex min-h-[48px] cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-8 py-3.5 text-[15px] font-semibold text-black shadow-[0_14px_44px_rgba(188,152,99,0.36)] transition hover:-translate-y-0.5 hover:brightness-105">
                <Smartphone size={17} /> Get the app
              </GetAppButton>
              <p className="font-mono text-[10px] tracking-[0.1em] text-[#8b909e] uppercase">
                iPhone · Android · iPad · tablets
              </p>
            </div>
          </Reveal>
        </section>

        {/* the toolkit: four doors into the platform */}
        <section id="tools" className="mx-auto max-w-6xl scroll-mt-6 px-6 py-20">
          <Reveal className="mb-12 max-w-2xl">
            <div className="mb-4 font-mono text-[11px] tracking-[0.26em] text-[#bc9863] uppercase">The toolkit</div>
            <h2 className="font-[family-name:var(--font-sora)] text-[clamp(1.9rem,4vw,3rem)] font-bold tracking-[-0.03em]">
              <BlurText text="Four doors." />{' '}
              <BlurText text="One studio." className="text-[#bc9863]" delay={0.25} />
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[#8b8f99]">
              Plain, fast generators for everyday work. The Studio when the shot really matters. Everything lands in
              your library.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TOOLS.map((t, i) => (
              <Reveal key={t.href} delay={i * 0.08}>
                <Link
                  href={t.href}
                  className="glass glass-gold group flex h-full cursor-pointer flex-col rounded-2xl p-6 transition duration-300 hover:-translate-y-1 hover:border-[#bc9863]/40"
                >
                  <div className="mb-5 flex items-start justify-between">
                    <div className="grid h-11 w-11 place-items-center rounded-xl border border-[#bc9863]/25 bg-[#bc9863]/8 text-[#bc9863]">
                      <t.icon size={20} />
                    </div>
                    {t.flagship && (
                      <span className="rounded-lg border border-[#bc9863] bg-[#bc9863]/12 px-2 py-1 font-mono text-[11px] tracking-[0.12em] text-[#e7cfa3] uppercase">
                        Flagship
                      </span>
                    )}
                  </div>
                  <h3 className="mb-2 font-[family-name:var(--font-sora)] text-[1.15rem] font-semibold">{t.title}</h3>
                  <p className="text-[0.93rem] leading-relaxed text-[#8b8f99]">{t.body}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 pt-1 font-mono text-[12px] tracking-[0.14em] text-[#bc9863] uppercase transition group-hover:text-[#e7cfa3]">
                    Open →
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── RAW VS ENGINE — the proof the flagship earns its name ── */}
        <section className="mx-auto max-w-5xl px-6 py-20">
          <Reveal className="mb-8 text-center">
            <div className="mb-4 font-mono text-[11px] tracking-[0.26em] text-[#bc9863] uppercase">The difference, side by side</div>
            <h2 className="font-[family-name:var(--font-sora)] text-[clamp(1.9rem,4vw,3rem)] font-bold tracking-[-0.03em]">
              Same model. <span className="text-[#bc9863]">Different director.</span>
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* TODO — DO NOT FABRICATE, USE REAL RENDERS: two comparison clips
                generated from the SAME base idea on the SAME model. Left = the
                raw prompt as a beginner would type it. Right = the same idea
                after the DP engine composed the shot. Drop the video srcs in
                and delete the placeholder divs. */}
            <Reveal>
              <figure className="glass overflow-hidden rounded-2xl">
                <div className="grid aspect-video w-full place-items-center bg-black/50">
                  <span className="px-6 text-center font-mono text-[11px] leading-relaxed tracking-[0.1em] text-[#575b64] uppercase">
                    TODO · real render · raw prompt
                  </span>
                </div>
                <figcaption className="px-4 py-3 font-mono text-[11px] tracking-[0.14em] text-[#8b909e] uppercase">
                  Raw prompt, straight to the model
                </figcaption>
              </figure>
            </Reveal>
            <Reveal delay={0.08}>
              <figure className="glass glass-gold overflow-hidden rounded-2xl border border-[#bc9863]/35">
                <div className="grid aspect-video w-full place-items-center bg-black/50">
                  <span className="px-6 text-center font-mono text-[11px] leading-relaxed tracking-[0.1em] text-[#575b64] uppercase">
                    TODO · real render · DP engine
                  </span>
                </div>
                <figcaption className="px-4 py-3 font-mono text-[11px] tracking-[0.14em] text-[#e7cfa3] uppercase">
                  Same idea, directed by the DP engine
                </figcaption>
              </figure>
            </Reveal>
          </div>
          <Reveal delay={0.14}>
            <p className="mx-auto mt-6 max-w-2xl text-center text-[14px] leading-relaxed text-[#8b8f99]">
              The model is identical. The difference is the direction: real camera, lens, film stock, and lighting
              decisions compiled into the prompt before a single unit of compute is spent.
            </p>
            <p className="mt-3 text-center font-[family-name:var(--font-sora)] text-[1.05rem] font-semibold text-[#e7cfa3]">
              Fewer wasted renders. Your fal budget goes further.
            </p>
          </Reveal>
        </section>

        {/* ── STUDIO PRO — the flagship, right on the homepage ── */}
        <section id="studio-pro" className="scroll-mt-6 px-4 py-20 sm:px-6">
          <Reveal className="mx-auto mb-8 max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#bc9863] bg-[#bc9863]/12 px-4 py-1.5 font-mono text-[11px] tracking-[0.24em] text-[#e7cfa3] uppercase">
              <Clapperboard size={13} /> Studio Pro · The flagship
            </div>
            <h2 className="font-[family-name:var(--font-sora)] text-[clamp(2rem,4.6vw,3.2rem)] font-bold tracking-[-0.03em]">
              This is what <span className="bg-gradient-to-r from-[#e7cfa3] to-[#bc9863] bg-clip-text text-transparent">nobody else has.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[15.5px] leading-relaxed text-[#8b8f99]">
              A server-side Director of Photography engine built on{' '}
              <span className="text-[#f4efe6]">21+ years behind the camera</span>. Real bodies, real glass, real light,
              compiled into every frame. Try every control right here.
            </p>
            <p className="mx-auto mt-3 max-w-xl text-[13.5px] leading-relaxed text-[#8b909e]">
              Built by a working DP with 21+ years on set: an Absolut Vodka commercial, an Amazon Prime series, aerial
              work for major-label productions. That experience is compiled into every frame this engine directs.
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="glass glass-gold rounded-3xl p-3 sm:p-5">
              <StudioConsole locked />
            </div>
          </Reveal>
        </section>

        {/* cinematic showreel: see the platform in motion */}
        <section className="mx-auto max-w-4xl px-6 pt-2 pb-16">
          <Reveal className="mb-7 text-center">
            <div className="mb-3 font-mono text-[11px] tracking-[0.26em] text-[#bc9863] uppercase">See it in motion</div>
            <h2 className="font-[family-name:var(--font-sora)] text-[clamp(1.8rem,4vw,2.8rem)] font-bold tracking-[-0.03em]">
              <BlurText text="One platform. Every look." />
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-[#8b8f99]">
              A reel cut from renders directed with the same tools you get here, on the same models the platform
              carries.
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <BorderRotate
              animationSpeed={7}
              borderWidth={2}
              borderRadius={18}
              backgroundColor="#05060a"
              className="mx-auto w-full shadow-[0_50px_140px_-40px_rgba(0,0,0,0.9)]"
            >
              <div className="overflow-hidden rounded-[16px]">
                <WistiaPlayer mediaId="v0v7fkijyy" />
              </div>
            </BorderRotate>
          </Reveal>
        </section>

        {/* three pillars: why creators switch */}
        <Pillars />

        {/* model marquee: the roster across video, image and audio */}
        <div className="marquee my-10 border-y border-white/6 py-5">
          <div className="mtrack font-mono text-[13px] tracking-[0.18em] text-[#8b909e] uppercase">
            {[...MARQUEE, ...MARQUEE].map((m, i) => (
              <span key={i} className="inline-flex items-center gap-14 whitespace-nowrap">
                {m}
                <span className="text-[#bc9863] opacity-50">◈</span>
              </span>
            ))}
          </div>
        </div>


        {/* mission / beta */}
        <section className="mx-auto max-w-3xl px-6 py-20 text-center">
          <Reveal>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#bc9863]/25 bg-[#bc9863]/[0.06] px-3 py-1 font-mono text-[10px] tracking-[0.2em] text-[#e7cfa3] uppercase">
              The first of many
            </div>
            <h2 className="font-[family-name:var(--font-sora)] text-[clamp(1.9rem,4.5vw,3rem)] font-bold tracking-[-0.03em]">
              We build tools for <span className="text-[#bc9863]">real cinema.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-[1.05rem] leading-relaxed text-[#8b8f99]">
              CMA Studio is in active beta, a growing platform for serious AI production. Plain generators for
              everyday work, a full DP engine when the shot matters, and your library underneath it all. Everything
              is engineered toward one goal: help you make magnificent work without wasting a dollar of compute.
              More is coming, fast.
            </p>
          </Reveal>
        </section>

        {/* cta band */}
        <section className="relative mx-6 mb-20 overflow-hidden rounded-3xl border border-[#bc9863]/15 px-6 py-20 text-center">
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(60% 100% at 50% 100%, rgba(188,152,99,0.16), transparent 70%)' }}
          />
          <Reveal className="relative mx-auto max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-[#bc9863]/25 px-3 py-1 font-mono text-[10px] tracking-[0.2em] text-[#bc9863] uppercase">
              <ShieldCheck size={12} /> Flat fee · your key · your work
            </div>
            <h2 className="font-[family-name:var(--font-sora)] text-[clamp(1.9rem,4.4vw,3rem)] font-bold tracking-[-0.035em]">
              Up and running <span className="text-[#bc9863]">in minutes.</span>
            </h2>
            <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-4 text-left sm:grid-cols-3">
              {[
                'Create a free fal.ai account (about 2 minutes).',
                'Paste your key into CMA Studio once. Used only at render, never stored.',
                'Render. fal bills you at published rates. We never touch your compute money.',
              ].map((s, i) => (
                <div key={s} className="glass rounded-2xl p-5">
                  <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] font-[family-name:var(--font-sora)] text-[14px] font-bold text-black">
                    {i + 1}
                  </div>
                  <p className="text-[13.5px] leading-relaxed text-[#cfcabf]">{s}</p>
                </div>
              ))}
            </div>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/key-guide"
                className="inline-flex min-h-[40px] items-center gap-2 font-mono text-[12px] tracking-[0.14em] text-[#e7cfa3] uppercase transition hover:text-[#f4efe6]"
              >
                Key guide (5 minutes) →
              </Link>
              <Link
                href="/pricing#wedge-math"
                className="inline-flex min-h-[40px] items-center font-mono text-[12px] tracking-[0.14em] text-[#8b8f99] uppercase transition hover:text-[#e7cfa3]"
              >
                Do the math yourself →
              </Link>
            </div>
          </Reveal>
        </section>

        {/* ── FINAL CTA BAND — the last word before the footer ── */}
        <section className="relative mx-6 mb-20 overflow-hidden rounded-3xl border border-[#bc9863]/15 px-6 py-20 text-center">
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(60% 100% at 50% 100%, rgba(188,152,99,0.16), transparent 70%)' }}
          />
          <Reveal className="relative mx-auto max-w-2xl">
            <h2 className="font-[family-name:var(--font-sora)] text-[clamp(1.9rem,4.6vw,3.1rem)] font-bold tracking-[-0.035em]">
              Render like it&apos;s your money.<br />
              <span className="bg-gradient-to-r from-[#e7cfa3] to-[#bc9863] bg-clip-text text-transparent">
                Because it is.
              </span>
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-[#8b8f99]">
              Explore every control free. Subscribe when you&apos;re ready to render. Beta pricing is locked for life
              for early subscribers.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="#studio-pro"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-8 py-4 text-[16px] font-semibold text-black shadow-[0_14px_44px_rgba(188,152,99,0.36)] transition hover:-translate-y-0.5 hover:brightness-105"
              >
                Explore the studio free <ArrowRight size={18} />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex min-h-[40px] items-center font-mono text-[12px] tracking-[0.14em] text-[#8b8f99] uppercase transition hover:text-[#e7cfa3]"
              >
                See plans →
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      {/* cinematic curtain-reveal footer */}
      <CinematicFooter />
    </div>
  );
}
