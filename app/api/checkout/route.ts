/**
 * app/api/checkout/route.ts — start a Stripe Checkout (edge).
 * Auth'd via verifyAccess (real Supabase user). The price is resolved
 * SERVER-SIDE from the tier/extension id, so the client can never buy the wrong
 * amount. The Supabase user id is bound to the session + subscription metadata
 * so the webhook can grant the right entitlement.
 */
import { verifySession } from '@/lib/authGuard';
import { getStripe, isStripeConfigured } from '@/lib/stripe';
import { priceForTier, priceForExtension, isCheckoutTier } from '@/lib/billing';
import type { Cycle } from '@/lib/plans';

// Runs in the Cloudflare Workers node-compat runtime via OpenNext (no 'edge' export).
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;
function bad(status: number, error: string) {
  return Response.json({ ok: false, error }, { status, headers: NO_STORE });
}

export async function POST(request: Request) {
  if (!isStripeConfigured) return bad(503, 'Billing is not configured yet.');

  // Session only — buying a plan must never require already having one.
  const access = await verifySession();
  if (!access.ok) return bad(access.status, access.error);
  if (!access.email) return bad(400, 'Your account has no email on file.');

  let body: {
    kind?: string;
    tier?: string;
    cycle?: Cycle;
    extensionId?: string;
    consent?: boolean;
    consent_at?: string;
    consent_version?: string;
  };
  try {
    body = await request.json();
  } catch {
    return bad(400, 'Malformed request.');
  }

  let priceId: string | undefined;
  const metadata: Record<string, string> = { supabase_user_id: access.userId };

  // Checkout-time acceptance record (G4.4): the shopper ticked the required
  // consent adjacent to the pay button. Stamp it onto the Stripe session AND
  // subscription metadata so date, time, and terms version are durably tied to
  // the purchase (the webhook can mirror this to the account at the gate).
  if (body.consent === true) {
    metadata.consent = 'true';
    if (typeof body.consent_at === 'string') metadata.consent_at = body.consent_at.slice(0, 40);
    if (typeof body.consent_version === 'string') metadata.consent_version = body.consent_version.slice(0, 40);
  }

  if (body.kind === 'extension') {
    priceId = priceForExtension(body.extensionId ?? '');
    metadata.kind = 'extension';
    metadata.extension_id = body.extensionId ?? '';
  } else {
    const tier = body.tier ?? '';
    const cycle: Cycle = body.cycle === 'monthly' ? 'monthly' : 'yearly';
    if (!isCheckoutTier(tier)) return bad(400, 'That plan is sales-only — contact us.');
    priceId = priceForTier(tier, cycle);
    metadata.kind = 'tier';
    metadata.tier = tier;
    metadata.cycle = cycle;
  }

  if (!priceId) return bad(400, 'That plan is not available for checkout yet.');

  const origin =
    request.headers.get('origin') ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    new URL(request.url).origin;

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: access.userId,
      customer_email: access.email,
      // Off by default: a 100%-off code would mint an 'active' $0 plan once the
      // entitlement gate is enforced. Re-enable only with paid-status checks.
      allow_promotion_codes: false,
      metadata,
      subscription_data: { metadata },
      success_url: `${origin}/studio?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancelled`,
    });
    if (!session.url) return bad(502, 'Could not start checkout.');
    return Response.json({ ok: true, url: session.url }, { headers: NO_STORE });
  } catch {
    return bad(502, 'Could not reach the billing service. Try again.');
  }
}
