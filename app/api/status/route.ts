/**
 * app/api/status/route.ts — RENDER POLLER (edge, model-aware)
 * ─────────────────────────────────────────────────────────────────────────
 * Polls the selected model's Fal queue for a job. Auth is enforced server-side;
 * the token is strictly validated (path-injection guard); the finished asset
 * (video or image, per the model) is returned. Nothing cached.
 */
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { verifyAccess } from '@/lib/authGuard';
import { queueStatusUrl, queueResultUrl, falAuthHeader } from '@/lib/falConfig';
import { getModelEndpoint } from '@/lib/modelEndpoints';
import type { StatusResult, StatusState, OutputKind } from '@/lib/vcpTypes';

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

  let body: { trackingToken?: unknown; userApiKey?: unknown; model?: unknown; promptNote?: unknown };
  try {
    body = await request.json();
  } catch {
    return reply({ ok: false, status: 'ERROR', error: 'Malformed JSON body.' }, 400);
  }

  const userApiKey = typeof body.userApiKey === 'string' ? body.userApiKey.trim() : '';
  const trackingToken = typeof body.trackingToken === 'string' ? body.trackingToken.trim() : '';
  const model = typeof body.model === 'string' ? body.model : '';
  // Optional short scene note the client sends so the stored file is labelled in
  // the user's library. User's own text about their own render — capped hard.
  const promptNote = typeof body.promptNote === 'string' ? body.promptNote.slice(0, 200) : '';

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

    // ── CMA STORAGE ── copy the finished file into R2 so the user keeps access
    // for their plan's retention window (fal deletes its copies after ~7 days).
    // Keyed under the OWNER's user id — that prefix is the access boundary the
    // files API enforces. Idempotent per render (the queue token is unique), and
    // a storage failure never fails the render response.
    const stored = await storeRender(access.userId, trackingToken, mediaUrl, endpoint.output, model, promptNote);

    return reply({ ok: true, status: 'COMPLETED', output: endpoint.output, mediaUrl, seed, stored });
  } catch {
    return reply({ ok: false, status: 'ERROR', error: 'Could not reach the render service.' }, 504);
  }
}

/** File extension by output kind + source hints (cosmetic only — the stored
 * content type is what the browser trusts). */
function pickExt(url: string, contentType: string | null, output: OutputKind): string {
  const fromUrl = /\.([a-z0-9]{2,5})(?:\?|#|$)/i.exec(new URL(url).pathname)?.[1]?.toLowerCase();
  if (fromUrl && /^(mp4|webm|mov|png|jpg|jpeg|webp|gif|mp3|wav|ogg|flac|m4a)$/.test(fromUrl)) return fromUrl;
  const ct = (contentType ?? '').toLowerCase();
  if (ct.includes('wav')) return 'wav';
  if (ct.includes('mpeg') && output === 'audio') return 'mp3';
  if (ct.includes('png')) return 'png';
  if (ct.includes('jpeg')) return 'jpg';
  if (ct.includes('webm')) return 'webm';
  return output === 'image' ? 'png' : output === 'audio' ? 'mp3' : 'mp4';
}

async function storeRender(
  userId: string,
  token: string,
  mediaUrl: string,
  output: OutputKind,
  model: string,
  note: string,
): Promise<boolean> {
  try {
    const bucket = getCloudflareContext().env.RENDERS;
    if (!bucket) return false; // binding absent (plain local dev) — render still returned
    const res = await fetch(mediaUrl);
    if (!res.ok || !res.body) return false;
    const contentType = res.headers.get('content-type');
    const ext = pickExt(mediaUrl, contentType, output);
    const key = `u/${userId}/${token}.${ext}`;
    // Idempotence: polls can race after COMPLETED — first write wins.
    if (await bucket.head(key)) return true;
    await bucket.put(key, res.body, {
      httpMetadata: { contentType: contentType ?? undefined },
      customMetadata: { model, output, note },
    });
    return true;
  } catch {
    return false; // storage is best-effort; the user still has the fal URL
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
