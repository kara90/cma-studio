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
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

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

function ensureScript(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') return resolve();
    if (window.turnstile) return resolve();
    const existing = document.querySelector('script[data-turnstile]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      return;
    }
    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.dataset.turnstile = '1';
    s.addEventListener('load', () => resolve(), { once: true });
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

  useImperativeHandle(ref, () => ({
    reset() {
      if (window.turnstile && widgetId.current) window.turnstile.reset(widgetId.current);
    },
  }));

  useEffect(() => {
    let cancelled = false;
    ensureScript().then(() => {
      if (cancelled || !containerRef.current || !window.turnstile || widgetId.current) return;
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

  return <div ref={containerRef} className="flex justify-center" />;
});
