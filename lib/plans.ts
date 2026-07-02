/**
 * lib/plans.ts — pricing data (client-safe, single source of truth).
 * ⚠️ PLACEHOLDERS: prices are locked, but output CAPS and EXTENSION benefits are
 * TBD — Sebastien to finalize after usage math. Change them here only.
 */

export type Cycle = 'yearly' | 'monthly';

export interface Tier {
  id: 'student' | 'pro' | 'studio';
  name: string;
  /** requires academy email verification */
  academy: boolean;
  /** visually highlighted card */
  featured: boolean;
  price: { yearly: string; monthly: string };
  /** the monthly output ceiling — shown prominently */
  cap: string;
  blurb: string;
  features: string[];
  cta: string;
  note: string;
}

export const TIERS: Tier[] = [
  {
    id: 'student',
    name: 'Student Pro',
    academy: true,
    featured: false,
    price: { yearly: '$19.99', monthly: '$29.99' },
    cap: 'Up to 600 renders / month', // same volume as Pro
    blurb: 'Every Pro feature — at the enrolled-student price.',
    features: [
      'CMA Studio Pro — the full engine',
      'Every camera, lens & model',
      'Auto-Direct + manual control',
      'Same render volume as Pro',
      'Student discount on every future CMA tool',
      'BYOK — render on your own Fal key',
    ],
    cta: 'Verify & start',
    note: 'Requires academy verification · your student discount never expires.',
  },
  {
    id: 'pro',
    name: 'Pro',
    academy: false,
    featured: true,
    price: { yearly: '$35.99', monthly: '$39.99' },
    cap: 'Up to 600 renders / month', // same volume as Student Pro
    blurb: 'The exact same engine — for every working filmmaker.',
    features: [
      'CMA Studio Pro — the full engine',
      'Every camera, lens & model',
      'Auto-Direct + manual control',
      'Priority render queue',
      'BYOK — render on your own Fal key',
    ],
    cta: 'Get Pro',
    note: 'No verification needed.',
  },
  {
    id: 'studio',
    name: 'Studio',
    academy: false,
    featured: false,
    price: { yearly: 'Custom', monthly: 'Custom' },
    cap: 'High-volume — thousands / month', // TBD
    blurb: 'For studios, agencies & heavy users who go all-in.',
    features: [
      'Everything in Pro',
      'Highest output ceiling',
      'Team seats & shared presets',
      'Dedicated support',
    ],
    cta: 'Talk to us',
    note: 'For companies & teams at scale.',
  },
];

export interface Extension {
  id: string;
  name: string;
  price: string; // per month
  blurb: string;
  /** what it adds — TBD after usage math */
  detail: string;
}

export const EXTENSIONS: Extension[] = [
  {
    id: 'ext',
    name: 'Extension',
    price: '$5.99',
    blurb: 'A monthly top-up of extra renders on top of your plan.',
    detail: '+ extra renders / month · amount TBD',
  },
  {
    id: 'ext-plus',
    name: 'Extension+',
    price: '$14.99',
    blurb: 'A bigger monthly top-up for the busy months.',
    detail: '+ more renders / month · amount TBD',
  },
];

export function findTier(id: string | null | undefined): Tier | undefined {
  return TIERS.find((t) => t.id === id);
}
