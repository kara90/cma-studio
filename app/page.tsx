import Link from 'next/link';
import { ArrowRight, Aperture, Film, Layers, Gauge, KeyRound, ShieldCheck, Wand2 } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { StudioConsole } from '@/components/studio/StudioConsole';
import { CinematicFooter } from '@/components/ui/motion-footer';
import { SiteHeader } from '@/components/SiteHeader';
import { Pillars } from '@/components/marketing/Pillars';
import { PricingSection } from '@/components/marketing/PricingSection';
import { Faq } from '@/components/marketing/Faq';
import { Particles } from '@/components/Particles';
import { BlurText } from '@/components/BlurText';
import { WistiaPlayer } from '@/components/WistiaPlayer';
import { BorderRotate } from '@/components/ui/animated-gradient-border';

/**
 * app/page.tsx — CMA Studio landing hub. The cinematic ground (grain, vignette,
 * drifting leaks) is provided globally by <Atmosphere/> in the layout. Every
 * CTA routes into the gated tool (/login → /studio).
 *
 * Positioning: the professional's AI production studio for people who refuse
 * expiring credit subscriptions. We attack the category, never a competitor.
 */

const MAKES = [
  { icon: Aperture, title: 'Real lens signatures', body: 'Anamorphic oval bokeh, vintage-70s veiling flare, or clinical modern-prime sharpness — the glass is baked into every frame.' },
  { icon: Film, title: 'True film hardware', body: '70mm large-format detail, 8K digital pop, or Super 16 celluloid grain. Pick the body; the look follows.' },
  { icon: Gauge, title: 'Cinematographer controls', body: 'ISO, film grain and shutter angle as real film stops — not vague style words.' },
  { icon: Layers, title: 'Genre lighting', body: 'Chiaroscuro horror, soft-key drama, high-motion action — each injects a real lighting setup.' },
];

const MARQUEE = ['Cinefilm 70mm', 'Premium Anamorphic', 'Digital Film S35', "Vintage 70's Prime", 'Cinema 8K', 'Modern Anamorphic', 'Super 16mm', 'Cine Prime'];

export default function Home() {
  return (
    <div className="relative min-h-screen">
      {/* scroll-aware frosted header — transparent over the hero, condenses on scroll */}
      <SiteHeader />

      <main className="relative z-10">
        {/* hero */}
        <section className="relative mx-auto max-w-4xl px-6 pt-16 pb-10 text-center sm:pt-24">
          {/* drifting gold particles behind the hero */}
          <Particles className="pointer-events-none absolute inset-0 -z-[1]" count={80} />
          <Reveal>
            <div className="mb-5 inline-flex items-center gap-2.5 font-mono text-[11px] tracking-[0.26em] text-[#bc9863] uppercase">
              <span className="h-px w-6 bg-gradient-to-r from-transparent to-[#bc9863]" />
              The professional&apos;s AI production studio
              <span className="h-px w-6 bg-gradient-to-l from-transparent to-[#bc9863]" />
            </div>
          </Reveal>
          {/* feature badge pills */}
          <Reveal delay={0.05}>
            <div className="mb-7 flex flex-wrap items-center justify-center gap-2.5">
              {[
                { icon: Aperture, t: 'Real film hardware' },
                { icon: Wand2, t: 'Auto by default' },
                { icon: KeyRound, t: 'No expiring credits' },
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
          <h1 className="font-[family-name:var(--font-sora)] text-[clamp(2.6rem,7vw,5.6rem)] font-bold leading-[0.96] tracking-[-0.035em]">
            <BlurText text="Direct it before" className="block" delay={0.1} />
            <BlurText
              block
              text="you shoot it."
              className="block bg-gradient-to-r from-[#e7cfa3] via-[#bc9863] to-[#8a6c40] bg-clip-text text-transparent"
              delay={0.5}
            />
          </h1>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-6 max-w-xl text-[clamp(1rem,1.7vw,1.2rem)] leading-relaxed text-[#8b8f99]">
              Cinematic video and photos from <span className="text-[#f4efe6]">real film camera and lens signatures</span>.
              A low flat fee for the software. Compute runs on <span className="text-[#f4efe6]">your own Fal.ai key</span> at
              fal&apos;s own rate. No markup, no credit packs that expire.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="#studio"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-7 py-3.5 text-[15px] font-semibold text-black shadow-[0_14px_44px_rgba(188,152,99,0.36)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_60px_rgba(188,152,99,0.5)]"
              >
                Try it below <ArrowRight size={17} />
              </Link>
              <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-[#8b909e] uppercase">
                <KeyRound size={13} className="text-[#bc9863]" /> Your Fal key · your compute
              </span>
            </div>
          </Reveal>
        </section>

        {/* ── cinematic showreel — see the look in motion ── */}
        <section className="mx-auto max-w-4xl px-6 pt-2 pb-16">
          <Reveal className="mb-7 text-center">
            <div className="mb-3 font-mono text-[11px] tracking-[0.26em] text-[#bc9863] uppercase">See it in motion</div>
            <h2 className="font-[family-name:var(--font-sora)] text-[clamp(1.8rem,4vw,2.8rem)] font-bold tracking-[-0.03em]">
              <BlurText text="Cinema, not clips." />
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-[#8b8f99]">
              A taste of the look CMA Studio is built to direct — real optics, real film signatures, rendered on your own key.
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

        {/* ── embedded studio (the tool, right on the page) ── */}
        <section id="studio" className="scroll-mt-6 px-4 pb-8 sm:px-6">
          <Reveal className="mx-auto mb-8 max-w-3xl text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#bc9863]/25 bg-[#bc9863]/[0.06] px-3 py-1 font-mono text-[10px] tracking-[0.2em] text-[#e7cfa3] uppercase">
              <Wand2 size={12} /> Four choices. Everything else is Auto.
            </div>
            <h2 className="font-[family-name:var(--font-sora)] text-[clamp(1.8rem,4vw,2.8rem)] font-bold tracking-[-0.03em]">
              <BlurText text="The studio, right here." />
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-[#8b8f99]">
              Pick a model, a resolution, an aspect, and describe your scene. Every cinematography department defaults
              to Auto. Pros can flip any of them to Manual. Rendering unlocks with a{' '}
              <Link href="/pricing" className="text-[#e7cfa3] underline underline-offset-2">subscription</Link>.
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="glass glass-gold rounded-3xl p-3 sm:p-5">
              <StudioConsole locked />
            </div>
          </Reveal>
        </section>

        {/* three pillars — why filmmakers switch */}
        <Pillars />

        {/* marquee */}
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

        {/* what it makes */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <Reveal className="mb-12 max-w-2xl">
            <div className="mb-4 font-mono text-[11px] tracking-[0.26em] text-[#bc9863] uppercase">The package</div>
            <h2 className="font-[family-name:var(--font-sora)] text-[clamp(1.9rem,4vw,3rem)] font-bold tracking-[-0.03em]">
              <BlurText text="Not filters." />{' '}
              <BlurText text="Real optics." className="text-[#bc9863]" delay={0.25} />
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MAKES.map((m, i) => (
              <Reveal key={m.title} delay={i * 0.08}>
                <div className="glass h-full rounded-2xl p-6 transition hover:border-[#bc9863]/30">
                  <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl border border-[#bc9863]/25 bg-[#bc9863]/8 text-[#bc9863]">
                    <m.icon size={20} />
                  </div>
                  <h3 className="mb-2 font-[family-name:var(--font-sora)] text-[1.15rem] font-semibold">{m.title}</h3>
                  <p className="text-[0.95rem] leading-relaxed text-[#8b8f99]">{m.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* pricing — placeholder tiers, monthly/annual toggle */}
        <PricingSection />

        {/* honest answers for cold traffic */}
        <Faq />

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
              CMA Studio is in active beta, the first of a growing family of tools we&apos;re building for
              serious film production. Everything is engineered toward one goal: to help you make magnificent films,
              effortlessly. More is coming, fast.
            </p>
          </Reveal>
        </section>

        {/* cta band */}
        <section className="relative mx-6 mb-20 overflow-hidden rounded-3xl border border-[#bc9863]/15 px-6 py-20 text-center">
          <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(60% 100% at 50% 100%, rgba(188,152,99,0.16), transparent 70%)' }} />
          <Reveal className="relative mx-auto max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-[#bc9863]/25 px-3 py-1 font-mono text-[10px] tracking-[0.2em] text-[#bc9863] uppercase">
              <ShieldCheck size={12} /> Flat fee · your key · your footage
            </div>
            <h2 className="font-[family-name:var(--font-sora)] text-[clamp(2rem,5vw,3.4rem)] font-bold tracking-[-0.035em]">
              Bring your key.<br />
              <span className="bg-gradient-to-r from-[#e7cfa3] to-[#bc9863] bg-clip-text text-transparent">Roll the camera.</span>
            </h2>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-8 py-4 text-[16px] font-semibold text-black shadow-[0_14px_44px_rgba(188,152,99,0.36)] transition hover:-translate-y-0.5"
              >
                See plans &amp; pricing <ArrowRight size={18} />
              </Link>
              <Link href="#studio" className="font-mono text-[12px] tracking-[0.14em] text-[#8b8f99] uppercase transition hover:text-[#e7cfa3]">
                or try it now →
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
