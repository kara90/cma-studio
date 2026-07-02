/**
 * app/api/stripe/webhook/route.ts — Stripe webhook (edge).
 * The ONLY thing that grants a paid entitlement. Security rests on Stripe
 * signature verification (constructEventAsync) — without a valid signature we
 * reject, so nobody can POST a fake "you're paid" event. On valid subscription
 * events it writes app_metadata.cma_plan for the bound Supabase user using the
 * service-role admin client. Never trusts client input; there is no session here.
 */
import type Stripe from 'stripe';
import { getStripe, stripeCrypto } from '@/lib/stripe';
import { getSupabaseAdmin, isAdminConfigured } from '@/lib/supabaseAdmin';
import { buildCmaPlan, identifyPrice } from '@/lib/billing';

// Runs in the Cloudflare Workers node-compat runtime via OpenNext (no 'edge' export).
export const dynamic = 'force-dynamic';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  if (!WEBHOOK_SECRET || !isAdminConfigured) {
    return new Response('Billing webhook not configured.', { status: 503 });
  }
  const sig = request.headers.get('stripe-signature');
  if (!sig) return new Response('Missing signature.', { status: 400 });

  const raw = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, sig, WEBHOOK_SECRET, undefined, stripeCrypto);
  } catch {
    // Bad/forged signature — reject.
    return new Response('Invalid signature.', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        if (!userId || session.mode !== 'subscription' || !session.subscription) break;
        const sub = await stripe.subscriptions.retrieve(String(session.subscription));
        await applySubscription(userId, sub, session.metadata ?? undefined);
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id;
        if (userId) await applySubscription(userId, sub, sub.metadata ?? undefined);
        break;
      }
      default:
        break;
    }
  } catch {
    // Let Stripe retry on transient failures.
    return new Response('Handler error.', { status: 500 });
  }

  return new Response('ok', { status: 200 });
}

/** Version-proof period end: top-level in older API, on the item in newer. */
function periodEnd(sub: Stripe.Subscription): number | null {
  const s = sub as unknown as {
    current_period_end?: number;
    items?: { data?: Array<{ current_period_end?: number }> };
  };
  return s.current_period_end ?? s.items?.data?.[0]?.current_period_end ?? null;
}

async function applySubscription(
  userId: string,
  sub: Stripe.Subscription,
  metadata?: Record<string, string>,
) {
  const admin = getSupabaseAdmin();
  const priceId = sub.items.data[0]?.price?.id ?? '';
  const identified = identifyPrice(priceId);
  const kind = metadata?.kind ?? (identified?.kind ?? 'tier');
  const end = periodEnd(sub);

  // Read the user's CURRENT app_metadata and spread it, so buying an extension
  // never clobbers cma_plan (and vice versa). updateUserById REPLACES the whole
  // app_metadata object, so a bare `{ cma_plan }` would wipe every sibling key.
  const existing = await admin.auth.admin.getUserById(userId);
  if (existing.error) throw existing.error; // -> 500 -> Stripe retries
  const currentMeta = (existing.data.user?.app_metadata as Record<string, unknown> | undefined) ?? {};

  let nextMeta: Record<string, unknown>;
  if (kind === 'extension') {
    const extId = metadata?.extension_id ?? (identified?.kind === 'extension' ? identified.id : 'ext');
    nextMeta = {
      ...currentMeta,
      cma_extension: {
        id: extId,
        status: sub.status,
        expires: end ? new Date(end * 1000).toISOString() : undefined,
        stripe_subscription: sub.id,
      },
    };
  } else {
    const tier = (metadata?.tier ?? (identified?.kind === 'tier' ? identified.tier : 'pro')) as
      | 'student'
      | 'pro'
      | 'studio';
    const plan = buildCmaPlan({
      tier,
      status: sub.status, // active | trialing | past_due | canceled | ...
      currentPeriodEnd: end,
      customerId: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id,
      subscriptionId: sub.id,
    });
    nextMeta = { ...currentMeta, cma_plan: plan };
  }

  const updated = await admin.auth.admin.updateUserById(userId, { app_metadata: nextMeta });
  if (updated.error) throw updated.error; // -> 500 -> Stripe retries
}
