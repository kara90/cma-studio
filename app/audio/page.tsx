import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { TrademarkNotice } from '@/components/TrademarkNotice';
import { DirectGenerator } from '@/components/generate/DirectGenerator';

export const metadata: Metadata = {
  title: 'Generate Audio | CMA Studio',
  description:
    'Type a prompt, pick a frontier audio model and render music, voice or sound design on your own Fal.ai key. No credit packs, no markup on compute.',
};

export default function AudioPage() {
  return (
    <div className="relative min-h-screen">
      <SiteHeader />

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-10">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <div className="mb-3 font-mono text-[11px] tracking-[0.26em] text-[#bc9863] uppercase">Direct generation</div>
          <h1 className="font-[family-name:var(--font-sora)] text-[clamp(1.55rem,3.2vw,2.15rem)] font-bold tracking-[-0.03em]">
            Generate audio.
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-[0.95rem] leading-relaxed text-[#8b8f99]">
            Your prompt, your key, every frontier model. No credit packs.
          </p>
        </div>

        <DirectGenerator kind="audio" />
      </main>

      <footer className="relative z-10 border-t border-white/6 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 font-mono text-[12px] tracking-[0.04em] text-[#8b909e] sm:flex-row">
          <span>© 2026 CineMaster Academy · CMA Studio Pro</span>
          <div className="flex items-center gap-5">
            <a href="/privacy" className="transition hover:text-[#e7cfa3]">Privacy</a>
            <a href="/terms" className="transition hover:text-[#e7cfa3]">Terms</a>
            <a href="/refunds" className="transition hover:text-[#e7cfa3]">Refunds</a>
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
        <TrademarkNotice className="mx-auto mt-4 max-w-6xl text-center" />
      </footer>
    </div>
  );
}
