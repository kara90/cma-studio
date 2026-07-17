/**
 * lib/track.ts — client helper for the first-party analytics beacon.
 * Fire-and-forget; never blocks UI, never throws, sends nothing but the
 * allowlisted event name to our own /api/event route.
 */
export type CmaEvent = 'signup_intent' | 'first_render' | 'recipe_share' | 'subscribe_intent';

export function track(event: CmaEvent): void {
  try {
    const payload = JSON.stringify({ event });
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/event', new Blob([payload], { type: 'application/json' }));
    } else {
      void fetch('/api/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(() => {});
    }
  } catch {
    /* analytics must never break the product */
  }
}
