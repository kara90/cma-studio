/**
 * lib/costEstimate.ts — CLIENT-SAFE live cost-estimate math.
 *
 * fal's official pricing API (api.fal.ai/v1/models/pricing, queried through our
 * /api/pricing proxy with the USER'S OWN key) returns one unit price per
 * endpoint: { unit_price, unit, currency }. This module turns that into the
 * "≈ $X.XX · estimate, billed by fal" figure shown before a render.
 *
 * HONESTY RULES (locked):
 *  - Always an ESTIMATE, never a quote: prices are set by fal, can change at
 *    any time, and are billed by fal directly to the user's own account.
 *  - When the unit semantics can't be mapped confidently (e.g. per-megapixel
 *    models), we show the unit price with its unit label instead of guessing.
 *  - No live price (no key / fetch failed) → callers fall back to the model's
 *    static costHint from lib/modelRegistry (also labeled approximate).
 */

export interface LivePrice {
  /** price per unit in `currency`, as returned by fal for THIS user's account */
  unitPrice: number;
  /** fal's billing unit for the endpoint, e.g. 'video_second', 'image', 'request' */
  unit: string;
  currency: string;
}

export interface EstimateInput {
  /** selected clip length in seconds (video/audio models), when the UI knows it */
  durationSeconds?: number;
}

export interface Estimate {
  /** formatted, user-facing figure, e.g. "≈ $1.50" or "$0.03 per image" */
  text: string;
  /** true when this is a computed total; false when we show a per-unit rate */
  isTotal: boolean;
}

function money(n: number, currency: string): string {
  const sym = currency === 'USD' ? '$' : `${currency} `;
  return `${sym}${n >= 1 ? n.toFixed(2) : n.toPrecision(2)}`;
}

/** Human label for fal's unit strings (best-effort; unknown units pass through). */
function unitLabel(unit: string): string {
  switch (unit) {
    case 'video_second':
    case 'second':
      return 'per second';
    case 'image':
      return 'per image';
    case 'video':
      return 'per video';
    case 'request':
      return 'per render';
    case 'megapixel':
      return 'per megapixel';
    default:
      return `per ${unit.replace(/_/g, ' ')}`;
  }
}

/**
 * Compute the estimate for a model given fal's live unit price. Per-second
 * units multiply by the selected duration; single-shot units are the price
 * itself; anything else (per-megapixel, unknown) shows the per-unit rate.
 */
export function computeEstimate(price: LivePrice, input: EstimateInput): Estimate {
  const perSecond = price.unit === 'video_second' || price.unit === 'second';
  if (perSecond && input.durationSeconds && input.durationSeconds > 0) {
    return { text: `≈ ${money(price.unitPrice * input.durationSeconds, price.currency)}`, isTotal: true };
  }
  if (price.unit === 'image' || price.unit === 'video' || price.unit === 'request') {
    return { text: `≈ ${money(price.unitPrice, price.currency)}`, isTotal: true };
  }
  return { text: `${money(price.unitPrice, price.currency)} ${unitLabel(price.unit)}`, isTotal: false };
}
