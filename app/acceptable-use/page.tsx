/**
 * PLACEHOLDER ONLY. This page is a launch-basics stub: Sebastien finalizes the
 * real Acceptable Use Policy with his attorney. It intentionally mirrors the
 * other legal pages' "working draft" banner and stays high-level until then.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { TrademarkNotice } from '@/components/TrademarkNotice';

export const metadata: Metadata = {
  title: 'Acceptable Use | CMA Studio',
  description: 'The ground rules for using CMA Studio: lawful use, model-provider content rules, and community-gallery standards.',
};

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: 'The spirit of the rules',
    body: [
      'CMA Studio is a professional production tool. Use it to make work you have the right to make, in ways that do not harm other people or the platform.',
      'These ground rules sit alongside the Terms of Service. Where a model provider applies its own content rules to a render on your fal.ai key, those rules also apply to you.',
    ],
  },
  {
    title: 'You agree not to',
    body: [
      'Use the service for anything unlawful, or to create content that is illegal where you or your audience are.',
      'Create content that sexualizes minors in any way. This is an immediate, permanent ban.',
      'Impersonate real people in a deceptive way, or generate defamatory content about real people.',
      'Infringe the intellectual-property rights of others, including submitting work to the community gallery that you did not make or do not have the right to share.',
      'Probe, overload, scrape or abuse the platform, other members, the rate limits, the fair-use caps, or the approval queue.',
      'Resell, sublicense or white-label the service without a written agreement with us.',
    ],
  },
  {
    title: 'Community gallery standards',
    body: [
      'Submit only work you created with CMA Studio and have the right to share. Every submission is reviewed before it appears, and we may decline or remove any submission at any time, at our discretion, without notice.',
    ],
  },
  {
    title: 'Enforcement',
    body: [
      'We may warn, suspend or terminate accounts that break these rules, as described in the Terms of Service. Where the law requires it, we cooperate with lawful requests from authorities.',
    ],
  },
];

export default function AcceptableUsePage() {
  return (
    <div className="relative min-h-screen">
      <header className="relative z-10 border-b border-white/6">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex cursor-pointer items-center gap-2.5">
            <Logo size={32} />
            <span className="font-[family-name:var(--font-sora)] text-[15px] font-semibold text-[#f4efe6]">CMA Studio</span>
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
          Acceptable <span className="text-[#bc9863]">Use.</span>
        </h1>
        <div className="mt-4 inline-flex items-center rounded-lg border border-white/8 px-3 py-1.5 font-mono text-[11px] tracking-[0.14em] text-[#8b8f99] uppercase">
          Working draft, review by counsel before launch
        </div>
        <p className="mt-4 font-mono text-[11px] tracking-[0.14em] text-[#8b909e] uppercase">Last updated: July 17, 2026</p>

        {SECTIONS.map((s, i) => (
          <section key={s.title} className="mt-10">
            <h2 className="font-[family-name:var(--font-sora)] text-[19px] font-semibold tracking-[-0.01em] text-[#f4efe6]">
              {i + 1}. {s.title}
            </h2>
            {s.body.map((p) => (
              <p key={p.slice(0, 40)} className="mt-3 text-[0.95rem] leading-[1.75] text-[#8b8f99]">
                {p}
              </p>
            ))}
          </section>
        ))}

        <p className="mt-12 text-[0.9rem] leading-[1.75] text-[#8b909e]">
          Questions about these rules:{' '}
          <a href="mailto:hello@cinemasteracademy.com?subject=Acceptable%20Use" className="text-[#bc9863] transition hover:text-[#e7cfa3]">
            hello@cinemasteracademy.com
          </a>
          . See also the{' '}
          <Link href="/terms" className="text-[#bc9863] transition hover:text-[#e7cfa3]">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-[#bc9863] transition hover:text-[#e7cfa3]">
            Privacy Policy
          </Link>
          .
        </p>
        <TrademarkNotice className="mt-10" />
      </main>
    </div>
  );
}
