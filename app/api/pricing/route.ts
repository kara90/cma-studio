/**
 * app/api/pricing/route.ts — LIVE fal price proxy (BYOK).
 *
 * POST { userApiKey, models: string[] } → { ok, prices: { [modelId]: LivePrice } }
 *
 * Queries fal's official pricing API (GET api.fal.ai/v1/models/pricing) with
 * the USER'S OWN key, so the returned unit prices reflect their account. The
 * client never learns fal slugs (client-safe rule): it sends model IDS and the
 * server resolves slugs via lib/modelEndpoints.
 *
 * Key discipline (locked): the key is used in-memory for this one upstream
 * call and is never stored or logged — same contract as /api/generate.
 *
 * Caching: per-isolate in-memory, keyed slug (6h TTL, bounded). Prices change
 * rarely; this also keeps us far from fal's pricing-API rate limits. NO KV
 * writes (the account-wide KV write budget is reserved for real records).
 */
import { z } from 'zod';
import { verifySession } from '@/lib/authGuard';
import { softRateLimit } from '@/lib/rateLimit';
import { getPricingSlug } from '@/lib/modelEndpoints';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

const BodySchema = z.object({
  userApiKey: z.string().trim().min(8).max(200),
  models: z.array(z.string().min(1).max(60)).min(1).max(30),
});

interface CachedPrice {
  unitPrice: number;
  unit: string;
  currency: string;
  at: number;
}
const TTL_MS = 6 * 60 * 60 * 1000;
const cache = new Map<string, CachedPrice>();

export async function POST(request: Request) {
  const access = await verifySession();
  if (!access.ok) return Response.json({ ok: false, error: access.error }, { status: access.status, headers: NO_STORE });

  const ip = request.headers.get('cf-connecting-ip') ?? 'anon';
  if (!softRateLimit(`pricing:${access.userId}:${ip}`, 20, 60_000)) {
    return Response.json({ ok: false, error: 'Too many pricing requests.' }, { status: 429, headers: NO_STORE });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return Response.json({ ok: false, error: 'Invalid request.' }, { status: 400, headers: NO_STORE });
  }

  // Model id → slug, ONLY for models we actually ship (never an open proxy).
  const slugByModel = new Map<string, string>();
  for (const id of body.models) {
    const slug = getPricingSlug(id);
    if (slug) slugByModel.set(id, slug);
  }
  if (slugByModel.size === 0) {
    return Response.json({ ok: false, error: 'No known models requested.' }, { status: 400, headers: NO_STORE });
  }

  const now = Date.now();
  const missing = [...new Set(slugByModel.values())].filter((s) => {
    const hit = cache.get(s);
    return !hit || now - hit.at > TTL_MS;
  });

  if (missing.length > 0) {
    try {
      const url = `https://api.fal.ai/v1/models/pricing?endpoint_id=${missing.map(encodeURIComponent).join(',')}`;
      const res = await fetch(url, { headers: { Authorization: `Key ${body.userApiKey}` }, signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const json = (await res.json()) as { prices?: Array<{ endpoint_id?: string; unit_price?: number; unit?: string; currency?: string }> };
        for (const p of json.prices ?? []) {
          if (p.endpoint_id && typeof p.unit_price === 'number' && p.unit) {
            cache.set(p.endpoint_id, { unitPrice: p.unit_price, unit: p.unit, currency: p.currency ?? 'USD', at: now });
          }
        }
        // Bound the cache defensively (slug set is small, but never grow unbounded).
        if (cache.size > 300) {
          for (const key of [...cache.keys()].slice(0, cache.size - 300)) cache.delete(key);
        }
      } else if (res.status === 401 || res.status === 403) {
        return Response.json({ ok: false, error: 'Fal.ai rejected your API key.' }, { status: 401, headers: NO_STORE });
      }
      // Other upstream failures fall through: we return whatever the cache has.
    } catch {
      /* network/timeout — serve cache-only below; the client falls back to hints */
    }
  }

  const prices: Record<string, { unitPrice: number; unit: string; currency: string }> = {};
  for (const [modelId, slug] of slugByModel) {
    const hit = cache.get(slug);
    if (hit) prices[modelId] = { unitPrice: hit.unitPrice, unit: hit.unit, currency: hit.currency };
  }
  return Response.json({ ok: true, prices }, { headers: NO_STORE });
}
