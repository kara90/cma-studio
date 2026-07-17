import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { TrademarkNotice } from '@/components/TrademarkNotice';
import { MarketingConsole } from '@/components/studios/MarketingConsole';
import { NotifyForm } from '@/components/studios/NotifyForm';

export const metadata: Metadata = {
  title: 'CMA Marketing Studio | CMA Studio',
  description:
    'Product ads that convert. Upload your product shot, describe the ad, pick a backdrop and an action. Preview — rendering opens soon.',
};

export default function MarketingPage() {
  return (
    <div className="relative min-h-screen">
      <SiteHeader />

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-10">
        {/* ── who this is for, in the marketer's own language ── */}
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.03] px-4 py-1.5 font-mono text-[10px] tracking-[0.22em] text-[#8b909e] uppercase">
            CMA Marketing Studio · Preview
          </div>
          <h1 className="font-[family-name:var(--font-sora)] text-[clamp(2rem,4.6vw,3.2rem)] font-bold tracking-[-0.03em]">
            Product ads that <span className="bg-gradient-to-r from-[#e7cfa3] to-[#bc9863] bg-clip-text text-transparent">convert.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15.5px] leading-relaxed text-[#8b8f99]">
            Upload your product shot, say what you want the ad to do, and pick the stage: studio black, beach, marble,
            a hero reveal, a slow 360, a liquid splash. A finished commercial without a set day, a crew, or an agency
            invoice.
          </p>
          <p className="mx-auto mt-3 max-w-xl text-[13px] leading-relaxed text-[#8b909e]">
            Built for brands and marketers, not cinematographers. Clean sharp lenses are the default and every control
            speaks commercial. This studio is in preview: explore everything, rendering opens soon.
          </p>
        </div>

        <MarketingConsole />

        <div className="mx-auto mt-10 max-w-xl">
          <NotifyForm
            source="marketing"
            title="Get the launch email"
            note="Leave your email and we'll tell you the day Marketing Studio starts rendering."
          />
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/6 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 font-mono text-[12px] tracking-[0.04em] text-[#8b909e] sm:flex-row">
          <span>© 2026 CineMaster Academy · CMA Studio</span>
          <div className="flex items-center gap-5">
            <a href="/privacy" className="transition hover:text-[#e7cfa3]">Privacy</a>
            <a href="/terms" className="transition hover:text-[#e7cfa3]">Terms</a>
            <a href="/refunds" className="transition hover:text-[#e7cfa3]">Refunds</a>
            <a href="mailto:hello@cinemasteracademy.com?subject=CMA%20Marketing%20Studio" className="transition hover:text-[#e7cfa3]">
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
