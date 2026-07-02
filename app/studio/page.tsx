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
  useEffect(() => {
    if (DEV_AUTH_BYPASS) {
      setAuthReady(true);
      return;
    }
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      const email = data.user?.email ?? null;
      if (!data.user || !isAcademyEmail(email)) router.replace('/login');
      else if (!hasActivePlan(data.user.app_metadata)) router.replace('/pricing'); // hard paywall
      else setAuthReady(true);
    });
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
        <p className="font-mono text-xs tracking-[0.2em] text-[#8b8f99] uppercase">Verifying academy access…</p>
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
