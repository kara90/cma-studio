import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { TrademarkNotice } from '@/components/TrademarkNotice';
import { RealEstateConsole } from '@/components/studios/RealEstateConsole';
import { NotifyForm } from '@/components/studios/NotifyForm';

export const metadata: Metadata = {
  title: 'CMA Real Estate Studio | CMA Studio',
  description:
    'Listing films that sell the home. Drone reveals, floating walk-throughs and twilight exteriors built from your own photos of the property. Preview — rendering opens soon.',
};

export default function RealEstatePage() {
  return (
    <div className="relative min-h-screen">
      <SiteHeader />

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-10">
        {/* ── who this is for, in the agent's own language ── */}
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.03] px-4 py-1.5 font-mono text-[10px] tracking-[0.22em] text-[#8b909e] uppercase">
            CMA Real Estate Studio · Preview
          </div>
          <h1 className="font-[family-name:var(--font-sora)] text-[clamp(2rem,4.6vw,3.2rem)] font-bold tracking-[-0.03em]">
            Listing films that <span className="bg-gradient-to-r from-[#e7cfa3] to-[#bc9863] bg-clip-text text-transparent">sell the home.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15.5px] leading-relaxed text-[#8b8f99]">
            Upload your own photos of the property and turn them into the tour buyers fall for: drone reveals, floating
            walk-throughs, doors opening as the camera glides through, twilight exteriors. No crew, no drone pilot, no
            edit bay.
          </p>
          <p className="mx-auto mt-3 max-w-xl text-[13px] leading-relaxed text-[#8b909e]">
            Built for agents and brokers, not camera operators. Every control below speaks listing, and one preset gets
            you a proven shot. This studio is in preview: explore everything, rendering opens soon.
          </p>
        </div>

        <RealEstateConsole />

        <div className="mx-auto mt-10 max-w-xl">
          <NotifyForm
            source="real-estate"
            title="Be first through the door"
            note="Leave your email and we'll tell you the day Real Estate Studio starts rendering."
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
            <a href="mailto:hello@cinemasteracademy.com?subject=CMA%20Real%20Estate%20Studio" className="transition hover:text-[#e7cfa3]">
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
