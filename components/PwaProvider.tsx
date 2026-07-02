'use client';

/**
 * PwaProvider — registers the service worker and owns the auto install banner:
 *   • Android / desktop Chrome: captures `beforeinstallprompt`; the banner's
 *     Install button fires the native one-tap prompt.
 *   • iOS (no install event by design): the banner leads to /app, the
 *     canonical visual walkthrough.
 *   • Already installed (standalone) or recently dismissed: the banner stays
 *     away. The app is never unreachable though — every "Get the app" button
 *     (GetAppButton below) links to /app permanently.
 * Mounted once in the root layout.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X, Download } from 'lucide-react';

const DISMISS_KEY = 'cma_pwa_dismissed_at';
const DISMISS_DAYS = 30;

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function isStandalone(): boolean {
  if (typeof window === 'undefined') return true;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari's legacy flag
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/**
 * "Get the app" for any page surface — a plain link to /app, the canonical
 * install page (platform detection + one-tap Android install live there).
 * Hides itself inside the installed app.
 */
export function GetAppButton({ className, children }: { className?: string; children?: React.ReactNode }) {
  const [installed, setInstalled] = useState(false);
  useEffect(() => setInstalled(isStandalone()), []);
  if (installed) return null; // already the app — nothing to sell
  return (
    <Link href="/app" className={className}>
      {children ?? 'Get the app'}
    </Link>
  );
}

export function PwaProvider() {
  const reduce = useReducedMotion();
  const router = useRouter();
  const [installEvt, setInstallEvt] = useState<InstallEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  // Service worker: PRODUCTION ONLY. Dev chunks are not immutable-hashed, so a
  // cache-first worker serves stale module graphs and breaks hot dev (learned
  // the hard way). In dev we actively unregister any leftover worker.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())).catch(() => {});
      return;
    }
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  useEffect(() => {
    if (isStandalone()) return; // already the app
    if (window.location.pathname === '/app') return; // the guide page sells itself

    const dismissedRecently = () =>
      Date.now() - Number(localStorage.getItem(DISMISS_KEY) ?? 0) < DISMISS_DAYS * 86_400_000;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as InstallEvent);
      if (!dismissedRecently()) setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);

    // iOS never fires the event — auto-surface the banner after a beat instead.
    let t: ReturnType<typeof setTimeout> | undefined;
    if (isIos() && !dismissedRecently()) {
      t = setTimeout(() => setShowBanner(true), 6000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      if (t) clearTimeout(t);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShowBanner(false);
  };

  const install = async () => {
    if (installEvt) {
      setShowBanner(false);
      await installEvt.prompt();
      const choice = await installEvt.userChoice;
      if (choice.outcome !== 'accepted') dismiss();
      setInstallEvt(null);
    } else {
      // No native prompt on this platform — the /app page walks them through.
      setShowBanner(false);
      router.push('/app');
    }
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          key="banner"
          initial={reduce ? false : { y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="fixed inset-x-0 bottom-4 z-[70] flex justify-center px-4"
        >
          <div className="glass glass-gold flex w-full max-w-md items-center gap-3.5 rounded-2xl border border-[#bc9863]/35 p-3.5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-192.png" alt="" className="h-11 w-11 rounded-xl border border-white/10" />
            <div className="min-w-0 flex-1">
              <div className="font-[family-name:var(--font-sora)] text-[14px] font-semibold text-[#f4efe6]">
                Get the CMA Studio app
              </div>
              <div className="truncate text-[12px] text-[#8b8f99]">
                Full studio on your phone. Same account, same library.
              </div>
            </div>
            <button
              onClick={install}
              className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-4 py-2 text-[13px] font-semibold text-black transition hover:brightness-105"
            >
              <Download size={14} /> Install
            </button>
            <button
              onClick={dismiss}
              aria-label="Dismiss install banner"
              className="cursor-pointer rounded-lg p-1.5 text-[#8b8f99] transition hover:text-[#e7cfa3]"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
