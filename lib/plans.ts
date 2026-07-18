/**
 * lib/plans.ts - pricing data (client-safe, single source of truth).
 *
 * =========================== PLACEHOLDER PRICING ===========================
 * EVERY price, saving figure, retention window and top-up benefit in this
 * file is a PLACEHOLDER. Sebastien finalizes the real numbers before launch.
 * The UI surfaces this with the PRICING_SCOPE_NOTE microcopy line.
 * ===========================================================================
 *
 * The scheme: a low flat fee for the software. Compute runs on the member's
 * own fal.ai key at fal's rate, no markup from us. Every tier gets ALL
 * generators (video, image, audio) through the clean interface; Filmmaker
 * and Pro add the full CMA Studio DP engine. Tiers are differentiated by
 * RETENTION and perks, never by removing the core value.
 *
 * Legal wording rules:
 *  - Retention: never "permanent", never "unlimited", never "forever".
 *    Always "about N days / about 1 year" plus "fair use".
 *  - Pricing: never promise a price will not change. Pricing covers TODAY'S
 *    toolset; plans may evolve as new tools join, announced ahead of the
 *    next billing cycle (see PRICING_SCOPE_NOTE).
 */

export type Cycle = 'yearly' | 'monthly';

/**
 * Shared legal-safety line, rendered under the billing toggle on /pricing.
 * Sebastien's price-lock decision (2026-07-02): existing subscribers keep
 * their rate for as long as they stay subscribed; future price changes apply
 * to NEW subscribers only. Keep both halves whenever this wording is revised.
 */
export const PRICING_SCOPE_NOTE =
  'Plans cover the current toolset and may evolve as new tools join. Price changes only ever apply to new subscribers: your rate is locked for as long as you stay subscribed.';

/** Beta price-lock banner, rendered above the plan cards. Future-proofed for
 *  new CMA tools joining the family without ever weakening the lock. */
export const PRICE_LOCK_NOTE =
  'Beta pricing. Your rate is locked for as long as you stay subscribed. Plans cover the current toolset; new tools may join your plan or arrive as optional add-ons, always announced before your next billing cycle.';

export interface Tier {
  /**
   * Stable billing id. NEVER rename these: lib/billing.ts, the checkout API
   * and the Stripe webhook all key off 'student' | 'pro' | 'studio'.
   * Display names are free to change; ids are not.
   */
  id: 'student' | 'pro' | 'studio';
  /** marketing display name (safe to change, decoupled from id) */
  name: string;
  /** requires academy email verification */
  academy: boolean;
  /** visually highlighted card */
  featured: boolean;
  /** per-month display price; yearly = the per-month price when billed yearly */
  price: { yearly: string; monthly: string };
  /** saving message surfaced when the yearly cycle is selected (PLACEHOLDER) */
  yearlySave: string;
  /** render retention, the main differentiator, shown prominently (PLACEHOLDER) */
  retention: string;
  blurb: string;
  features: string[];
  cta: string;
  note: string;
  /**
   * Client-safe mirror of lib/billing.ts isCheckoutTier. 'studio' has no
   * Stripe price yet, so its CTA renders as a disabled "Coming at launch"
   * button instead of firing a checkout that would 400.
   * KEEP IN SYNC with lib/billing.ts.
   */
  checkout: boolean;
}

export const TIERS: Tier[] = [
  {
    // id 'student' is the STARTER tier (id kept for billing continuity).
    id: 'student',
    name: 'Starter',
    academy: false,
    featured: false,
    // ANNUAL = TWO MONTHS FREE: yearly per-month display = monthly × 10 / 12.
    price: { yearly: '$3.33', monthly: '$3.99' }, // PLACEHOLDER
    yearlySave: 'Two months free — save $7.98 a year vs monthly', // PLACEHOLDER (tracks 2 × monthly)
    retention: 'Renders kept about 30 days · fair use', // PLACEHOLDER
    // STARTER IS THE CONVENIENCE LAYER: unlimited use of the interface, key
    // saved once, renders kept far longer than fal's ~7-day cleanup. It has
    // NO DP-engine access — the engine starts at Filmmaker (mirrored server
    // side in lib/engineUsage.ts, where Starter's included generations are 0).
    // The feature list deliberately ENDS ON A BENEFIT, not on what it lacks.
    blurb: 'Unlimited use of the studio interface on your own key: every generator, one clean cockpit, no expiring credits. Compute on your own key at fal’s rate.',
    features: [
      'Unlimited use of every generator: video, image, audio',
      'Your prompts, sent as written. The full DP engine lives in Filmmaker and Pro.',
      'fal rates only, no markup from us',
      'Save your fal.ai key once, render everywhere',
      'Renders kept about 30 days, instead of fal’s roughly 7-day cleanup',
    ],
    cta: 'Start rendering',
    note: 'Compute billed by fal at fal rates.',
    checkout: true,
  },
  {
    // id 'pro' is the FILMMAKER tier (id kept for billing continuity).
    id: 'pro',
    name: 'Filmmaker',
    academy: false,
    featured: true,
    // ANNUAL = TWO MONTHS FREE: yearly per-month display = monthly × 10 / 12.
    price: { yearly: '$20.83', monthly: '$24.99' }, // PLACEHOLDER
    yearlySave: 'Two months free — save $49.98 a year vs monthly', // PLACEHOLDER (tracks 2 × monthly)
    retention: 'Renders kept about 90 days · fair use', // PLACEHOLDER
    blurb: 'Everything in Starter, plus the full Director of Photography (DP) engine: real camera, lens, film stock and lighting decisions composed into your prompt, server side.',
    features: [
      'Everything in Starter: unlimited use of every generator',
      'Full DP engine: camera, lens, film stock, lighting — composed like a working Director of Photography would',
      '500 engine generations a month — enough to direct dozens of scenes, with room to spare',
      'Prompt engineering handled server side',
      'Tuned to land the shot in fewer tries',
    ],
    cta: 'Get Filmmaker',
    note: 'No verification needed.',
    checkout: true,
  },
  {
    // id 'studio' is the PRO tier (id kept for billing continuity).
    id: 'studio',
    name: 'Pro',
    academy: false,
    featured: false,
    // ANNUAL = TWO MONTHS FREE: yearly per-month display = monthly × 10 / 12.
    price: { yearly: '$33.33', monthly: '$39.99' }, // PLACEHOLDER
    yearlySave: 'Two months free — save $79.98 a year vs monthly', // PLACEHOLDER (tracks 2 × monthly)
    retention: 'Renders kept about 1 year · fair use', // PLACEHOLDER
    blurb: 'Everything in Filmmaker, plus the deepest engine allowance, the longest retention, and first looks at new tools as they join.',
    features: [
      'Everything in Filmmaker: unlimited generators plus the DP engine',
      '750 engine generations a month — headroom most working creators never touch',
      'Longest retention, about 1 year, fair use',
      'Priority render queue',
      'Early access to new CMA tools as they roll out',
    ],
    cta: 'Coming at launch',
    note: 'Self-serve checkout for this tier opens at launch.',
    // lib/billing.ts has no Stripe price for 'studio' yet; flipping this to
    // true without adding one would send users into a 400.
    checkout: false,
  },
];

/**
 * Storage top-ups (billing ids stay 'ext' / 'ext-plus', keyed by
 * lib/billing.ts and the checkout API; display names are free to change).
 */
export interface Extension {
  id: string;
  name: string;
  price: string; // per month - PLACEHOLDER
  blurb: string;
  /** what it adds - PLACEHOLDER, finalized after usage math */
  detail: string;
}

export const EXTENSIONS: Extension[] = [
  {
    id: 'ext',
    name: 'Storage Top-up',
    price: '$5.99', // PLACEHOLDER
    blurb: 'Extend your storage window. A monthly top-up that keeps your renders stored longer than your plan alone.',
    detail: '+60 extra days of render storage on top of your plan window',
  },
  {
    id: 'ext-plus',
    name: 'Storage Top-up+',
    price: '$14.99', // PLACEHOLDER
    blurb: 'The bigger top-up for heavy months, with the most storage headroom.',
    detail: '+180 extra days of render storage on top of your plan window',
  },
];

export function findTier(id: string | null | undefined): Tier | undefined {
  return TIERS.find((t) => t.id === id);
}
