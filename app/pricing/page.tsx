import type { Metadata } from 'next';
import { PricingView } from '@/components/pricing/PricingView';
import { SiteHeader } from '@/components/SiteHeader';
import { TrademarkNotice } from '@/components/TrademarkNotice';
import { HonestNote } from '@/components/marketing/HonestNote';

export const metadata: Metadata = {
  title: 'Pricing | CMA Studio | CineMaster Academy',
  description: 'A low flat fee for the software. Renders run on your own Fal.ai key at fal\'s own rate, with no markup and no expiring credits.',
};

export default function PricingPage() {
  return (
    <div className="relative min-h-screen">
      {/* full platform nav (defaults) — buyers should never lose the menu here */}
      <SiteHeader cta={{ href: '/login', label: 'Sign in' }} />

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-10">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <div className="mb-4 font-mono text-[11px] tracking-[0.26em] text-[#bc9863] uppercase">Pricing</div>
          <h1 className="font-[family-name:var(--font-sora)] text-[clamp(2.2rem,5vw,3.6rem)] font-bold tracking-[-0.035em]">
            Unlimited studio. <span className="bg-gradient-to-r from-[#e7cfa3] to-[#bc9863] bg-clip-text text-transparent">One flat fee.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-[1.05rem] leading-relaxed text-[#8b8f99]">
            Unlimited use of the interface and every generator, for one low flat fee. No credits, no expiring budget:
            your unused money never evaporates at the end of the month.
          </p>
          <p className="mx-auto mt-3 max-w-lg font-mono text-[12px] tracking-[0.04em] text-[#8b909e]">
            Compute always runs on your own fal.ai key at fal&apos;s rate. We never mark it up.
          </p>
        </div>

        <PricingView />

        {/* honest expectations, right where the buying decision happens */}
        <div className="mx-auto mt-14 max-w-3xl">
          <HonestNote />
        </div>

        {/* more tools coming */}
        <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-[#bc9863]/18 bg-[#bc9863]/[0.04] px-6 py-7 text-center">
          <div className="mb-2 font-mono text-[10px] tracking-[0.24em] text-[#bc9863] uppercase">More tools are coming</div>
          <p className="text-[15px] leading-relaxed text-[#c7c2b8]">
            CMA Director Studio is the first of a growing family of tools we are building for serious film production.{' '}
            <span className="text-[#f4efe6]">Plans cover today&apos;s toolset and may evolve as new tools join, always announced before your next billing cycle.</span>
          </p>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/6 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 font-mono text-[12px] tracking-[0.04em] text-[#8b909e] sm:flex-row">
          <span>© 2026 CineMaster Academy · CMA Studio</span>
          <div className="flex items-center gap-5">
            <a href="/studio" className="font-semibold text-[#bc9863] transition hover:text-[#e7cfa3]">Director Studio ★</a>
            <a href="/faq" className="transition hover:text-[#e7cfa3]">FAQ</a>
            <a href="/privacy" className="transition hover:text-[#e7cfa3]">Privacy</a>
            <a href="/terms" className="transition hover:text-[#e7cfa3]">Terms</a>
            <a href="/refunds" className="transition hover:text-[#e7cfa3]">Refunds</a>
            <a href="mailto:hello@cinemasteracademy.com?subject=CMA%20Studio" className="transition hover:text-[#e7cfa3]">
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
        <TrademarkNotice className="mx-auto mt-4 max-w-6xl text-center" />
      </footer>
    </div>
  );
}
