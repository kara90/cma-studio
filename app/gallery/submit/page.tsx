import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { TrademarkNotice } from '@/components/TrademarkNotice';
import { SubmitForm } from '@/components/gallery/SubmitForm';

export const metadata: Metadata = {
  title: 'Submit your work | CMA Studio',
  description: 'Submit a render to the CMA Studio community wall. Every piece is reviewed before it appears.',
};

export default function GallerySubmitPage() {
  return (
    <div className="relative min-h-screen">
      <SiteHeader />

      <main className="relative z-10 mx-auto max-w-2xl px-6 pb-24 pt-10">
        <div className="mx-auto mb-8 max-w-xl text-center">
          <div className="mb-3 font-mono text-[11px] tracking-[0.26em] text-[#bc9863] uppercase">Community wall</div>
          <h1 className="font-[family-name:var(--font-sora)] text-[clamp(1.7rem,3.6vw,2.4rem)] font-bold tracking-[-0.03em]">
            Show what you shot.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[0.95rem] leading-relaxed text-[#8b8f99]">
            Made something in the studio you&apos;re proud of? Put it on the wall. Every submission is reviewed before
            it appears on the homepage.
          </p>
        </div>

        <SubmitForm />
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
