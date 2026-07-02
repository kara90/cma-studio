/**
 * lib/rateLimit.ts — best-effort in-memory throttle (server-only).
 * NOTE: on Cloudflare/edge this Map lives per-isolate, so it is a soft guard
 * against accidental bursts, NOT a hard limit. Enforce real per-user limits
 * with Cloudflare WAF Rate Limiting rules (or a Durable Object / KV) in prod.
 */
const HITS = new Map<string, number[]>();

export function softRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (HITS.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  HITS.set(key, recent);
  // opportunistic cleanup so the map can't grow unbounded within an isolate
  if (HITS.size > 5000) {
    for (const [k, v] of HITS) if (v.every((t) => now - t > windowMs)) HITS.delete(k);
  }
  return recent.length <= limit;
}
