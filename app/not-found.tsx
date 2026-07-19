import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { TrademarkNotice } from '@/components/TrademarkNotice';

/**
 * Custom 404 — a bogus path lands here inside the app's atmosphere/shell
 * instead of Next's stock black system page.
 */
export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-24">
        <div className="mx-auto max-w-lg text-center">
          <div className="mb-4 font-mono text-[11px] tracking-[0.3em] text-[#bc9863] uppercase">Error 404</div>
          <h1 className="font-[family-name:var(--font-sora)] text-[clamp(2rem,6vw,3.4rem)] font-bold tracking-[-0.035em]">
            This shot isn&apos;t <span className="bg-gradient-to-r from-[#e7cfa3] to-[#bc9863] bg-clip-text text-transparent">on the reel.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[0.95rem] leading-relaxed text-[#8b8f99]">
            The page you were after doesn&apos;t exist or has moved. Everything is still one step away.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-6 py-3 text-[15px] font-semibold text-black transition hover:brightness-105"
            >
              Back home <ArrowRight size={16} />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex min-h-[40px] items-center gap-2 font-mono text-[12px] tracking-[0.14em] text-[#8b8f99] uppercase transition hover:text-[#e7cfa3]"
            >
              See plans →
            </Link>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/6 px-6 py-8">
        <TrademarkNotice className="mx-auto max-w-6xl text-center" />
      </footer>
    </div>
  );
}
