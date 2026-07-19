import type { Metadata } from 'next';
import { Faq } from '@/components/marketing/Faq';
import { GROUPS } from '@/components/marketing/faqData';
import { SiteHeader } from '@/components/SiteHeader';
import { TrademarkNotice } from '@/components/TrademarkNotice';

export const metadata: Metadata = {
  title: 'FAQ | CMA Studio | CineMaster Academy',
  description: 'Straight answers on keys, costs, rendering, storage and your work on CMA Studio.',
  alternates: { canonical: '/faq' },
};

// FAQPage structured data, built from the same GROUPS the page renders (one
// source of truth) so search engines can surface the Q&A as rich results.
const FAQ_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: GROUPS.flatMap((g) =>
    g.items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  ),
};

/**
 * /faq — the full FAQ lives on its own page, linked from the footers (Sebastien:
 * not on the homepage directly).
 */
export default function FaqPage() {
  return (
    <div className="relative min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <SiteHeader />

      <main className="relative z-10 pt-6 pb-24">
        {/* the Faq component carries its own header — no duplicate hero here */}
        <Faq />
      </main>

      <footer className="relative z-10 border-t border-white/6 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 font-mono text-[12px] tracking-[0.04em] text-[#8b909e] sm:flex-row">
          <span>© 2026 CineMaster Academy · CMA Studio</span>
          <div className="flex items-center gap-5">
            <a href="/privacy" className="transition hover:text-[#e7cfa3]">Privacy</a>
            <a href="/terms" className="transition hover:text-[#e7cfa3]">Terms</a>
            <a href="/refunds" className="transition hover:text-[#e7cfa3]">Refunds</a>
            <a href="mailto:hello@cinemasteracademy.com?subject=CMA%20Studio" className="transition hover:text-[#e7cfa3]">
              Contact us
            </a>
          </div>
        </div>
        <TrademarkNotice className="mx-auto mt-4 max-w-6xl text-center" />
      </footer>
    </div>
  );
}
