/**
 * lib/access.ts — shared access policy (pure, no Supabase import).
 * Safe to import from both client and server. The AUTHORITATIVE enforcement
 * lives server-side in lib/authGuard.ts + the API routes; this module only
 * holds the rules they both reference.
 */

export const IS_PROD = process.env.NODE_ENV === 'production';

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

/**
 * A local convenience bypass so the workspace is usable with NO Supabase
 * project wired up — but ONLY in development, AND only when explicitly opted in
 * via NEXT_PUBLIC_CMA_ALLOW_DEV_BYPASS=1 (set in .env.local). Belt-and-braces:
 * even if a real deploy somehow ran with a non-production NODE_ENV, the absence
 * of the opt-in flag keeps auth failing CLOSED.
 */
export const DEV_AUTH_BYPASS =
  !IS_PROD && !isSupabaseConfigured && process.env.NEXT_PUBLIC_CMA_ALLOW_DEV_BYPASS === '1';

/**
 * Academy gate. Domain allowlist via NEXT_PUBLIC_ACADEMY_ALLOWED_DOMAINS.
 * Blank allowlist → allowed in dev, DENIED in production (fail closed).
 * This is a coarse gate; the real per-user entitlement check is in authGuard.
 */
export function isAcademyEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = (process.env.NEXT_PUBLIC_ACADEMY_ALLOWED_DOMAINS ?? '')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) return !IS_PROD; // fail closed in prod
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  return allowed.includes(domain);
}

/**
 * Client-safe entitlement check — reads the Stripe-provisioned plan the webhook
 * wrote into app_metadata (server-controlled; users cannot edit it). Mirrors the
 * server-authoritative isPlanActive() in authGuard. Used to route un-subscribed
 * users to /pricing for a clean UX; the real gate is still server-side.
 */
export function hasActivePlan(appMetadata: Record<string, unknown> | null | undefined): boolean {
  const plan = appMetadata?.cma_plan as { status?: string; expires?: string } | undefined;
  if (!plan) return false;
  if (plan.status !== 'active' && plan.status !== 'trialing') return false;
  if (plan.expires) return Date.parse(plan.expires) > Date.now();
  return true;
}
