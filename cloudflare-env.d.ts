// Minimal Cloudflare bindings type. Regenerate the full version anytime with
// `npm run cf-typegen` (writes the complete CloudflareEnv from wrangler.jsonc).
// Kept hand-written + minimal so `tsc` passes without pulling @cloudflare/workers-types.

interface RateLimit {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

/** Minimal R2 surface used by the storage routes (hand-rolled to avoid the
 * full @cloudflare/workers-types dependency). */
interface R2ListedObject {
  key: string;
  size: number;
  uploaded: Date;
  customMetadata?: Record<string, string>;
}
interface R2ObjectBody extends R2ListedObject {
  body: ReadableStream;
  httpMetadata?: { contentType?: string };
}
interface R2Bucket {
  put(
    key: string,
    value: ReadableStream | ArrayBuffer | string,
    options?: { httpMetadata?: { contentType?: string }; customMetadata?: Record<string, string> },
  ): Promise<unknown>;
  get(key: string): Promise<R2ObjectBody | null>;
  head(key: string): Promise<R2ListedObject | null>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number; cursor?: string; include?: string[] }): Promise<{
    objects: R2ListedObject[];
    truncated: boolean;
    cursor?: string;
  }>;
}

declare global {
  interface CloudflareEnv {
    // Native Workers rate-limit binding declared in wrangler.jsonc (12 renders / 60s).
    RENDER_LIMITER?: RateLimit;
    // R2 render storage (bucket `cma-renders`) — plan-retention file library.
    RENDERS?: R2Bucket;
  }
}

export {};
