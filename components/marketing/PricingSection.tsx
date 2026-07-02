'use client';

/**
 * components/marketing/PricingSection.tsx - landing-page pricing section.
 * A compact mirror of /pricing, built from the same TIERS data in lib/plans.ts.
 * CTAs deep-link to /pricing#<tier-id>; nothing here fires a checkout.
 *
 * PLACEHOLDER PRICING: every number shown comes from lib/plans.ts and is a
 * placeholder until Sebastien finalizes it (hence the chip under the subhead).
 */
import { useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Archive, Check, Hourglass } from 'lucide-react';
import { TIERS, type Cycle } from '@/lib/plans';

export interface PricingSectionProps {
  /** extra classes for the outer <section> */
  className?: string;
}

export function PricingSection({ className = '' }: PricingSectionProps) {
  const [cycle, setCycle] = useState<Cycle>('yearly');
  const reduce = useReducedMotion();

  return (
    <section id="pricing" className={`scroll-mt-6 px-4 py-16 sm:px-6 ${className}`.trim()}>
      <div className="mx-auto max-w-5xl">
        {/* header: attack the category of expiring-credit subscriptions */}
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <div className="mb-3 font-mono text-[11px] tracking-[0.26em] text-[#bc9863] uppercase">Pricing</div>
          <h2 className="font-[family-name:var(--font-sora)] text-[clamp(1.9rem,4vw,2.7rem)] font-bold tracking-[-0.03em]">
            No expiring credits.{' '}
            <span className="bg-gradient-to-r from-[#e7cfa3] to-[#bc9863] bg-clip-text text-transparent">No wasted budget.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-[#8b8f99]">
            A low flat fee for the software. Compute runs on your own fal.ai key at fal&apos;s own rate, with no markup from us.
          </p>
          <span className="mt-4 inline-block rounded border border-white/10 px-2 py-0.5 font-mono text-[9px] tracking-[0.16em] text-[#8b909e] uppercase">
            Placeholder pricing
          </span>
        </div>

        {/* cycle toggle - same pill pattern as /pricing, own layoutId */}
        <div className="glass mx-auto mb-10 flex w-fit items-center gap-1 rounded-full p-1">
          {(['yearly', 'monthly'] as Cycle[]).map((c) => (
            <button
              key={c}
              onClick={() => setCycle(c)}
              className={`relative min-h-[40px] cursor-pointer rounded-full px-5 py-2 font-mono text-[11px] tracking-[0.14em] uppercase transition ${
                cycle === c ? 'text-black' : 'text-[#8b8f99] hover:text-[#e7cfa3]'
              }`}
            >
              {cycle === c && (
                <motion.span
                  layoutId="landing-cycle-pill"
                  className="absolute inset-0 rounded-full bg-gradient-to-b from-[#e7cfa3] to-[#bc9863]"
                  transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">{c === 'yearly' ? 'Yearly · up to $10/mo off' : 'Monthly'}</span>
            </button>
          ))}
        </div>

        {/* compact tier cards */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {TIERS.map((t) => (
            <div
              key={t.id}
              className={`relative flex flex-col rounded-2xl p-6 transition ${
                t.featured ? 'glass glass-gold border-[#bc9863] shadow-[0_30px_80px_-30px_rgba(188,152,99,0.4)]' : 'glass'
              }`}
            >
              {t.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-3 py-1 font-mono text-[10px] font-semibold tracking-[0.18em] text-black uppercase whitespace-nowrap">
                  Most popular
                </span>
              )}
              <div className="font-mono text-[11px] tracking-[0.22em] text-[#bc9863] uppercase">{t.name}</div>
              <div className="mt-3 flex items-end gap-1.5">
                <span className="font-[family-name:var(--font-sora)] text-3xl font-bold tracking-[-0.03em]">{t.price[cycle]}</span>
                <span className="mb-1 font-mono text-[11px] text-[#8b8f99]">/mo{cycle === 'yearly' ? ' · billed yearly' : ''}</span>
              </div>
              {cycle === 'yearly' && <div className="mt-1 font-mono text-[10px] tracking-[0.06em] text-[#e7cfa3]">{t.yearlySave}</div>}
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#bc9863]/20 bg-[#bc9863]/6 px-3 py-2 font-mono text-[10.5px] text-[#e7cfa3]">
                <Archive size={13} className="shrink-0 text-[#bc9863]" /> {t.retention}
              </div>
              <ul className="mt-4 mb-6 flex flex-1 flex-col gap-2.5">
                {t.features.slice(0, 4).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[13.5px] text-[#cfcabf]">
                    <Check size={15} className="mt-0.5 shrink-0 text-[#bc9863]" /> {f}
                  </li>
                ))}
              </ul>
              {t.checkout ? (
                <Link
                  href={`/pricing#${t.id}`}
                  className={`inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
                    t.featured
                      ? 'bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] text-black hover:brightness-105'
                      : 'border border-white/12 text-[#f4efe6] hover:border-[#bc9863] hover:text-[#e7cfa3]'
                  }`}
                >
                  {t.cta} <ArrowRight size={15} />
                </Link>
              ) : (
                /* Not checkout-able yet (see lib/billing.ts) - quiet link, no checkout */
                <Link
                  href={`/pricing#${t.id}`}
                  className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-[#8b909e] transition hover:border-white/20 hover:text-[#cfcabf]"
                >
                  <Hourglass size={15} /> {t.cta}
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/pricing" className="font-mono text-[12px] text-[#8b8f99] underline-offset-4 transition hover:text-[#e7cfa3] hover:underline">
            Full plan details and add-ons
          </Link>
        </div>

        {/* honest expectations */}
        <p className="mx-auto mt-10 max-w-2xl text-center font-mono text-[11px] leading-relaxed text-[#8b909e]">
          Every AI model has limits. It can decline a generation or occasionally miss. CMA Studio is tuned to get it right in fewer tries, but no tool can promise zero failures.
        </p>
      </div>
    </section>
  );
}
