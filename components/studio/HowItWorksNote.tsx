'use client';

/**
 * HowItWorksNote — short, SKIPPABLE orientation card at the top of the studio
 * console. Two beats only: (1) get + paste a fal.ai key, (2) leave controls on
 * Auto and the engine handles everything. Dismissal sticks per browser.
 */
import { useEffect, useState } from 'react';
import { KeyRound, Wand2, X, ExternalLink } from 'lucide-react';

const DISMISS_KEY = 'cma_howitworks_dismissed';

export function HowItWorksNote() {
  // Start hidden to avoid a hydration flash, then show unless dismissed.
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(window.localStorage.getItem(DISMISS_KEY) !== '1');
  }, []);

  if (!show) return null;

  return (
    <aside className="glass mb-5 rounded-2xl border border-[#bc9863]/15 p-4" aria-label="How the studio works">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2.5 text-[12.5px] leading-relaxed text-[#c7c2b8] sm:flex-row sm:gap-6">
          <p className="flex items-start gap-2">
            <KeyRound size={14} className="mt-0.5 shrink-0 text-[#bc9863]" />
            <span>
              <span className="font-semibold text-[#e7cfa3]">1 · Connect a key.</span> Grab a free key at{' '}
              <a
                href="https://fal.ai/dashboard/keys"
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-0.5 font-semibold text-[#bc9863] transition hover:text-[#e7cfa3]"
              >
                fal.ai <ExternalLink size={10} />
              </a>{' '}
              and paste it in the vault. Used only at render. Never stored.
            </span>
          </p>
          <p className="flex items-start gap-2">
            <Wand2 size={14} className="mt-0.5 shrink-0 text-[#bc9863]" />
            <span>
              <span className="font-semibold text-[#e7cfa3]">2 · Describe your scene.</span> Leave the controls on Auto
              and the engine directs the camera, light and motion for you. Flip to Pro anytime.
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            window.localStorage.setItem(DISMISS_KEY, '1');
            setShow(false);
          }}
          aria-label="Dismiss the how-it-works note"
          className="flex-none cursor-pointer rounded-lg border border-white/10 p-1.5 text-[#8b8f99] transition hover:border-[#bc9863]/40 hover:text-[#e7cfa3]"
        >
          <X size={14} />
        </button>
      </div>
    </aside>
  );
}
