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

// The presentation reel and every showcase clip are SELF-HOSTED under /clips,
// so no third-party video player CDN is in the CSP at all. Media plays from our
// own origin (media-src 'self') and from fal for finished renders.

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
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} ${turnstile}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data: blob: https://fal.media https://*.fal.media",
  "media-src 'self' blob: https://fal.media https://*.fal.media https://*.fal.run",
  `frame-src 'self' ${turnstile}`,
  // fal.media MUST be in connect-src too: the Download button fetch()es the finished
  // render into a blob to save it with a real filename. Without this the fetch is
  // CSP-blocked and downloads silently degrade to "open in a new tab" (no save).
  // *.fal.ai + storage.googleapis.com: start/end-frame uploads go DIRECTLY from the
  // browser to fal storage on the user's own key (rest.alpha.fal.ai initiate + a
  // presigned PUT) — BYOK-pure, never through our server.
  `connect-src 'self' ${supabaseOrigin} ${supabaseWs} https://fal.media https://*.fal.media https://*.fal.run https://*.fal.ai https://storage.googleapis.com ${turnstile}`.trim().replace(/\s+/g, ' '),
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

// The FOUR legal pages (and only those) allow SAME-ORIGIN framing: the checkout
// consent gate (components/pricing/EnrollmentGate.tsx) renders them in
// same-origin iframes for the scroll-through proof, and `frame-ancestors 'none'`
// / X-Frame-Options DENY block even same-origin framing — which made the gate
// (and therefore every purchase) impossible to complete. 'self' still blocks
// every third-party site from framing these pages. Everything else keeps DENY.
const LEGAL_FRAME_ROUTES = ['/terms', '/privacy', '/refunds', '/acceptable-use'];
const legalCsp = csp.replace("frame-ancestors 'none'", "frame-ancestors 'self'");
const legalSecurityHeaders = securityHeaders.map((h) =>
  h.key === 'Content-Security-Policy' ? { key: h.key, value: legalCsp }
    : h.key === 'X-Frame-Options' ? { key: h.key, value: 'SAMEORIGIN' }
      : h,
);

const nextConfig = {
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // Later matches override same-named headers from the global rule above.
      ...LEGAL_FRAME_ROUTES.map((source) => ({ source, headers: legalSecurityHeaders })),
    ];
  },
};

export default nextConfig;
