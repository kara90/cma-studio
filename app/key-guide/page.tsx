import type { Metadata } from 'next';
import Link from 'next/link';
import { KeyRound, CreditCard, Copy, ClipboardPaste, ShieldCheck, ExternalLink } from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { Reveal } from '@/components/Reveal';

export const metadata: Metadata = {
  title: 'Key guide (5 minutes) | CMA Studio',
  description:
    'Step-by-step walkthrough: create a free fal.ai account, add a payment method, generate your API key, and paste it into CMA Studio. About five minutes, once.',
};

/**
 * /key-guide — the hand-holding walkthrough for the one setup step cold
 * visitors fear. Structure: 4 numbered steps, each with a TODO screenshot
 * slot, plus a trust block restating the key-handling rules.
 */

const STEPS = [
  {
    icon: KeyRound,
    title: 'Create a free fal.ai account',
    body: 'Go to fal.ai and sign up with your email or Google account. fal is the render infrastructure CMA Studio runs on: a serious, developer-grade platform that hosts the models. The account is free and takes about two minutes.',
    link: { href: 'https://fal.ai', label: 'Open fal.ai in a new tab' },
    shot: 'TODO screenshot: fal.ai signup page',
  },
  {
    icon: CreditCard,
    title: 'Add a payment method to fal',
    body: 'In your fal dashboard, open Billing and add a card. This is how fal bills your renders directly, at their published rates. CMA Studio never sees this card and never touches your compute money. You only pay for what you render, and you can set spending limits in your fal dashboard.',
    link: { href: 'https://fal.ai/dashboard/billing', label: 'Open fal billing' },
    shot: 'TODO screenshot: fal billing page with the add-card button circled',
  },
  {
    icon: Copy,
    title: 'Generate your API key',
    body: 'In the fal dashboard, open Keys and click Add key. Give it any name, for example "CMA Studio". fal shows you the key once: copy it. If you ever lose it, just delete it there and make a new one.',
    link: { href: 'https://fal.ai/dashboard/keys', label: 'Open fal keys' },
    shot: 'TODO screenshot: fal keys page with the copy button circled',
  },
  {
    icon: ClipboardPaste,
    title: 'Paste it into CMA Studio',
    body: 'Back in CMA Studio, every generator page has a key vault at the top. Paste your key and press Connect. Done: the key lives in your browser, is used only at render time, and is never stored on our servers. You will not need to touch this again.',
    link: { href: '/video', label: 'Open the video generator' },
    shot: 'TODO screenshot: the CMA key vault with the paste field highlighted',
  },
] as const;

export default function KeyGuidePage() {
  return (
    <div className="relative min-h-screen">
      <SiteHeader />

      <main className="relative z-10 mx-auto max-w-3xl px-5 pb-24 sm:px-6">
        <Reveal className="pt-10 pb-10 text-center">
          <div className="mb-4 font-mono text-[11px] tracking-[0.26em] text-[#bc9863] uppercase">One-time setup</div>
          <h1 className="font-[family-name:var(--font-sora)] text-[clamp(2rem,6vw,3rem)] font-bold tracking-[-0.03em]">
            Your fal key, <span className="text-[#bc9863]">in 5 minutes.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-[#8b8f99]">
            One free account, one card, one key, one paste. You do this once, and from then on every render bills your
            own fal account at published rates with no markup from us.
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <ol className="flex flex-col gap-5">
            {STEPS.map((s, i) => (
              <li key={s.title} className="glass rounded-3xl p-6 sm:p-8">
                <div className="mb-4 flex items-center gap-4">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] font-[family-name:var(--font-sora)] text-[16px] font-bold text-black">
                    {i + 1}
                  </span>
                  <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl border border-[#bc9863]/30 bg-[#bc9863]/8 text-[#e7cfa3]">
                    <s.icon size={22} />
                  </span>
                  <h2 className="font-[family-name:var(--font-sora)] text-[18px] leading-snug font-semibold text-[#f4efe6]">
                    {s.title}
                  </h2>
                </div>
                <p className="text-[14.5px] leading-relaxed text-[#8b8f99]">{s.body}</p>
                <a
                  href={s.link.href}
                  target={s.link.href.startsWith('http') ? '_blank' : undefined}
                  rel={s.link.href.startsWith('http') ? 'noopener' : undefined}
                  className="mt-4 inline-flex items-center gap-1.5 font-mono text-[12px] tracking-[0.12em] text-[#bc9863] uppercase transition hover:text-[#e7cfa3]"
                >
                  {s.link.label} <ExternalLink size={12} />
                </a>
                {/* TODO screenshot slot — replace with a real capture */}
                <div className="mt-5 grid aspect-[2/1] w-full place-items-center rounded-2xl border border-white/8 bg-black/40">
                  <span className="px-6 text-center font-mono text-[10px] tracking-[0.12em] text-[#575b64] uppercase">{s.shot}</span>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="glass glass-gold mt-8 flex items-start gap-3 rounded-2xl border border-[#bc9863]/25 p-5">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#bc9863]" />
            <p className="text-[13.5px] leading-relaxed text-[#8b8f99]">
              How your key is handled: it stays in your browser, it is sent only at the moment you render, and it is
              never stored on CMA servers. Revoke it anytime from your fal dashboard and nothing on our side holds a
              copy.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.16}>
          <div className="mt-10 text-center">
            <Link
              href="/video"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-8 py-3.5 text-[15px] font-semibold text-black shadow-[0_14px_44px_rgba(188,152,99,0.36)] transition hover:-translate-y-0.5 hover:brightness-105"
            >
              Key ready? Start rendering
            </Link>
          </div>
        </Reveal>
      </main>

      <footer className="relative z-10 border-t border-white/6 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 font-mono text-[12px] tracking-[0.04em] text-[#8b909e] sm:flex-row">
          <span>© 2026 CineMaster Academy · CMA Studio Pro</span>
          <div className="flex items-center gap-5">
            <a href="/faq" className="transition hover:text-[#e7cfa3]">FAQ</a>
            <a href="/privacy" className="transition hover:text-[#e7cfa3]">Privacy</a>
            <a href="/terms" className="transition hover:text-[#e7cfa3]">Terms</a>
            <a href="/refunds" className="transition hover:text-[#e7cfa3]">Refunds</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
