/**
 * lib/billing.ts — server-only mapping between our plans and Stripe prices.
 * The client only ever sends a tier/extension id; the server resolves the real
 * Stripe price from env, so a user can never pay the wrong amount for a tier.
 */
import type { Cycle } from './plans';

type TierId = 'student' | 'pro' | 'studio';

const TIER_PRICE_ENV: Record<Exclude<TierId, 'studio'>, Record<Cycle, string | undefined>> = {
  student: {
    yearly: process.env.STRIPE_PRICE_STUDENT_YEARLY,
    monthly: process.env.STRIPE_PRICE_STUDENT_MONTHLY,
  },
  pro: {
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
  },
};

// Storage top-ups (STRIPE_PRICE_EXT / STRIPE_PRICE_EXT_PLUS) were REMOVED from
// sale: no price mapping exists for them, so nothing can resolve or charge one.

/** Studio is a sales-contact tier (no self-serve checkout). */
export function isCheckoutTier(tier: string): tier is Exclude<TierId, 'studio'> {
  return tier === 'student' || tier === 'pro';
}

export function priceForTier(tier: string, cycle: Cycle): string | undefined {
  if (!isCheckoutTier(tier)) return undefined;
  return TIER_PRICE_ENV[tier][cycle];
}

/** Reverse lookup: which of our tiers does a Stripe price belong to? */
export function identifyPrice(priceId: string): { kind: 'tier'; tier: TierId } | null {
  for (const tier of ['student', 'pro'] as const) {
    for (const cycle of ['yearly', 'monthly'] as const) {
      if (TIER_PRICE_ENV[tier][cycle] === priceId) return { kind: 'tier', tier };
    }
  }
  return null;
}

export interface CmaPlan {
  tier: TierId;
  status: string;
  expires?: string;
  stripe_customer?: string;
  stripe_subscription?: string;
}

/** Build the app_metadata.cma_plan value verifyAccess + the pricing page read. */
export function buildCmaPlan(opts: {
  tier: TierId;
  status: string;
  currentPeriodEnd?: number | null;
  customerId?: string | null;
  subscriptionId?: string | null;
}): CmaPlan {
  return {
    tier: opts.tier,
    status: opts.status,
    expires: opts.currentPeriodEnd ? new Date(opts.currentPeriodEnd * 1000).toISOString() : undefined,
    stripe_customer: opts.customerId ?? undefined,
    stripe_subscription: opts.subscriptionId ?? undefined,
  };
}
