/**
 * lib/allowances.ts — DP-engine generation allowances (client-safe).
 *
 * Sebastien's product rule: every paid tier includes a monthly number of
 * DP-ENGINE generations (each time the engine composes or recomposes a prompt
 * = one generation). Raw/direct renders on the user's own key are NEVER
 * counted — those cost us nothing and are unlimited on every tier.
 *
 * Numbers must stay in sync with the tier copy in lib/plans.ts and the FAQ:
 *   Starter (id 'student')  →   5 / month  ("taste the difference")
 *   Filmmaker (id 'pro')    → 150 / month
 *   Pro (id 'studio')       → 300 / month
 *
 * Counters live in Cloudflare KV (binding ENGINE_USAGE), key
 * u/{userId}/{YYYY-MM}, refreshed by the calendar month (UTC). The check is
 * FAIL-OPEN: if KV is unreachable a paying user is never blocked.
 */

export const ENGINE_ALLOWANCE: Record<string, number> = {
  student: 5,
  pro: 150,
  studio: 300,
};

/** Allowance for a tier id; unknown/missing tiers get the smallest tier's. */
export function allowanceForTier(tier: string | null | undefined): number {
  return ENGINE_ALLOWANCE[tier ?? ''] ?? ENGINE_ALLOWANCE.student;
}

/** UTC calendar-month bucket, e.g. "2026-07" — the refresh boundary. */
export function monthKey(now = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** KV key for a user's counter this month. */
export function usageKey(userId: string, now = new Date()): string {
  return `u/${userId}/${monthKey(now)}`;
}

/** First day of next month (UTC) — shown to users as the refresh date. */
export function refreshDate(now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString().slice(0, 10);
}

export interface EngineAllowance {
  used: number;
  included: number;
  refreshesOn: string; // YYYY-MM-DD (UTC)
}
