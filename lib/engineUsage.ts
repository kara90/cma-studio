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
import { usageKey, refreshDate, type EngineAllowance, type PublicAllowance } from './allowances';

/**
 * Included engine generations per tier — SERVER-ONLY numbers.
 *   Starter (id 'student')  →    0  (no DP-engine access; raw generators only)
 *   Filmmaker (id 'pro')    →  500  (public number, mirrored in lib/plans.ts)
 *   Pro (id 'studio')       → 3000  (⚠ HIDDEN fair-use hard cap. Publicly this
 *                                    tier is "unlimited within fair use" — the
 *                                    number is never returned to a client and
 *                                    never appears in copy. Anti-abuse only.)
 * Unknown/missing tiers get 0 (engine access is an explicit entitlement; the
 * raw generators stay open to every paid tier regardless).
 */
const ENGINE_CAPS: Record<string, number> = { student: 0, pro: 500, studio: 3000 };
/** Tiers whose allowance is presented as "unlimited within fair use". */
const UNLIMITED_DISPLAY = new Set(['studio']);

function capForTier(tier: string | null | undefined): number {
  return ENGINE_CAPS[tier ?? ''] ?? 0;
}

/** Redact the hidden cap before anything leaves the server. */
export function publicAllowance(a: EngineAllowance): PublicAllowance {
  return {
    used: a.used,
    included: a.unlimited ? null : a.included,
    refreshesOn: a.refreshesOn,
    unlimited: a.unlimited,
  };
}

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
  const included = capForTier(tier);
  const base: EngineAllowance = {
    used: 0,
    included,
    refreshesOn: refreshDate(),
    unlimited: UNLIMITED_DISPLAY.has(tier ?? '') || undefined,
  };
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
