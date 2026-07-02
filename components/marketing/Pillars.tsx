import { KeyRound, Aperture, Archive } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

/**
 * Pillars — the three-pillar value section for cold traffic.
 * Server component; Reveal is a client boundary it renders into.
 */

const PILLARS = [
  {
    icon: KeyRound,
    title: 'Pay only for what you render',
    body: "A low flat software fee. Compute runs on your own fal.ai key at fal's own rate, with no markup from us. No expiring credits, no wasted budget.",
  },
  {
    icon: Aperture,
    title: 'Real DP precision, fewer wasted renders',
    body: 'Real camera, lens, film stock and lighting controls, engineered server side, so you get the shot in fewer tries and burn less compute than firing raw prompts at a model.',
  },
  {
    icon: Archive,
    title: 'Your renders, kept safe',
    body: 'fal deletes generated files after about 7 days. We cache and index them for you, with retention by tier, so nothing disappears.',
  },
] as const;

export function Pillars() {
  return (
    <section id="pillars" className="mx-auto max-w-6xl scroll-mt-6 px-6 py-20">
      <Reveal className="mb-12 max-w-2xl">
        <div className="mb-4 font-mono text-[11px] tracking-[0.26em] text-[#bc9863] uppercase">
          Why filmmakers switch
        </div>
        <h2 className="font-[family-name:var(--font-sora)] text-[clamp(1.9rem,4vw,3rem)] font-bold tracking-[-0.03em]">
          Built to waste <span className="text-[#bc9863]">nothing.</span>
        </h2>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[#8b8f99]">
          A flat fee for the software, your own key for the compute, and every render kept where you can find it.
        </p>
      </Reveal>

      <div className="grid gap-4 sm:grid-cols-3">
        {PILLARS.map((p, i) => (
          <Reveal key={p.title} delay={i * 0.08}>
            <div className="glass glass-gold h-full rounded-2xl p-6 transition hover:border-[#bc9863]/35">
              <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl border border-[#bc9863]/25 bg-[#bc9863]/8 text-[#bc9863]">
                <p.icon size={20} />
              </div>
              <h3 className="mb-2 font-[family-name:var(--font-sora)] text-[1.1rem] font-semibold">
                {p.title}
              </h3>
              <p className="text-[0.93rem] leading-relaxed text-[#8b8f99]">{p.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
