import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { ReviewQueue } from '@/components/gallery/ReviewQueue';

export const metadata: Metadata = {
  title: 'Review queue | CMA Studio',
  robots: { index: false, follow: false }, // owner console — never indexed
};

export default function GalleryQueuePage() {
  return (
    <div className="relative min-h-screen">
      <SiteHeader />

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-10">
        <div className="mx-auto mb-8 max-w-xl text-center">
          <div className="mb-3 font-mono text-[11px] tracking-[0.26em] text-[#bc9863] uppercase">Owner console</div>
          <h1 className="font-[family-name:var(--font-sora)] text-[clamp(1.7rem,3.6vw,2.4rem)] font-bold tracking-[-0.03em]">
            Gallery review queue.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[0.95rem] leading-relaxed text-[#8b8f99]">
            Approve puts a submission on the public wall. Reject deletes it. Nothing publishes without you.
          </p>
        </div>

        <ReviewQueue />
      </main>
    </div>
  );
}
