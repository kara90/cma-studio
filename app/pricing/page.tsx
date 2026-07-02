import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PricingView } from '@/components/pricing/PricingView';
import { Logo } from '@/components/Logo';

export const metadata: Metadata = {
  title: 'Pricing — CMA Studio Pro | CineMaster Academy',
  description: 'Simple plans for CMA Studio Pro. Students, Pro, and Studio tiers — bring your own Fal.ai key, no per-clip markup.',
};

export default function PricingPage() {
  return (
    <div className="relative min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[#bc9863]/18 bg-[#07080b]/95 backdrop-blur-xl shadow-[0_16px_44px_-30px_rgba(0,0,0,0.95)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-3">
            <Logo size={42} />
            <span className="font-[family-name:var(--font-sora)] text-[17px] font-semibold tracking-[-0.01em]">
              CMA Studio
            </span>
            <span className="rounded-full border border-[#bc9863]/30 bg-[#bc9863]/8 px-2 py-0.5 font-mono text-[8px] tracking-[0.16em] text-[#bc9863] uppercase">beta</span>
          </Link>
          <div className="flex items-center gap-5 font-mono text-[13px] text-[#8b8f99]">
            <Link href="/#studio" className="transition hover:text-[#e7cfa3]">The tool</Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-4 py-2.5 text-[13.5px] font-semibold text-black transition hover:brightness-105"
            >
              Sign in <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-10">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <div className="mb-4 font-mono text-[11px] tracking-[0.26em] text-[#bc9863] uppercase">Pricing</div>
          <h1 className="font-[family-name:var(--font-sora)] text-[clamp(2.2rem,5vw,3.6rem)] font-bold tracking-[-0.035em]">
            One tool. <span className="bg-gradient-to-r from-[#e7cfa3] to-[#bc9863] bg-clip-text text-transparent">Priced simply.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-[1.05rem] leading-relaxed text-[#8b8f99]">
            Pay a flat monthly or yearly fee for CMA Studio Pro. Renders run on your own Fal.ai key — we never mark up
            your compute. Clear monthly caps, extend anytime.
          </p>
        </div>

        <PricingView />

        {/* more tools coming — students keep their discount forever */}
        <div className="mx-auto mt-16 max-w-3xl rounded-2xl border border-[#bc9863]/18 bg-[#bc9863]/[0.04] px-6 py-7 text-center">
          <div className="mb-2 font-mono text-[10px] tracking-[0.24em] text-[#bc9863] uppercase">More tools are coming</div>
          <p className="text-[15px] leading-relaxed text-[#c7c2b8]">
            CMA Studio Pro is the first of a growing family of tools. <span className="text-[#f4efe6]">Enrolled students keep
            their discount on every future tool and upgrade</span> — for as long as they&apos;re with the Academy.
          </p>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/6 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 font-mono text-[12px] tracking-[0.04em] text-[#8b909e] sm:flex-row">
          <span>© 2026 CineMaster Academy · CMA Studio Pro</span>
          <div className="flex items-center gap-5">
            <a href="mailto:hello@cinemasteracademy.com?subject=CMA%20Studio%20Pro" className="transition hover:text-[#e7cfa3]">
              Any questions? Contact us
            </a>
            <span>
              Powered by{' '}
              <a href="https://cinemasteracademy.com" target="_blank" rel="noopener" className="text-[#bc9863] transition hover:opacity-75">
                CineMaster Academy
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
