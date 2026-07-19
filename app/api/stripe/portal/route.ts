/**
 * app/api/stripe/portal/route.ts — open the Stripe Customer Billing Portal.
 *
 * The portal is Stripe-hosted and handles cancel, update card, and invoices —
 * which is what the Refund Policy promises ("cancel with a click / manage your
 * subscription"). Auth'd via verifySession; the caller's Stripe customer id is
 * read from their OWN entitlement metadata (app_metadata.cma_plan), so a user
 * can only ever manage their own subscription. Inert (503) until Stripe secrets
 * are set, exactly like /api/checkout.
 */
import { verifySession } from '@/lib/authGuard';
import { getStripe, isStripeConfigured } from '@/lib/stripe';
import { createServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;
function bad(status: number, error: string) {
  return Response.json({ ok: false, error }, { status, headers: NO_STORE });
}

export async function POST(request: Request) {
  if (!isStripeConfigured) return bad(503, 'Billing is not configured yet.');

  const access = await verifySession();
  if (!access.ok) return bad(access.status, access.error);

  // The Stripe customer id lives in the user's server-controlled entitlement
  // (written by the webhook). Read it from the authenticated user directly.
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const plan = (user?.app_metadata as { cma_plan?: { stripe_customer?: string } } | undefined)?.cma_plan;
  const customer = plan?.stripe_customer;
  if (!customer) return bad(400, 'No subscription found on this account.');

  const origin =
    request.headers.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

  try {
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer,
      return_url: `${origin}/pricing`,
    });
    if (!session.url) return bad(502, 'Could not open the billing portal.');
    return Response.json({ ok: true, url: session.url }, { headers: NO_STORE });
  } catch {
    return bad(502, 'Could not reach the billing service. Try again.');
  }
}
