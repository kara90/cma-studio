// Minimal Cloudflare bindings type. Regenerate the full version anytime with
// `npm run cf-typegen` (writes the complete CloudflareEnv from wrangler.jsonc).
// Kept hand-written + minimal so `tsc` passes without pulling @cloudflare/workers-types.

interface RateLimit {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

declare global {
  interface CloudflareEnv {
    // Native Workers rate-limit binding declared in wrangler.jsonc (12 renders / 60s).
    RENDER_LIMITER?: RateLimit;
  }
}

export {};
