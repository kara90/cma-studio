import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/Logo';

export const metadata: Metadata = {
  title: 'Privacy Policy | CMA Studio',
  description:
    'How CMA Studio handles your data. Your fal.ai key is never stored, renders run on your own fal account, and Stripe handles all payment data.',
};

const SECTIONS = [
  {
    h: 'Your fal.ai key',
    p: 'CMA Studio is Bring Your Own Key. Your fal.ai key is used to run renders on your own fal account and is never stored on our servers. Revoke it from your fal dashboard at any time and it stops working here instantly.',
  },
  {
    h: 'Your renders',
    p: 'Generations run on your fal account under fal.ai’s own terms. fal deletes its copies after about 7 days. We cache and index your renders for you, with retention set by your plan tier, so you can browse and re-download them.',
  },
  {
    h: 'Payments',
    p: 'All payment data is handled by Stripe. Card numbers never touch our servers. We keep only what we need to run your subscription, such as your email, plan tier and billing status.',
  },
  {
    h: 'What we collect',
    p: 'Your account email, plan details, and the prompts and settings needed to run and index your renders. We do not sell your data, and we do not train models on your work.',
  },
];

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[#bc9863]/18 bg-[#07080b]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-3">
            <Logo size={38} />
            <span className="font-[family-name:var(--font-sora)] text-[16px] font-semibold tracking-[-0.01em]">
              CMA Studio
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 font-mono text-[12px] tracking-[0.14em] text-[#8b8f99] uppercase transition hover:text-[#e7cfa3]"
          >
            <ArrowLeft size={14} /> Back home
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-6 pb-24 pt-14">
        <div className="mb-4 font-mono text-[11px] tracking-[0.26em] text-[#bc9863] uppercase">Legal</div>
        <h1 className="font-[family-name:var(--font-sora)] text-[clamp(2rem,5vw,3rem)] font-bold tracking-[-0.03em]">
          Privacy <span className="text-[#bc9863]">Policy.</span>
        </h1>
        <div className="mt-4 inline-flex items-center rounded-lg border border-white/8 px-3 py-1.5 font-mono text-[11px] tracking-[0.14em] text-[#8b8f99] uppercase">
          Draft, final text coming before launch
        </div>

        <div className="glass glass-gold mt-10 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col gap-8">
            {SECTIONS.map((s) => (
              <section key={s.h}>
                <h2 className="mb-2 font-[family-name:var(--font-sora)] text-[1.05rem] font-semibold text-[#f4efe6]">
                  {s.h}
                </h2>
                <p className="text-[0.93rem] leading-relaxed text-[#8b8f99]">{s.p}</p>
              </section>
            ))}
          </div>
        </div>

        <p className="mt-8 text-[13px] leading-relaxed text-[#8b909e]">
          Questions about your data? Write to{' '}
          <a
            href="mailto:hello@cinemasteracademy.com"
            className="cursor-pointer text-[#e7cfa3] underline underline-offset-2 transition hover:opacity-80"
          >
            hello@cinemasteracademy.com
          </a>
          .
        </p>
      </main>
    </div>
  );
}
