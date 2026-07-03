/**
 * TEMPLATE ONLY. This document is not legal advice. Sebastien must have a
 * licensed attorney review and approve every clause before launch.
 *
 * app/refunds/page.tsx - Refund & Cancellation Policy for CMA Studio.
 * Business rules set by Sebastien (2026-07-02): yearly plans are
 * non-refundable except a pro-rata refund for an extended platform outage
 * that is OUR fault; monthly plans cancel anytime effective at the end of
 * the paid month, with no further charges. Compute never touches our books:
 * it is billed by fal.ai directly on the user's own key, so it is expressly
 * out of scope here. Incorporated by reference into the Terms of Service.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/Logo';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy | CMA Studio',
  description:
    'How refunds and cancellation work at CMA Studio: monthly plans cancel anytime and simply stop renewing, yearly plans are non-refundable except for an extended platform outage on our side, and compute is billed by fal.ai directly to you and is never ours to refund.',
};

type Block = string | string[];

interface LegalSection {
  title: string;
  blocks: Block[];
}

const SECTIONS: LegalSection[] = [
  {
    title: 'What This Policy Covers',
    blocks: [
      'This Refund & Cancellation Policy applies to the CMA Studio software subscription: the plan tiers shown on our pricing page, billed monthly or yearly, and any recurring storage top-ups. It forms part of, and is incorporated into, our Terms of Service. If anything in this policy conflicts with a right that the law of your country gives you and that cannot be waived, the law wins.',
      'It does not cover compute. Every render runs on your own fal.ai key and fal.ai bills you directly, under fal.ai’s own terms. We never receive that money, we cannot see those charges and we cannot reverse or refund them — including for renders that fail, disappoint or violate a model provider’s content rules. Questions about compute charges go to fal.ai.',
    ],
  },
  {
    title: 'Monthly Plans',
    blocks: [
      'Monthly plans are commitment-free. You can cancel at any time, and cancellation takes effect at the end of the month you have already paid for: you keep full access until that date, and you are not charged again.',
      'We do not refund the current month or parts of it — cancelling simply stops the next charge. This keeps monthly pricing simple and low: you only ever risk one month.',
    ],
  },
  {
    title: 'Yearly Plans',
    blocks: [
      'Yearly plans are discounted because they are a commitment for the full year, and they carry a 14-day money-back guarantee: if the plan is not for you, email us within 14 days of your first yearly payment and we refund that payment in full.',
      'After the 14-day window, the remainder of the year is non-refundable, except as set out in the Extended Outage section below or where applicable law requires otherwise.',
      'You can cancel a yearly plan at any time. Cancellation stops the renewal: you keep full access until the end of the year you have already paid for, and you are not charged again.',
      'Before a yearly plan renews, we send a reminder to the email on your account so a renewal never takes you by surprise.',
    ],
  },
  {
    title: 'The One Exception: Extended Platform Outage',
    blocks: [
      'If CMA Studio itself is materially unavailable — you cannot sign in, generate or reach your library — for more than seven (7) consecutive days because of a failure in our own systems, you may request a remedy:',
      [
        'On a yearly plan: a pro-rata refund of the unused remainder of your year, or (your choice) equivalent service credit.',
        'On a monthly plan: a refund of the month in which the outage occurred.',
      ],
      'This exception does not apply to unavailability caused by things outside our systems, including: outages, degradation or moderation decisions at fal.ai or any model provider; problems with your own fal.ai account, key or billing; your device, network or internet provider; scheduled maintenance we announced in advance; events beyond our reasonable control (force majeure); or suspension of your account for a breach of the Terms of Service.',
      'To claim it, email hello@cinemasteracademy.com from your account email within 30 days of the outage ending. We verify the outage against our own monitoring and respond within 10 business days.',
      'Separately from outages: if we ever discontinue CMA Studio, or terminate your account without cause, before a period you have paid for ends, we refund the unused remainder pro-rata. You never pay for time we chose not to deliver.',
    ],
  },
  {
    title: 'Top-Ups',
    blocks: [
      'Recurring top-ups follow the monthly rules: cancel anytime, the top-up stays active until the end of the period you paid for, no partial-period refunds, and no further charges after cancellation. Cancelling a top-up never touches your base plan.',
      'Any CMA top-up, storage or generations, never expires while your subscription is active.',
    ],
  },
  {
    title: 'How to Cancel',
    blocks: [
      'Cancelling must be as easy as subscribing — no calls, no chats with a retention team, no hoops:',
      [
        'From your account: manage your subscription through the billing portal and cancel with a click.',
        'By email: write to hello@cinemasteracademy.com from your account email with the word "cancel". We confirm within 2 business days, effective as of the day you wrote.',
      ],
      'After cancellation your access continues to the end of the paid period. Your renders remain available for whatever remains of your plan’s retention window — download anything you want to keep before your access ends.',
    ],
  },
  {
    title: 'Automatic Renewal and Your Locked Rate',
    blocks: [
      'All subscriptions renew automatically at the end of each billing period until you cancel, and they renew at YOUR rate: the price you subscribed at is locked for as long as you stay subscribed. Price changes apply to new subscribers only. If your subscription lapses and you return later, the rates in force at that time apply.',
    ],
  },
  {
    title: 'EU, UK and Other Statutory Withdrawal Rights',
    blocks: [
      'If you are a consumer in the European Union, the United Kingdom or another jurisdiction with a mandatory cooling-off or withdrawal right, that right is yours and we honor it as the law requires. Because the subscription is a digital service, using it does not erase the right: you may withdraw within 14 days of subscribing even if you have already rendered.',
      'When you subscribe, you expressly request that the Service start immediately rather than after the withdrawal window. If you then withdraw within the statutory window, we refund what you paid minus a proportionate amount for the part of the period that has already run, and the refund reaches you within 14 days. If you withdraw without having used the Service at all, we refund you in full.',
    ],
  },
  {
    title: 'Chargebacks',
    blocks: [
      'If you believe a charge is wrong, contact us first at hello@cinemasteracademy.com — a real person reads it. Duplicate charges and charges made in error are always refunded in full, without argument, as soon as we verify them.',
      'Opening a payment dispute for a charge you knowingly authorized, instead of contacting us, may lead to suspension of your account while the dispute is open. We retain acceptance records (the date and version of the terms you agreed to at signup) and usage records, and we present them in dispute proceedings.',
    ],
  },
  {
    title: 'How Refunds Are Paid',
    blocks: [
      'Approved refunds go back to the original payment method through our payment processor, Stripe. Depending on your bank, the money typically arrives within 5 to 10 business days of approval. We never pay refunds to a different card, account or person.',
    ],
  },
  {
    title: 'Changes to This Policy',
    blocks: [
      'We may update this policy as the Service, the law or our business evolves. Material changes are announced in advance and take effect from your next billing cycle. The version that applies to a charge is the version in force on the day of that charge.',
    ],
  },
  {
    title: 'Contact',
    blocks: [
      'Billing questions and refund requests: hello@cinemasteracademy.com. A real person reads and answers them.',
    ],
  },
];

export default function RefundsPage() {
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
          Refund &amp; Cancellation <span className="text-[#bc9863]">Policy.</span>
        </h1>
        <div className="mt-4 inline-flex items-center rounded-lg border border-white/8 px-3 py-1.5 font-mono text-[11px] tracking-[0.14em] text-[#8b8f99] uppercase">
          Working draft, review by counsel before launch
        </div>
        <p className="mt-4 font-mono text-[11px] tracking-[0.14em] text-[#8b909e] uppercase">
          Last updated: July 2, 2026
        </p>
        <p className="mt-6 text-[0.95rem] leading-[1.75] text-[#8b8f99]">
          The short version: monthly plans cancel anytime, you keep access to the end of the paid month and are
          never charged again. Yearly plans carry a 14-day money-back guarantee; after that window they are
          non-refundable, with one exception: if the platform itself stops working for an extended period because of
          us, we refund the unused time. Compute runs on your own fal.ai key and is billed by fal.ai directly, so it
          is never ours to refund.
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

        <p className="mt-8 text-center text-[0.85rem] text-[#8b909e]">
          See also the{' '}
          <Link href="/terms" className="cursor-pointer text-[#e7cfa3] underline underline-offset-2 transition hover:opacity-80">
            Terms of Service
          </Link>{' '}
          and the{' '}
          <Link href="/privacy" className="cursor-pointer text-[#e7cfa3] underline underline-offset-2 transition hover:opacity-80">
            Privacy Policy
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
