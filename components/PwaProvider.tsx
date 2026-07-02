'use client';

/**
 * PwaProvider — registers the service worker and owns the premium install
 * experience:
 *   • Android / desktop Chrome: captures `beforeinstallprompt` and offers a
 *     one-tap native install from a glass banner.
 *   • iOS Safari (no install event by design): the same banner opens a short
 *     "Share → Add to Home Screen" sheet.
 *   • Already installed (standalone) or recently dismissed: renders nothing.
 * Mounted once in the root layout.
 */
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X, Share, PlusSquare, Download } from 'lucide-react';

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

export function PwaProvider() {
  const reduce = useReducedMotion();
  const [installEvt, setInstallEvt] = useState<InstallEvent | null>(null);
  const [show, setShow] = useState(false);
  const [iosSheet, setIosSheet] = useState(false);

  // Service worker: register once, silently. Never intercepts /api/*.
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (isStandalone()) return; // already the app
    const dismissed = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    if (Date.now() - dismissed < DISMISS_DAYS * 86_400_000) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as InstallEvent);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);

    // iOS never fires the event — surface the banner after a beat instead.
    let t: ReturnType<typeof setTimeout> | undefined;
    if (isIos()) t = setTimeout(() => setShow(true), 6000);

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      if (t) clearTimeout(t);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShow(false);
    setIosSheet(false);
  };

  const install = async () => {
    if (installEvt) {
      await installEvt.prompt();
      const choice = await installEvt.userChoice;
      if (choice.outcome === 'accepted') setShow(false);
      else dismiss();
      setInstallEvt(null);
    } else {
      setIosSheet(true);
    }
  };

  return (
    <AnimatePresence>
      {show && !iosSheet && (
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

      {iosSheet && (
        <motion.div
          key="ios-sheet"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[75] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
          onClick={dismiss}
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
                <div className="text-[12px] text-[#8b8f99]">Two taps in Safari, no app store needed.</div>
              </div>
            </div>
            <ol className="flex flex-col gap-3">
              <li className="flex items-center gap-3 rounded-xl border border-white/8 bg-black/40 px-3.5 py-3 text-[14px] text-[#cfcabf]">
                <Share size={18} className="shrink-0 text-[#bc9863]" />
                Tap the <span className="font-semibold text-[#f4efe6]">Share</span> button in the toolbar
              </li>
              <li className="flex items-center gap-3 rounded-xl border border-white/8 bg-black/40 px-3.5 py-3 text-[14px] text-[#cfcabf]">
                <PlusSquare size={18} className="shrink-0 text-[#bc9863]" />
                Choose <span className="font-semibold text-[#f4efe6]">Add to Home Screen</span>
              </li>
            </ol>
            <button
              onClick={dismiss}
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
