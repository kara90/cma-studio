'use client';

/**
 * Turnstile — Cloudflare's privacy-friendly, invisible-first CAPTCHA. Loads the
 * widget script once and renders a challenge; the resulting token is handed to
 * the parent, which passes it to Supabase auth as `captchaToken`. Supabase then
 * verifies the token SERVER-SIDE against Cloudflare (siteverify) before creating
 * a session — so this is the real anti-bot/anti-scammer gate, not just UI.
 *
 * Tokens are single-use: call reset() (via ref) after each submit attempt.
 */
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

/**
 * Resolves true once the Turnstile script is available, false if it cannot load
 * (blocked by an ad blocker / firewall, network failure, or a 15s stall). It
 * always settles — a hung promise here used to leave the sign-in button
 * disabled forever with no explanation.
 */
function ensureScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') return resolve(false);
    if (window.turnstile) return resolve(true);
    let settled = false;
    const settle = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(ok);
    };
    // Backstop for scripts that neither load nor error (silent network stalls).
    const timer = setTimeout(() => settle(Boolean(window.turnstile)), 15_000);
    const watch = (el: HTMLScriptElement) => {
      el.addEventListener('load', () => settle(true), { once: true });
      el.addEventListener('error', () => settle(false), { once: true });
    };
    const existing = document.querySelector('script[data-turnstile]') as HTMLScriptElement | null;
    if (existing) {
      // The tag can already be past its load event (window.turnstile checked
      // above misses a still-initializing script) — the timeout backstops that.
      watch(existing);
      return;
    }
    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.dataset.turnstile = '1';
    watch(s);
    document.head.appendChild(s);
  });
}

export interface TurnstileHandle {
  reset: () => void;
}

export const Turnstile = forwardRef<
  TurnstileHandle,
  {
    siteKey: string;
    onVerify: (token: string) => void;
    onExpire?: () => void;
    theme?: 'auto' | 'light' | 'dark';
  }
>(function Turnstile({ siteKey, onVerify, onExpire, theme = 'dark' }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  // Script blocked / unreachable — surfaced instead of a silent dead form.
  const [failed, setFailed] = useState(false);

  useImperativeHandle(ref, () => ({
    reset() {
      if (window.turnstile && widgetId.current) window.turnstile.reset(widgetId.current);
    },
  }));

  useEffect(() => {
    let cancelled = false;
    ensureScript().then((ok) => {
      if (cancelled || widgetId.current) return;
      if (!ok || !containerRef.current || !window.turnstile) {
        setFailed(true);
        return;
      }
      widgetId.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme,
        callback: (token: string) => onVerify(token),
        'expired-callback': () => onExpire?.(),
        'error-callback': () => onExpire?.(),
      });
    });
    return () => {
      cancelled = true;
      if (window.turnstile && widgetId.current) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          /* widget already gone */
        }
        widgetId.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  if (failed) {
    return (
      <div className="rounded-lg border border-amber-400/25 bg-amber-400/[0.06] px-3.5 py-2.5 text-center text-[12.5px] leading-relaxed text-amber-200/90">
        The security check could not load. Disable content blockers for this site, check your connection, then{' '}
        <button type="button" onClick={() => window.location.reload()} className="cursor-pointer font-semibold underline underline-offset-2">
          reload the page
        </button>
        .
      </div>
    );
  }
  return <div ref={containerRef} className="flex justify-center" />;
});
