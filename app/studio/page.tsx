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

export default function StudioPage() {
  const router = useRouter();
  const supabase = useMemo(() => getBrowserSupabase(), []);

  const [authReady, setAuthReady] = useState(false);
  const [activating, setActivating] = useState(false);
  useEffect(() => {
    if (DEV_AUTH_BYPASS) {
      setAuthReady(true);
      return;
    }
    let active = true;
    // Post-payment grace: Stripe redirects here BEFORE the webhook has written
    // the entitlement. On ?checkout=success we poll for the plan for ~30s
    // instead of bouncing a paying customer back to /pricing.
    const justPaid = new URLSearchParams(window.location.search).get('checkout') === 'success';
    let attempts = 0;
    const check = async () => {
      // refreshSession pulls fresh app_metadata once the webhook lands
      if (attempts > 0) await supabase.auth.refreshSession();
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      const email = data.user?.email ?? null;
      if (!data.user || !isAcademyEmail(email)) {
        router.replace('/login');
        return;
      }
      if (hasActivePlan(data.user.app_metadata)) {
        setAuthReady(true);
        return;
      }
      if (justPaid && attempts < 10) {
        attempts += 1;
        setActivating(true);
        setTimeout(check, 3000);
        return;
      }
      router.replace('/pricing'); // hard paywall
    };
    check();
    return () => {
      active = false;
    };
  }, [router, supabase]);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <p className="font-mono text-xs tracking-[0.2em] text-[#8b8f99] uppercase">
          {activating ? 'Payment received. Activating your plan…' : 'Verifying access…'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[#bc9863]/18 bg-[#07080b]/95 px-6 py-3.5 backdrop-blur-xl shadow-[0_16px_44px_-30px_rgba(0,0,0,0.95)]">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={44} />
          <span className="font-[family-name:var(--font-sora)] text-[17px] font-semibold tracking-[-0.01em]">
            CMA Studio <span className="text-[#bc9863]">Pro</span>
            <span className="ml-2 font-mono text-[9px] tracking-[0.24em] text-[#bc9863]/70">VCP</span>
          </span>
          <span className="rounded-full border border-[#bc9863]/30 bg-[#bc9863]/8 px-2 py-0.5 font-mono text-[8px] tracking-[0.16em] text-[#bc9863] uppercase">
            beta
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {DEV_AUTH_BYPASS && (
            <span className="hidden items-center gap-1.5 font-mono text-[10px] text-[#bc9863]/70 sm:inline-flex">
              <AlertTriangle size={12} /> dev mode — auth bypassed locally
            </span>
          )}
          <button
            onClick={signOut}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 font-mono text-[11px] text-[#8b8f99] transition hover:border-[#bc9863]/40 hover:text-[#e7cfa3]"
          >
            <LogOut size={13} /> Exit
          </button>
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
            Because this engine has. Every camera body, lens and lighting recipe in Studio Pro is compiled server side
            from <span className="text-[#f4efe6]">21+ years of working Director of Photography experience</span>. Not
            style words. Real cinematography.
          </p>
        </div>
        <StudioConsole />
      </main>

      <footer className="mt-6 border-t border-[#bc9863]/12 px-6 py-7">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 font-mono text-[11px] tracking-[0.04em] text-[#8b909e] sm:flex-row">
          <span>© 2026 CineMaster Academy · CMA Studio Pro</span>
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
      </footer>
    </div>
  );
}
