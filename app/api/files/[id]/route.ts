/**
 * app/api/files/[id]/route.ts — serve ONE stored render back to its owner.
 * The object key is always `u/{authenticated userId}/{id}` — ownership is
 * structural (you cannot name your way into someone else's prefix), the id is
 * strictly validated against the token.ext shape, and access expires with the
 * plan's retention window. `?download=1` adds a Content-Disposition attachment.
 */
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { verifyAccess } from '@/lib/authGuard';
import { retentionDays } from '@/lib/retention';

export const dynamic = 'force-dynamic';

// queue token (6-120 url-safe chars) + a short extension — no slashes, no traversal
const ID_RE = /^[A-Za-z0-9_-]{6,120}\.[a-z0-9]{2,5}$/;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await verifyAccess();
  if (!access.ok) return Response.json({ ok: false, error: access.error }, { status: access.status });

  const { id } = await params;
  if (!ID_RE.test(id)) return Response.json({ ok: false, error: 'Invalid file id.' }, { status: 400 });

  let bucket;
  try {
    bucket = getCloudflareContext().env.RENDERS;
  } catch {
    bucket = undefined;
  }
  if (!bucket) return Response.json({ ok: false, error: 'Storage is not available here.' }, { status: 503 });

  const obj = await bucket.get(`u/${access.userId}/${id}`);
  if (!obj) return Response.json({ ok: false, error: 'File not found.' }, { status: 404 });

  // Retention gate — access ends when the plan window does, even if the object
  // still exists (R2 lifecycle cleanup runs separately).
  const ageMs = Date.now() - new Date(obj.uploaded).getTime();
  if (ageMs > retentionDays(access.tier) * 86_400_000) {
    return Response.json({ ok: false, error: 'This file is past your plan\'s storage window.' }, { status: 410 });
  }

  const headers = new Headers({
    'Content-Type': obj.httpMetadata?.contentType ?? 'application/octet-stream',
    'Content-Length': String(obj.size),
    'Cache-Control': 'private, max-age=3600',
  });
  if (new URL(request.url).searchParams.get('download') === '1') {
    headers.set('Content-Disposition', `attachment; filename="cma-${id}"`);
  }
  return new Response(obj.body, { headers });
}
