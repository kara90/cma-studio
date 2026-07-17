/**
 * lib/allowances.ts — engine-allowance helpers + wire types (client-safe).
 *
 * NAMING RULE (Sebastien): the allowance is always called
 * "included engine generations" — never "credits".
 *
 * ⚠ The per-tier NUMBERS deliberately do NOT live in this file. They are
 * server-only, in lib/engineUsage.ts, because the Pro tier displays as
 * "unlimited within fair use" while a HIDDEN hard cap is enforced server
 * side — a number in a client-safe module would ship in the JS bundle and
 * stop being hidden. Public copy numbers live in lib/plans.ts (Filmmaker
 * only); keep those in sync with lib/engineUsage.ts.
 *
 * Counters live in Cloudflare KV (binding ENGINE_USAGE), key
 * u/{userId}/{YYYY-MM}, refreshed by the calendar month (UTC). The check is
 * FAIL-OPEN: if KV is unreachable a paying user is never blocked.
 */

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

/** SERVER-INTERNAL allowance state. `included` may be the hidden hard cap. */
export interface EngineAllowance {
  used: number;
  included: number;
  refreshesOn: string; // YYYY-MM-DD (UTC)
  /** tier displays as "unlimited within fair use"; `included` is the hidden cap */
  unlimited?: boolean;
}

/** What clients are allowed to see. On unlimited tiers the numeric cap is
 * REDACTED (`included: null`) so the hidden number never reaches a browser. */
export interface PublicAllowance {
  used: number;
  included: number | null;
  refreshesOn: string;
  unlimited?: boolean;
}
