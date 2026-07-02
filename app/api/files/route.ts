/**
 * app/api/files/route.ts — the user's CMA storage library (GET).
 * Lists every render stored for the AUTHENTICATED user, filtered to their
 * plan's retention window (lib/retention.ts). The R2 key prefix `u/{userId}/`
 * is the ownership boundary: a user can only ever list their own prefix, so
 * there is nothing to enumerate or traverse.
 */
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { verifyAccess } from '@/lib/authGuard';
import { retentionDays, daysLeft } from '@/lib/retention';
import type { FilesResult, StoredFile, OutputKind } from '@/lib/vcpTypes';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

function reply(payload: FilesResult, status = 200) {
  return Response.json(payload, { status, headers: NO_STORE });
}

export async function GET() {
  const access = await verifyAccess();
  if (!access.ok) return reply({ ok: false, error: access.error }, access.status);

  let bucket;
  try {
    bucket = getCloudflareContext().env.RENDERS;
  } catch {
    bucket = undefined;
  }
  if (!bucket) return reply({ ok: true, files: [], retentionDays: retentionDays(access.tier), storageOffline: true });

  try {
    const window = retentionDays(access.tier);
    const cutoff = Date.now() - window * 86_400_000;
    const prefix = `u/${access.userId}/`;

    const files: StoredFile[] = [];
    let cursor: string | undefined;
    // Page through the prefix (500 per page, hard cap 2000 — fair use).
    for (let page = 0; page < 4; page++) {
      const listed = await bucket.list({ prefix, limit: 500, cursor, include: ['customMetadata'] });
      for (const o of listed.objects) {
        const uploaded = new Date(o.uploaded);
        if (uploaded.getTime() < cutoff) continue; // outside the plan's retention window
        const meta = o.customMetadata ?? {};
        files.push({
          id: o.key.slice(prefix.length),
          output: (meta.output as OutputKind) || 'video',
          model: meta.model || 'unknown',
          note: meta.note || '',
          createdAt: uploaded.toISOString(),
          bytes: o.size,
          daysLeft: daysLeft(uploaded, access.tier),
        });
      }
      if (!listed.truncated || !listed.cursor) break;
      cursor = listed.cursor;
    }

    files.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return reply({ ok: true, files, retentionDays: window });
  } catch {
    return reply({ ok: false, error: 'Could not load your files. Try again.' }, 502);
  }
}
