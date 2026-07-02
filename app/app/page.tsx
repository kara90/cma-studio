import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { Reveal } from '@/components/Reveal';
import { InstallGuide } from '@/components/InstallGuide';

export const metadata: Metadata = {
  title: 'Get the app | CMA Studio',
  description:
    'Install CMA Studio on your iPhone, Android phone, tablet or computer — same account, same key, same library. No app store needed, free, updates itself.',
};

/**
 * /app — the canonical install page. Every "Get the app" button on the site
 * points here; it is also a clean shareable link for emails and socials.
 */
export default function GetAppPage() {
  return (
    <div className="relative min-h-screen">
      <SiteHeader />

      <main className="relative z-10 mx-auto max-w-3xl px-5 pb-24 sm:px-6">
        <Reveal className="pt-10 pb-10 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192.png"
            alt="CMA Studio app icon"
            className="mx-auto mb-6 h-20 w-20 rounded-3xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.7)]"
          />
          <div className="mb-4 font-mono text-[11px] tracking-[0.26em] text-[#bc9863] uppercase">In your pocket</div>
          <h1 className="font-[family-name:var(--font-sora)] text-[clamp(2rem,6vw,3rem)] font-bold tracking-[-0.03em]">
            The studio, <span className="text-[#bc9863]">installed.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-[#8b8f99]">
            CMA Studio installs straight from this page — no app store, nothing to sign up for twice. Same account,
            same key, same library as the website, and it updates itself.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 font-mono text-[10px] tracking-[0.12em] text-[#8b909e] uppercase">
            <span className="rounded-full border border-white/10 px-3 py-1.5">Free</span>
            <span className="rounded-full border border-white/10 px-3 py-1.5">30 seconds</span>
            <span className="rounded-full border border-white/10 px-3 py-1.5">iPhone · Android · iPad · Desktop</span>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <InstallGuide />
        </Reveal>
      </main>

      <footer className="relative z-10 border-t border-white/6 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 font-mono text-[12px] tracking-[0.04em] text-[#8b909e] sm:flex-row">
          <span>© 2026 CineMaster Academy · CMA Studio Pro</span>
          <div className="flex items-center gap-5">
            <a href="/privacy" className="transition hover:text-[#e7cfa3]">Privacy</a>
            <a href="/terms" className="transition hover:text-[#e7cfa3]">Terms</a>
            <a href="/refunds" className="transition hover:text-[#e7cfa3]">Refunds</a>
            <a href="mailto:hello@cinemasteracademy.com?subject=CMA%20Studio%20app" className="transition hover:text-[#e7cfa3]">
              Contact us
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
