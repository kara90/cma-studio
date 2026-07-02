/**
 * lib/plans.ts - pricing data (client-safe, single source of truth).
 *
 * =========================== PLACEHOLDER PRICING ===========================
 * EVERY price, saving figure, retention window and extension benefit in this
 * file is a PLACEHOLDER. Sebastien finalizes the real numbers before launch.
 * The UI surfaces this with a small "placeholder pricing" chip.
 * ===========================================================================
 *
 * The scheme: a low flat fee for the software. Compute runs on the member's
 * own fal.ai key at fal's own rate, no markup from us. Tiers are
 * differentiated by RETENTION and perks, never by removing the core value.
 *
 * Retention wording rules: never "permanent", never "unlimited", never
 * "forever". Always "about N days / about 1 year" plus "fair use".
 */

export type Cycle = 'yearly' | 'monthly';

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
    price: { yearly: '$2.99', monthly: '$3.99' }, // PLACEHOLDER
    yearlySave: 'About $12 saved per year', // PLACEHOLDER
    retention: 'Renders kept about 30 days · fair use', // PLACEHOLDER
    blurb: 'Start rendering without a credit trap. One small fee for the software, compute on your own key.',
    features: [
      'The clean model interface, pick any model',
      'Renders run on your own fal.ai key',
      'fal rates only, no markup from us',
      'No expiring credits',
    ],
    cta: 'Start rendering',
    note: 'Cancel anytime. Compute billed by fal at fal rates.',
    checkout: true,
  },
  {
    // id 'pro' is the FILMMAKER tier (id kept for billing continuity).
    id: 'pro',
    name: 'Filmmaker',
    academy: false,
    featured: true,
    price: { yearly: '$14.99', monthly: '$24.99' }, // PLACEHOLDER
    yearlySave: 'About $10 per month saved', // PLACEHOLDER
    retention: 'Renders kept about 90 days · fair use', // PLACEHOLDER
    blurb: 'Everything in Starter, plus the full CMA Studio. Real camera, lens, film stock and lighting control, engineered server side.',
    features: [
      'Everything in Starter',
      'Full CMA Studio: camera, lens, film stock, lighting',
      'Prompt engineering handled server side',
      'Tuned to land the shot in fewer tries',
    ],
    cta: 'Get Filmmaker',
    note: 'No verification needed. Cancel anytime.',
    checkout: true,
  },
  {
    // id 'studio' is the PRO tier (id kept for billing continuity).
    id: 'studio',
    name: 'Pro',
    academy: false,
    featured: false,
    price: { yearly: '$29.99', monthly: '$39.99' }, // PLACEHOLDER
    yearlySave: 'About $10 per month saved', // PLACEHOLDER
    retention: 'Renders kept about 1 year · fair use', // PLACEHOLDER
    blurb: 'Everything in Filmmaker, plus the longest retention and first access to everything new.',
    features: [
      'Everything in Filmmaker',
      'Longest retention, about 1 year, fair use',
      'Priority render queue',
      'Early access to every new CMA tool',
    ],
    cta: 'Coming at launch',
    note: 'Self-serve checkout for this tier opens at launch.',
    // lib/billing.ts has no Stripe price for 'studio' yet; flipping this to
    // true without adding one would send users into a 400.
    checkout: false,
  },
];

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
    name: 'Extension',
    price: '$5.99', // PLACEHOLDER
    blurb: 'A monthly add-on that keeps your renders stored longer than your plan alone.',
    detail: '+ extended retention · exact window TBD',
  },
  {
    id: 'ext-plus',
    name: 'Extension+',
    price: '$14.99', // PLACEHOLDER
    blurb: 'The bigger add-on for heavy months, with the most storage headroom.',
    detail: '+ the biggest retention bump · exact window TBD',
  },
];

export function findTier(id: string | null | undefined): Tier | undefined {
  return TIERS.find((t) => t.id === id);
}
