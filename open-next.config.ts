import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// Minimal OpenNext config: the app has no ISR / revalidated pages, so no R2
// incremental cache is needed. Add an incrementalCache override later only if we
// introduce revalidated routes.
//
// buildCommand: Next 16 builds with TURBOPACK by default, but OpenNext cannot
// trace Turbopack's `[root-of-the-server]__*` SSR chunks — the deployed worker
// 500s on every route ("Not found server/chunks/ssr/..."), which took the live
// site down on 2026-07-02 until rollback. Deploy builds MUST use webpack.
// (`npm run build` / `next dev` keep Turbopack for local speed — only the
// OpenNext bundle needs webpack.) buildCommand is a TOP-LEVEL OpenNext option,
// not part of defineCloudflareConfig's overrides.
export default {
  ...defineCloudflareConfig({}),
  buildCommand: 'npx next build --webpack',
};
