import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// Minimal OpenNext config: the app has no ISR / revalidated pages, so no R2
// incremental cache is needed. Add an incrementalCache override later only if we
// introduce revalidated routes.
export default defineCloudflareConfig({});
