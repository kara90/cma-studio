'use client';

/**
 * app/studio/page.tsx — the gated full-screen workspace. Auth guard + header;
 * the console itself lives in <StudioConsole/> (shared with the landing embed).
 */
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, AlertTriangle } from 'lucide-react';
import { getBrowserSupabase } from '@/lib/supabase/client';
import { isAcademyEmail, hasActivePlan, DEV_AUTH_BYPASS } from '@/lib/access';
import { StudioConsole } from '@/components/studio/StudioConsole';
import { Logo } from '@/components/Logo';
import { TrademarkNotice } from '@/components/TrademarkNotice';

export default function StudioPage() {
  const router = useRouter();
  const supabase = useMemo(() => getBrowserSupabase(), []);

  // 'full' = active subscriber (rendering unlocked). 'locked' = everyone else
  // (anonymous or signed-in-no-plan) explores the real tool with rendering
  // gated. We never bounce a visitor to /login or /pricing: they must SEE the
  // studio, which is the whole point of the flagship.
  //
  // PERFORMANCE FIX (fix-and-upgrade pass): the page used to render a blank
  // full-screen "Loading the studio…" until supabase.auth.getUser() resolved,
  // with NO timeout — a cold/paused Supabase could hang that call for up to a
  // minute of black screen. Now the page paints IMMEDIATELY ('checking' renders
  // the full console in locked mode with a small "checking your plan" chip) and
  // the auth check upgrades it in the background. A hard timeout guarantees the
  // check can never keep the page in limbo. Members see the unlock flip in
  // typically <1s; visitors see the studio instantly either way.
  const [mode, setMode] = useState<'checking' | 'locked' | 'full'>('checking');
  const [signedIn, setSignedIn] = useState(false);
  const [activating, setActivating] = useState(false);
  useEffect(() => {
    if (DEV_AUTH_BYPASS) {
      setMode('full');
      setSignedIn(true);
      return;
    }
    let active = true;
    // Post-payment grace: Stripe returns here BEFORE the webhook has written the
    // entitlement. On ?checkout=success we poll for the plan for ~30s so a paying
    // customer lands in the unlocked studio, not the locked one.
    const justPaid = new URLSearchParams(window.location.search).get('checkout') === 'success';
    let attempts = 0;
    /** Never let a hung auth call keep the page in 'checking' forever. */
    const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T | null> =>
      Promise.race([p, new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))]);
    const check = async () => {
      if (attempts > 0) await withTimeout(supabase.auth.refreshSession(), 8000);
      const res = await withTimeout(supabase.auth.getUser(), 8000);
      if (!active) return;
      const user = res?.data.user ?? null;
      setSignedIn(Boolean(user));
      if (user && isAcademyEmail(user.email) && hasActivePlan(user.app_metadata)) {
        setMode('full');
        setActivating(false);
        return;
      }
      if (justPaid && user && attempts < 10) {
        attempts += 1;
        setActivating(true);
        setTimeout(check, 3000);
        return;
      }
      setMode('locked'); // explore the tool; rendering unlocks with a plan
      setActivating(false);
    };
    check();
    return () => {
      active = false;
    };
  }, [supabase]);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  // No blocking screen: the studio paints instantly; auth status rides along.
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[#bc9863]/18 bg-[#07080b]/95 px-6 py-3.5 backdrop-blur-xl shadow-[0_16px_44px_-30px_rgba(0,0,0,0.95)]">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={44} />
          <span className="font-[family-name:var(--font-sora)] text-[17px] font-semibold tracking-[-0.01em]">
            CMA <span className="text-[#bc9863]">Director Studio</span>
            <span className="ml-2 font-mono text-[9px] tracking-[0.24em] text-[#bc9863]/70">VCP</span>
          </span>
          <span className="rounded-full border border-[#bc9863]/30 bg-[#bc9863]/8 px-2 py-0.5 font-mono text-[8px] tracking-[0.16em] text-[#bc9863] uppercase">
            beta
          </span>
        </Link>
        <div className="flex items-center gap-2.5">
          {DEV_AUTH_BYPASS && (
            <span className="hidden items-center gap-1.5 font-mono text-[10px] text-[#bc9863]/70 sm:inline-flex">
              <AlertTriangle size={12} /> dev mode — auth bypassed locally
            </span>
          )}
          {/* background plan check — the page is already fully interactive */}
          {(mode === 'checking' || activating) && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 font-mono text-[9px] tracking-[0.14em] text-[#8b909e] uppercase">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#bc9863]" />
              {activating ? 'Payment received · activating your plan…' : 'Checking your plan…'}
            </span>
          )}
          {mode === 'locked' && (
            <Link
              href="/pricing"
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-3.5 py-1.5 text-[12px] font-semibold text-black transition hover:brightness-105"
            >
              Subscribe to render
            </Link>
          )}
          {signedIn ? (
            <button
              onClick={signOut}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 font-mono text-[11px] text-[#8b8f99] transition hover:border-[#bc9863]/40 hover:text-[#e7cfa3]"
            >
              <LogOut size={13} /> Exit
            </button>
          ) : (
            <Link
              href="/login"
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 font-mono text-[11px] text-[#8b8f99] transition hover:border-[#bc9863]/40 hover:text-[#e7cfa3]"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

      <main className="p-5">
        {/* flagship statement — this page IS the differentiator */}
        <div className="mx-auto mb-8 max-w-3xl pt-4 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#bc9863] bg-[#bc9863]/12 px-4 py-1.5 font-mono text-[11px] tracking-[0.24em] text-[#e7cfa3] uppercase">
            The flagship
          </div>
          <h1 className="font-[family-name:var(--font-sora)] text-[clamp(1.9rem,4.2vw,3rem)] font-bold tracking-[-0.03em]">
            Direct like you&apos;ve been <span className="bg-gradient-to-r from-[#e7cfa3] to-[#bc9863] bg-clip-text text-transparent">on set for 21 years.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-[#8b8f99]">
            Because this engine has. Every camera body, lens and lighting recipe in CMA Director Studio is compiled server side
            from <span className="text-[#f4efe6]">21+ years of working Director of Photography experience</span>. Not
            style words. Real cinematography.
          </p>
        </div>
        <StudioConsole locked={mode !== 'full'} />
      </main>

      <footer className="mt-6 border-t border-[#bc9863]/12 px-6 py-7">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 font-mono text-[11px] tracking-[0.04em] text-[#8b909e] sm:flex-row">
          <span>© 2026 CineMaster Academy · CMA Studio</span>
          <div className="flex items-center gap-5">
            <a href="mailto:hello@cinemasteracademy.com?subject=CMA%20Studio%20Pro" className="transition hover:text-[#e7cfa3]">
              Contact
            </a>
            <span>
              Powered by{' '}
              <a href="https://cinemasteracademy.com" target="_blank" rel="noopener" className="text-[#bc9863] transition hover:opacity-75">
                CineMaster Academy
              </a>
            </span>
          </div>
        </div>
        <TrademarkNotice className="mx-auto mt-4 max-w-6xl text-center" />
      </footer>
    </div>
  );
}
