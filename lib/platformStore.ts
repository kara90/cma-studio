/**
 * lib/platformStore.ts — server-only access to the CMA_PLATFORM KV namespace.
 *
 * Small platform records, all key-prefixed so they can never collide:
 *   nl/{source}/{ts}-{rand}  → launch-notify email captures
 *   gal/pending/{id}         → community-gallery submissions awaiting review
 *   gal/approved/{id}        → owner-approved gallery entries (public)
 *
 * Same FAIL-SOFT philosophy as engineUsage: if the binding is missing (plain
 * `next dev`) every helper degrades gracefully instead of throwing.
 */
import { getCloudflareContext } from '@opennextjs/cloudflare';

/** The KV binding's type, pulled from the global CloudflareEnv declaration. */
type PlatformKV = NonNullable<CloudflareEnv['CMA_PLATFORM']>;

export function platformKV(): PlatformKV | undefined {
  try {
    return getCloudflareContext().env.CMA_PLATFORM;
  } catch {
    return undefined; // plain `next dev` without bindings
  }
}

/** Collision-safe id: time-ordered prefix + random suffix. */
export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** One community-gallery entry (pending or approved). */
export interface GalleryEntry {
  id: string;
  /** creator's display name (shown publicly once approved) */
  name: string;
  /** short title/scene note */
  title: string;
  /** which CMA tool made it */
  tool: string;
  /** small self-contained data-URI thumbnail (client-generated, size-capped) */
  thumb: string;
  /** optional link to the full render (may expire — thumb is the durable part) */
  url?: string;
  submittedAt: string; // ISO
  approvedAt?: string; // ISO, set on approval
}

const GAL_PENDING = 'gal/pending/';
const GAL_APPROVED = 'gal/approved/';

export async function listGallery(kind: 'pending' | 'approved', limit = 60): Promise<GalleryEntry[]> {
  const kv = platformKV();
  if (!kv?.list) return [];
  const prefix = kind === 'pending' ? GAL_PENDING : GAL_APPROVED;
  try {
    const res = await kv.list({ prefix, limit });
    const entries = await Promise.all(
      res.keys.map(async (k) => {
        const raw = await kv.get(k.name);
        if (!raw) return null;
        try {
          return JSON.parse(raw) as GalleryEntry;
        } catch {
          return null;
        }
      }),
    );
    // newest first — ids are time-ordered
    return entries.filter((e): e is GalleryEntry => Boolean(e)).sort((a, b) => (a.id < b.id ? 1 : -1));
  } catch {
    return [];
  }
}

export async function putGalleryEntry(kind: 'pending' | 'approved', entry: GalleryEntry): Promise<boolean> {
  const kv = platformKV();
  if (!kv) return false;
  try {
    await kv.put(`${kind === 'pending' ? GAL_PENDING : GAL_APPROVED}${entry.id}`, JSON.stringify(entry));
    return true;
  } catch {
    return false;
  }
}

export async function getGalleryEntry(kind: 'pending' | 'approved', id: string): Promise<GalleryEntry | null> {
  const kv = platformKV();
  if (!kv) return null;
  try {
    const raw = await kv.get(`${kind === 'pending' ? GAL_PENDING : GAL_APPROVED}${id}`);
    return raw ? (JSON.parse(raw) as GalleryEntry) : null;
  } catch {
    return null;
  }
}

export async function deleteGalleryEntry(kind: 'pending' | 'approved', id: string): Promise<boolean> {
  const kv = platformKV();
  if (!kv?.delete) return false;
  try {
    await kv.delete(`${kind === 'pending' ? GAL_PENDING : GAL_APPROVED}${id}`);
    return true;
  } catch {
    return false;
  }
}
