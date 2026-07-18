import type { Metadata } from 'next';
import { Logo } from '@/components/Logo';
import { UnlockForm } from '@/components/UnlockForm';
import { safeNext } from '@/lib/betaGate';

export const metadata: Metadata = {
  title: 'Private beta | CMA Studio',
  description: 'CMA Studio is in private beta.',
  robots: { index: false, follow: false }, // the gate is never indexed
};

export default async function UnlockPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const dest = safeNext(next);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      {/* quiet gold ambience, matches the studio's dark-and-gold language */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
        style={{ background: 'radial-gradient(60% 55% at 50% 38%, rgba(188,152,99,0.12), rgba(5,6,10,0.96) 72%)' }}
      />
      <div className="w-full max-w-sm text-center">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Logo size={52} />
          <span className="font-[family-name:var(--font-sora)] text-[18px] font-semibold tracking-[-0.01em] text-[#f4efe6]">
            CMA Studio
          </span>
        </div>

        <div className="glass glass-gold rounded-2xl p-6 sm:p-7">
          <div className="mb-4">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#bc9863]/30 bg-[#bc9863]/8 px-3 py-1 font-mono text-[9px] tracking-[0.24em] text-[#bc9863] uppercase">
              Private beta
            </div>
            <h1 className="font-[family-name:var(--font-sora)] text-[22px] font-bold tracking-[-0.02em] text-[#f4efe6]">
              This studio is still in beta.
            </h1>
            <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-[#8b8f99]">
              Enter your access code to take a look. If you don&apos;t have one yet, hold tight, we open the doors soon.
            </p>
          </div>
          <UnlockForm next={dest} />
        </div>

        <p className="mt-5 font-mono text-[10px] tracking-[0.14em] text-[#8b909e] uppercase">
          © 2026 CineMaster Academy
        </p>
      </div>
    </div>
  );
}
