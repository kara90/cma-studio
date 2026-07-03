/**
 * lib/engineUsage.ts — server-only DP-engine allowance metering.
 *
 * Counters live in Cloudflare KV (binding ENGINE_USAGE), one per user per
 * UTC calendar month. The studio path in /api/generate:
 *   1. READS the counter BEFORE compiling — an exhausted allowance is refused
 *      before a single unit of the user's fal budget is spent.
 *   2. INCREMENTS the counter only AFTER fal accepts the queue submit — a
 *      failed submit never consumes a generation.
 *
 * Design rules (Sebastien's product decisions):
 *   • Raw/direct renders are NEVER metered — this module is only ever called
 *     from the studio (engine) path.
 *   • FAIL-OPEN: if KV is missing (plain `next dev`) or errors, reads report
 *     zero usage and writes are dropped — a paying user is never blocked by
 *     our infrastructure.
 *   • KV is eventually consistent, so a rapid burst can slightly overshoot
 *     the allowance. Acceptable: this is an inclusion, not a billing meter.
 */
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { allowanceForTier, usageKey, refreshDate, type EngineAllowance } from './allowances';

// Counters for a finished month stay readable for a while, then self-clean.
const COUNTER_TTL_SECONDS = 62 * 24 * 60 * 60;

function kv() {
  try {
    return getCloudflareContext().env.ENGINE_USAGE;
  } catch {
    return undefined; // plain `next dev` without bindings
  }
}

export async function readEngineUsage(userId: string, tier: string | null): Promise<EngineAllowance> {
  const included = allowanceForTier(tier);
  const base: EngineAllowance = { used: 0, included, refreshesOn: refreshDate() };
  const store = kv();
  if (!store) return base;
  try {
    const raw = await store.get(usageKey(userId));
    const used = Math.max(0, Number.parseInt(raw ?? '0', 10) || 0);
    return { ...base, used };
  } catch {
    return base; // fail open
  }
}

/** Write used+1; returns the new count. Best-effort — never throws. */
export async function incrementEngineUsage(userId: string, prevUsed: number): Promise<number> {
  const next = prevUsed + 1;
  const store = kv();
  if (!store) return next;
  try {
    await store.put(usageKey(userId), String(next), { expirationTtl: COUNTER_TTL_SECONDS });
  } catch {
    /* fail open — the render already succeeded, never surface an error here */
  }
  return next;
}
