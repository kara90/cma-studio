/**
 * app/api/status/route.ts — RENDER POLLER (edge, model-aware)
 * ─────────────────────────────────────────────────────────────────────────
 * Polls the selected model's Fal queue for a job. Auth is enforced server-side;
 * the token is strictly validated (path-injection guard); the finished asset
 * (video or image, per the model) is returned. Nothing cached.
 */
import { verifyAccess } from '@/lib/authGuard';
import { queueStatusUrl, queueResultUrl, falAuthHeader } from '@/lib/falConfig';
import { getModelEndpoint } from '@/lib/modelEndpoints';
import type { StatusResult, StatusState } from '@/lib/vcpTypes';

// Runs in the Cloudflare Workers node-compat runtime via OpenNext (no 'edge' export).
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;
const TOKEN_RE = /^[A-Za-z0-9_-]{6,120}$/;

function reply(payload: StatusResult, status = 200) {
  return Response.json(payload, { status, headers: NO_STORE });
}

export async function POST(request: Request) {
  const access = await verifyAccess();
  if (!access.ok) return reply({ ok: false, status: 'ERROR', error: access.error }, access.status);

  let body: { trackingToken?: unknown; userApiKey?: unknown; model?: unknown };
  try {
    body = await request.json();
  } catch {
    return reply({ ok: false, status: 'ERROR', error: 'Malformed JSON body.' }, 400);
  }

  const userApiKey = typeof body.userApiKey === 'string' ? body.userApiKey.trim() : '';
  const trackingToken = typeof body.trackingToken === 'string' ? body.trackingToken.trim() : '';
  const model = typeof body.model === 'string' ? body.model : '';

  if (userApiKey.length < 8) return reply({ ok: false, status: 'ERROR', error: 'Missing Fal.ai API key.' }, 401);
  if (!TOKEN_RE.test(trackingToken)) return reply({ ok: false, status: 'ERROR', error: 'Invalid tracking token.' }, 400);

  const endpoint = getModelEndpoint(model);
  if (!endpoint) return reply({ ok: false, status: 'ERROR', error: 'Unknown model.' }, 400);

  const auth = { Authorization: falAuthHeader(userApiKey) };

  try {
    const statusRes = await fetch(queueStatusUrl(endpoint.slug, trackingToken), { headers: auth, cache: 'no-store' });
    if (!statusRes.ok) {
      if (statusRes.status === 401 || statusRes.status === 403) {
        return reply({ ok: false, status: 'ERROR', error: 'Fal.ai rejected your API key.' }, 401);
      }
      return reply({ ok: false, status: 'ERROR', error: `Poll failed (${statusRes.status}).` }, 502);
    }

    const s = (await statusRes.json()) as { status?: string; queue_position?: number };
    const state = normalize(s.status);

    if (state === 'ERROR') {
      return reply({ ok: false, status: 'ERROR', error: 'The render failed on the compute layer.' });
    }
    if (state !== 'COMPLETED') {
      return reply({ ok: true, status: state, output: endpoint.output, queuePosition: s.queue_position });
    }

    const resultRes = await fetch(queueResultUrl(endpoint.slug, trackingToken), { headers: auth, cache: 'no-store' });
    if (!resultRes.ok) {
      return reply({ ok: false, status: 'ERROR', error: 'Could not fetch the finished render.' }, 502);
    }
    const resultJson = (await resultRes.json()) as Record<string, unknown>;
    const mediaUrl = endpoint.parseResult(resultJson);
    if (!mediaUrl) {
      return reply({ ok: false, status: 'ERROR', error: 'Render finished without an output URL.' }, 502);
    }
    const seed = typeof resultJson.seed === 'number' ? resultJson.seed : undefined;
    return reply({ ok: true, status: 'COMPLETED', output: endpoint.output, mediaUrl, seed });
  } catch {
    return reply({ ok: false, status: 'ERROR', error: 'Could not reach the render service.' }, 504);
  }
}

function normalize(raw: string | undefined): StatusState {
  switch ((raw ?? '').toUpperCase()) {
    case 'COMPLETED':
    case 'OK':
      return 'COMPLETED';
    case 'IN_PROGRESS':
      return 'IN_PROGRESS';
    case 'IN_QUEUE':
      return 'IN_QUEUE';
    case 'FAILED':
    case 'ERROR':
    case 'CANCELLED':
      return 'ERROR';
    default:
      return 'IN_QUEUE';
  }
}
