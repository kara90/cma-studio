/**
 * ============================================================================
 * FAL RATES — ONE PLACE TO EDIT  >>>  SEBASTIEN: KEEP THESE CURRENT  <<<
 * ============================================================================
 *
 * Feeds the expandable "What rendering costs on your own key" section on
 * /pricing (components/pricing/FalCostTable.tsx). Only the handful of models
 * people actually ask about — deliberately NOT the full catalog (no maze).
 *
 * These numbers are INDICATIVE ONLY. They are set by fal.ai, billed by fal.ai
 * directly to the user's own account, can change at any time without notice to
 * us, and are separate from the CMA software fee. The UI carries a disclaimer
 * + a live link to fal's official pricing page; RATES_AS_OF renders visibly.
 *
 * TODO(Sebastien) — VERIFY BEFORE LAUNCH: check each figure against
 * https://fal.ai/pricing and update RATES_AS_OF when you do.
 */

/** Shown in the UI as "rates as of …". Update whenever you re-check fal. */
export const RATES_AS_OF = 'July 18, 2026';

/** fal's official pricing page — the source of truth, linked in the UI. */
export const FAL_PRICING_URL = 'https://fal.ai/pricing';

export interface FalRate {
  model: string;
  kind: 'video' | 'image';
  /** what a typical single render is, in plain words */
  unit: string;
  /** approximate cost of that unit at fal's published rate */
  approx: string;
}

export const FAL_RATES: FalRate[] = [
  { model: 'Seedance 2.0', kind: 'video', unit: '5s clip · 720p', approx: 'about $1.50' },
  { model: 'Kling 3.0', kind: 'video', unit: '5s clip · 1080p', approx: 'about $2 to $3' },
  { model: 'Veo 3.1', kind: 'video', unit: '8s clip · with audio', approx: 'about $3 to $4' },
  { model: 'Nano Banana Pro', kind: 'image', unit: 'one image', approx: 'about $0.10 to $0.20' },
];
