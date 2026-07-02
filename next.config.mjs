/** @type {import('next').NextConfig} */
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

// Lets `next dev` see the Cloudflare bindings (e.g. the RENDER_LIMITER rate-limit
// binding) locally. No-op in production builds; OpenNext supplies bindings there.
initOpenNextCloudflareForDev();

const isDev = process.env.NODE_ENV !== 'production';

// Restrict where the browser may talk to. This is the real mitigation for the
// BYOK key sitting in localStorage: even if a script were injected, a strict
// connect-src / img-src stops it from POSTing the key to an attacker origin.
const supabaseOrigin = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : '';
  } catch {
    return '';
  }
})();
const supabaseWs = supabaseOrigin ? supabaseOrigin.replace('https://', 'wss://') : '';

// Wistia showcase player (embedded, self-hosts nothing). Scoped to Wistia's own
// CDNs so the golden-framed hero reel loads without loosening anything else.
//
// DEV-ONLY http allowance: the local preview is served over http://localhost, and
// Wistia's player.js injects publicApi.js via a protocol-relative URL that resolves
// to http:// on an http page. Our https-only script-src would block it (scheme
// mismatch), which permanently stalls the player at a blurred swatch. We allow the
// http Wistia origins in dev ONLY — in production the page is https, that URL
// resolves to https, and none of these http entries are ever emitted.
const wistiaHttp = isDev
  ? ' http://fast.wistia.com http://*.wistia.com http://*.wistia.net http://embedwistia-a.akamaihd.net'
  : '';
const wistiaScript = 'https://fast.wistia.com https://*.wistia.com' + wistiaHttp;
const wistiaImg = 'https://*.wistia.com https://*.wistia.net https://embedwistia-a.akamaihd.net' + wistiaHttp;
const wistiaMedia = 'https://*.wistia.com https://*.wistia.net https://embedwistia-a.akamaihd.net' + wistiaHttp;
const wistiaConnect = 'https://*.wistia.com https://*.wistia.net https://*.wistia.io' + wistiaHttp;
const wistiaFrame = 'https://fast.wistia.net https://*.wistia.com';
const wistiaFont = 'https://*.wistia.com https://embedwistia-a.akamaihd.net';

// Cloudflare Turnstile (bot protection on login/signup). The widget loads api.js
// (script-src), renders a challenge iframe (frame-src), and calls home (connect-src).
const turnstile = 'https://challenges.cloudflare.com';

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  // NOTE: 'unsafe-inline' on script-src is required for Next's hydration
  // bootstrap without a nonce. The real key-exfiltration control is the tight
  // connect-src/img-src below, not script-src. (next/font self-hosts fonts, so
  // no Google Fonts origins are needed.)
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} ${wistiaScript} ${turnstile}`,
  "style-src 'self' 'unsafe-inline'",
  `font-src 'self' ${wistiaFont}`,
  `img-src 'self' data: blob: https://fal.media https://*.fal.media ${wistiaImg}`,
  `media-src 'self' blob: https://fal.media https://*.fal.media https://*.fal.run ${wistiaMedia}`,
  `frame-src 'self' ${wistiaFrame} ${turnstile}`,
  // fal.media MUST be in connect-src too: the Download button fetch()es the finished
  // render into a blob to save it with a real filename. Without this the fetch is
  // CSP-blocked and downloads silently degrade to "open in a new tab" (no save).
  // *.fal.ai + storage.googleapis.com: start/end-frame uploads go DIRECTLY from the
  // browser to fal storage on the user's own key (rest.alpha.fal.ai initiate + a
  // presigned PUT) — BYOK-pure, never through our server.
  `connect-src 'self' ${supabaseOrigin} ${supabaseWs} https://fal.media https://*.fal.media https://*.fal.run https://*.fal.ai https://storage.googleapis.com ${wistiaConnect} ${turnstile}`.trim().replace(/\s+/g, ' '),
]
  .filter(Boolean)
  .join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
];

const nextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
