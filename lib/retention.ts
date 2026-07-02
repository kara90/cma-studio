/**
 * lib/retention.ts — plan storage retention (client + server safe).
 * How long a user's finished renders stay in CMA storage, by tier. The tier ids
 * are the Stripe/billing ids (display names differ: student=Starter,
 * pro=Filmmaker, studio=Pro). Numbers are PLACEHOLDERS matching lib/plans.ts —
 * Sebastien finalizes both together.
 */

export const RETENTION_DAYS: Record<string, number> = {
  student: 30, // Starter — renders kept about 30 days
  pro: 90, // Filmmaker — about 90 days
  studio: 365, // Pro — about 1 year
};

/** Fallback window for signed-in users without a recognized tier (soft launch). */
export const DEFAULT_RETENTION_DAYS = 30;

export function retentionDays(tier: string | null | undefined): number {
  return (tier && RETENTION_DAYS[tier]) || DEFAULT_RETENTION_DAYS;
}

/** Whole days of retention left for a file stored at `uploaded`. */
export function daysLeft(uploaded: Date | string | number, tier: string | null | undefined): number {
  const t = typeof uploaded === 'object' ? uploaded.getTime() : new Date(uploaded).getTime();
  const expires = t + retentionDays(tier) * 86_400_000;
  return Math.max(0, Math.ceil((expires - Date.now()) / 86_400_000));
}
