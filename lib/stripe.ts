/**
 * lib/stripe.ts — server-only Stripe client, edge/Workers compatible.
 * Uses the fetch HTTP client + SubtleCrypto so it runs on Cloudflare's edge.
 * Never expose STRIPE_SECRET_KEY to the client (it is NOT a NEXT_PUBLIC var).
 */
import Stripe from 'stripe';

export const isStripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;
  cached = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_placeholder', {
    httpClient: Stripe.createFetchHttpClient(),
  });
  return cached;
}

/** Async, edge-safe crypto provider for webhook signature verification. */
export const stripeCrypto = Stripe.createSubtleCryptoProvider();
