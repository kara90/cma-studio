'use client';

/**
 * PwaProvider — registers the service worker and owns the premium install
 * experience:
 *   • Android / desktop Chrome: captures `beforeinstallprompt` and offers a
 *     one-tap native install from a glass banner.
 *   • iOS Safari (no install event by design): the same banner opens a short
 *     "Share → Add to Home Screen" sheet.
 *   • Already installed (standalone) or recently dismissed: the AUTO banner
 *     stays away — but the app is never unreachable: any "Get the app" button
 *     (header menu, home section, footer) dispatches `cma:install`, which
 *     always answers — native prompt when captured, instruction sheet
 *     otherwise. Mounted once in the root layout.
 */
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X, Share, PlusSquare, Download, MoreVertical, Smartphone } from 'lucide-react';

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
 * "Get the app" button for any page surface (home section, footers). Explicit
 * intent — always works, even after the auto banner was dismissed.
 */
export function GetAppButton({ className, children }: { className?: string; children?: React.ReactNode }) {
  const [installed, setInstalled] = useState(false);
  useEffect(() => setInstalled(isStandalone()), []);
  if (installed) return null; // already the app — nothing to sell
  return (
    <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('cma:install'))} className={className}>
      {children ?? 'Get the app'}
    </button>
  );
}

export function PwaProvider() {
  const reduce = useReducedMotion();
  const [installEvt, setInstallEvt] = useState<InstallEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [sheet, setSheet] = useState(false);

  // Service worker: register once, silently. Never intercepts /api/*.
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (isStandalone()) return; // already the app

    // ALWAYS capture the install event — dismissal only mutes the auto banner,
    // never the explicit "Get the app" buttons.
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as InstallEvent);
      const dismissed = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
      if (Date.now() - dismissed >= DISMISS_DAYS * 86_400_000) setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);

    // iOS never fires the event — auto-surface the banner after a beat instead.
    let t: ReturnType<typeof setTimeout> | undefined;
    const dismissed = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    if (isIos() && Date.now() - dismissed >= DISMISS_DAYS * 86_400_000) {
      t = setTimeout(() => setShowBanner(true), 6000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      if (t) clearTimeout(t);
    };
  }, []);

  // Explicit intent from any Get-the-app button anywhere on the site.
  useEffect(() => {
    const onWant = () => {
      if (isStandalone()) return;
      void triggerInstall(true);
    };
    window.addEventListener('cma:install', onWant);
    return () => window.removeEventListener('cma:install', onWant);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installEvt]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShowBanner(false);
    setSheet(false);
  };

  const triggerInstall = async (explicit = false) => {
    if (installEvt) {
      setShowBanner(false);
      await installEvt.prompt();
      const choice = await installEvt.userChoice;
      if (choice.outcome !== 'accepted' && !explicit) dismiss();
      setInstallEvt(null);
    } else {
      // No captured event (iOS always; Android before eligibility): show steps.
      setShowBanner(false);
      setSheet(true);
    }
  };

  const ios = isIos();

  return (
    <AnimatePresence>
      {showBanner && !sheet && (
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
              onClick={() => triggerInstall()}
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

      {sheet && (
        <motion.div
          key="install-sheet"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[75] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
          onClick={() => setSheet(false)}
        >
          <motion.div
            initial={reduce ? false : { y: 60 }}
            animate={{ y: 0 }}
            exit={{ y: 60 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="glass glass-gold w-full max-w-md rounded-t-3xl border border-[#bc9863]/35 p-6 sm:rounded-3xl"
          >
            <div className="mb-4 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/icon-192.png" alt="" className="h-12 w-12 rounded-xl border border-white/10" />
              <div>
                <div className="font-[family-name:var(--font-sora)] text-[16px] font-semibold text-[#f4efe6]">
                  Install CMA Studio
                </div>
                <div className="text-[12px] text-[#8b8f99]">
                  {ios ? 'Two taps in Safari, no app store needed.' : 'Two taps in your browser, no app store needed.'}
                </div>
              </div>
            </div>
            <ol className="flex flex-col gap-3">
              <li className="flex items-center gap-3 rounded-xl border border-white/8 bg-black/40 px-3.5 py-3 text-[14px] text-[#cfcabf]">
                {ios ? (
                  <>
                    <Share size={18} className="shrink-0 text-[#bc9863]" />
                    <span>
                      Tap the <span className="font-semibold text-[#f4efe6]">Share</span> button in the toolbar
                    </span>
                  </>
                ) : (
                  <>
                    <MoreVertical size={18} className="shrink-0 text-[#bc9863]" />
                    <span>
                      Open the <span className="font-semibold text-[#f4efe6]">browser menu</span> (⋮)
                    </span>
                  </>
                )}
              </li>
              <li className="flex items-center gap-3 rounded-xl border border-white/8 bg-black/40 px-3.5 py-3 text-[14px] text-[#cfcabf]">
                {ios ? (
                  <>
                    <PlusSquare size={18} className="shrink-0 text-[#bc9863]" />
                    <span>
                      Choose <span className="font-semibold text-[#f4efe6]">Add to Home Screen</span>
                    </span>
                  </>
                ) : (
                  <>
                    <Smartphone size={18} className="shrink-0 text-[#bc9863]" />
                    <span>
                      Choose <span className="font-semibold text-[#f4efe6]">Install app</span> or{' '}
                      <span className="font-semibold text-[#f4efe6]">Add to Home screen</span>
                    </span>
                  </>
                )}
              </li>
            </ol>
            <button
              onClick={() => setSheet(false)}
              className="mt-5 inline-flex w-full cursor-pointer items-center justify-center rounded-xl border border-white/12 py-3 text-[14px] font-semibold text-[#f4efe6] transition hover:border-[#bc9863]"
            >
              Got it
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
