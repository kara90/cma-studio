/**
 * TEMPLATE ONLY. This document is not legal advice. Sebastien must have a
 * licensed attorney review and approve every clause before launch.
 *
 * app/privacy/page.tsx - Privacy Policy for CMA Studio.
 * Facts anchored to the codebase: BYOK (components/studio/ApiKeyVault.tsx:
 * fal key lives in the browser, sent per render, never stored server-side),
 * uploaded frames go from the browser straight to fal storage on the user's
 * own key (lib/falUpload.ts; data-URI fallback transits our render pipeline
 * in the request body but is never stored), Supabase auth, Stripe billing,
 * retention windows in lib/retention.ts (Starter about 30 days, Filmmaker
 * about 90 days, Pro about 1 year, placeholders finalized with lib/plans.ts).
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { OPERATOR_IDENTITY } from '@/lib/legal';
import { TrademarkNotice } from '@/components/TrademarkNotice';

export const metadata: Metadata = {
  title: 'Privacy Policy | CMA Studio',
  description:
    'How CMA Studio handles data. Your fal.ai key is never stored on our servers, card numbers stay with Stripe, and renders are kept for a limited window by plan tier.',
};

/** A section body is a sequence of paragraphs (string) and bullet lists (string[]). */
type Block = string | string[];

interface LegalSection {
  title: string;
  blocks: Block[];
}

const SECTIONS: LegalSection[] = [
  {
    title: 'What We Collect',
    blocks: [
      'We collect only what the Service needs to run:',
      [
        'Account data. Your email address and password, managed through Supabase. Passwords are stored as secure hashes by Supabase; we never see or store them in plain text.',
        'Subscription state. Your plan tier, billing status and a Stripe customer reference, so the app knows what your subscription includes.',
        'Your work. Finished renders cached in your library, plus the short scene notes and settings needed to run and index them.',
        'Basic logs. Technical records such as render requests, errors and timestamps, used to operate and secure the Service.',
      ],
    ],
  },
  {
    title: 'What We Do Not Collect',
    blocks: [
      'Just as important is what never reaches our servers:',
      [
        'No card numbers. All payment card data is held by Stripe and never touches our servers.',
        'No stored fal.ai key. Your fal.ai API key is never stored or logged on our servers. It is saved in your own browser, and at render time it is transmitted through our render pipeline, which runs server side, solely to perform the render you request. Remove it from the app or revoke it in your fal.ai dashboard at any time.',
        'No stored uploads. Start frames, end frames and other reference images you attach to a render are uploaded from your browser directly to fal.ai storage on your own key. If that direct upload is unavailable, the image passes through our render pipeline only in transit to fal.ai. Either way, we do not store your uploads on our servers.',
        'No ad tracking. We run no advertising trackers and no cross-site tracking.',
        'No data sales. We do not sell your personal information, and we do not train AI models on your work.',
      ],
    ],
  },
  {
    title: 'How We Use Your Data',
    blocks: [
      'We use your data to operate your account and sign you in, to run renders and maintain your library, to manage billing through Stripe, to send service messages such as billing notices and retention expiry warnings, to keep the platform secure and prevent abuse, and to meet legal obligations. We do not use your data for third-party advertising.',
    ],
  },
  {
    title: 'Processors and Subprocessors',
    blocks: [
      'We rely on a small set of processors, each limited to its role:',
      [
        'Cloudflare. Hosts the application, serves it at the edge and stores your cached renders.',
        'Supabase. Provides authentication and our database, holding your email, hashed credentials and subscription state.',
        'Stripe. Processes payments and holds all payment card data.',
        'fal.ai. Runs the generation compute. It receives your API key, your prompt and any frames or reference images you attach at render time, and processes them under its own terms and privacy policy.',
      ],
      'Whether a Model Provider uses inputs or outputs to improve its models is governed by that provider’s own terms and policies.',
    ],
  },
  {
    title: 'Storage and Retention',
    blocks: [
      'Finished renders are kept in our storage for a limited window that depends on your plan tier, subject to fair use: about 30 days on Starter, about 90 days on Filmmaker and about 1 year on Pro. The exact window for your plan is shown at purchase and may be updated as plans evolve.',
      [
        'After the retention window expires, or after your subscription ends, renders are scheduled for deletion and then removed from our storage.',
        'Account data is kept while your account is active. If you delete your account, we delete or anonymize your data, except records we must keep for legal reasons, such as billing history.',
        'Download anything you want to keep. Storage is a convenience cache, not an archive, and we cannot guarantee stored files against loss.',
      ],
    ],
  },
  {
    title: 'Cookies',
    blocks: [
      'We use cookies for one purpose: keeping you signed in. The authentication session is the only cookie the app depends on. There are no advertising cookies and no cross-site tracking cookies.',
    ],
  },
  {
    title: 'Your Rights',
    blocks: [
      'You can ask us to access, correct, export or delete the personal data we hold about you at any time by writing to hello@cinemasteracademy.com. We respond to every verified request.',
      [
        'California residents (CCPA). You have the right to know what personal information we collect, to request its deletion and to not be discriminated against for exercising those rights. We do not sell personal information.',
        'EEA and UK residents (GDPR). We process your data to perform our contract with you, to pursue our legitimate interest in running a secure service and to meet legal obligations. You have the rights of access, rectification, erasure, restriction, portability and objection, and the right to complain to your supervisory authority.',
      ],
    ],
  },
  {
    title: 'Children',
    blocks: [
      'The Service is not directed to anyone under 18, and we do not knowingly collect data from minors. If you believe a minor has created an account, contact us at hello@cinemasteracademy.com and we will delete it.',
    ],
  },
  {
    title: 'International Transfers',
    blocks: [
      'Our processors operate globally, with infrastructure primarily in the United States. Your data may be processed outside your country of residence. Where the law requires it, transfers rely on recognized safeguards, such as standard contractual clauses implemented by our processors.',
    ],
  },
  {
    title: 'Changes to This Policy',
    blocks: [
      'We may update this policy as the Service evolves. If a change is material, we will announce it in advance by email or in the app. The current version, with its date, always lives at this page. Continued use of the Service after a change takes effect constitutes acceptance.',
    ],
  },
  {
    title: 'Security',
    blocks: [
      'We use reasonable technical and organizational safeguards to protect account data, including encryption in transit, access controls, and the key-handling practices described above. Staff access to your prompts, scene notes, and renders is limited to what is needed to operate the Service and support you. No method of transmission or storage is completely secure, and we cannot guarantee absolute security. If a breach affecting your personal information occurs, we will notify you as required by applicable law.',
    ],
  },
  {
    title: 'Contact',
    blocks: [
      'Privacy questions and requests go to hello@cinemasteracademy.com. A real person reads and answers them.',
      OPERATOR_IDENTITY,
    ],
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
          Working draft, review by counsel before launch
        </div>
        <p className="mt-4 font-mono text-[11px] tracking-[0.14em] text-[#8b909e] uppercase">
          Last updated: July 18, 2026
        </p>
        <p className="mt-6 text-[0.95rem] leading-[1.75] text-[#8b8f99]">
          This policy covers CMA Studio, operated by CineMaster Academy. The design principle behind the product is
          also our privacy principle: hold as little as possible. Card numbers live with Stripe, your fal.ai key is
          never stored on our servers, and we keep only what your account needs to work.
        </p>

        <div className="glass glass-gold mt-10 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col gap-10">
            {SECTIONS.map((s, i) => (
              <section key={s.title} id={`section-${i + 1}`} className="scroll-mt-24">
                <h2 className="mb-3 font-[family-name:var(--font-sora)] text-[1.05rem] font-semibold text-[#f4efe6]">
                  <span className="mr-2 text-[#bc9863]">{i + 1}.</span>
                  {s.title}
                </h2>
                <div className="flex flex-col gap-3">
                  {s.blocks.map((block, j) =>
                    Array.isArray(block) ? (
                      <ul key={j} className="flex flex-col gap-2.5">
                        {block.map((item) => (
                          <li key={item} className="flex gap-3 text-[0.93rem] leading-[1.75] text-[#8b8f99]">
                            <span aria-hidden className="mt-[11px] h-1 w-1 flex-none rounded-full bg-[#bc9863]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p key={j} className="text-[0.93rem] leading-[1.75] text-[#8b8f99]">
                        {block}
                      </p>
                    ),
                  )}
                </div>
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
          . See also our{' '}
          <Link href="/terms" className="cursor-pointer text-[#e7cfa3] underline underline-offset-2 transition hover:opacity-80">
            Terms of Service
          </Link>
          .
        </p>
        <TrademarkNotice className="mt-6" />
      </main>
    </div>
  );
}
