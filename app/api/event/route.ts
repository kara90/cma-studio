/**
 * app/api/event/route.ts — FIRST-PARTY analytics beacon (no third parties).
 *
 * The platform ships ZERO trackers (enforced by tests/no-key-logging.test.mjs).
 * Analytics are a tiny allowlisted event name posted here and written to
 * Cloudflare's own observability logs — no cookies, no identifiers, no bodies
 * beyond the event name, no KV writes (the KV write budget is reserved for
 * real records). Counts are read in the Cloudflare dashboard's worker logs.
 */
import { z } from 'zod';
import { softRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

/** The only events that exist. Anything else is dropped. */
const EVENTS = ['signup_intent', 'first_render', 'recipe_share', 'subscribe_intent'] as const;

const BodySchema = z.object({ event: z.enum(EVENTS) });

export async function POST(request: Request) {
  const ip = request.headers.get('cf-connecting-ip') ?? 'anon';
  if (!softRateLimit(`evt:${ip}`, 30, 60_000)) {
    return new Response(null, { status: 204, headers: NO_STORE }); // silently drop floods
  }
  try {
    const { event } = BodySchema.parse(await request.json());
    // Structured log line only — picked up by Workers observability. Contains
    // the event name and nothing else. Never user data, never a key.
    console.log(JSON.stringify({ cma_event: event }));
  } catch {
    /* invalid events are dropped silently — this endpoint never errors loudly */
  }
  return new Response(null, { status: 204, headers: NO_STORE });
}
