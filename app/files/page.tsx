import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { LibraryClient } from './LibraryClient';

export const metadata: Metadata = {
  title: 'Your Library | CMA Studio',
  description:
    'Every finished render, synced to your account and kept for your plan\'s storage window. Open or download anything you made.',
};

export default function FilesPage() {
  return (
    <div className="relative min-h-screen">
      <SiteHeader />

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-10">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <div className="mb-4 font-mono text-[11px] tracking-[0.26em] text-[#bc9863] uppercase">Your library</div>
          <h1 className="font-[family-name:var(--font-sora)] text-[clamp(2.2rem,5vw,3.6rem)] font-bold tracking-[-0.035em]">
            Everything <span className="bg-gradient-to-r from-[#e7cfa3] to-[#bc9863] bg-clip-text text-transparent">you made.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-[1.05rem] leading-relaxed text-[#8b8f99]">
            Every finished render, synced to your account and kept for your plan&apos;s storage window.
          </p>
        </div>

        <LibraryClient />
      </main>

      <footer className="relative z-10 border-t border-white/6 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 font-mono text-[12px] tracking-[0.04em] text-[#8b909e] sm:flex-row">
          <span>© 2026 CineMaster Academy · CMA Studio Pro</span>
          <div className="flex items-center gap-5">
            <a href="/privacy" className="transition hover:text-[#e7cfa3]">Privacy</a>
            <a href="/terms" className="transition hover:text-[#e7cfa3]">Terms</a>
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
