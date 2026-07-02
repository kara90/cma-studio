import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/Logo';

export const metadata: Metadata = {
  title: 'Terms of Service | CMA Studio',
  description:
    'Terms for CMA Studio. A flat software fee, compute billed by fal.ai directly to you, model provider content rules, and retention by tier.',
};

const SECTIONS = [
  {
    h: 'The fee',
    p: 'You pay a flat software fee for CMA Studio. It covers the tool, the prompt engineering pipeline, and your render library. It does not include compute. Compute runs on your own fal.ai key and is billed by fal directly to you, at fal’s own rate, with no markup from us.',
  },
  {
    h: 'Model content rules',
    p: 'Every model provider enforces its own content rules and may decline a generation. Prohibited material and likenesses of real public figures are blocked by the models themselves. CMA Studio cannot and will not override those rules.',
  },
  {
    h: 'Blocked or imperfect renders',
    p: 'A blocked or imperfect generation may still consume compute on your fal account. That charge sits between you and the model provider, so we cannot refund it. Our commitment is tuning every prompt so misses stay rare.',
  },
  {
    h: 'Retention and fair use',
    p: 'fal deletes generated files after about 7 days. Your plan keeps renders cached and indexed with retention by tier, subject to a fair use cap. Download anything you want to keep permanently.',
  },
];

export default function TermsPage() {
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
          Terms of <span className="text-[#bc9863]">Service.</span>
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
          Questions about these terms? Write to{' '}
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
