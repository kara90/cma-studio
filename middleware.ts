/**
 * middleware.ts — TEMPORARY beta access wall (EDGE runtime).
 *
 * Next 16 renamed middleware to `proxy`, but `proxy` runs in the nodejs runtime,
 * which OpenNext-on-Cloudflare does not support. The edge `middleware` form is
 * still supported by both Next 16 and OpenNext, so the beta wall lives here.
 *
 * Every page and API route is gated behind a shared beta code until public
 * launch. A request passes only when it carries the beta cookie set by
 * /api/unlock; otherwise it 307s to /unlock. This middleware compares the cookie
 * to a constant token (lib/betaGate) and reads NO secret, so it can never lock
 * the site out over an env-read failure. The matcher excludes /unlock, its API,
 * and all static assets so the gate screen (and its CSS/JS/logo) always loads.
 *
 * ⚠ SEAM: delete this file (or clear the matcher) at public launch to lift the
 * wall. It does not touch auth, payments, or any existing logic.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { BETA_COOKIE, BETA_TOKEN } from '@/lib/betaGate';

// Beta password wall on/off switch. false = site is PUBLIC (no access code);
// true = gated behind /unlock. Flip and redeploy to toggle. The www->apex
// redirect below always runs, wall on or off.
const WALL_ENABLED = true;

export function middleware(request: NextRequest) {
  // Canonical host: www.* -> apex (301), preserving path + query. cinemasterstudio.com
  // and www both point at this worker; www always redirects to the bare domain.
  const host = request.headers.get('host') ?? '';
  if (host.startsWith('www.')) {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    url.hostname = host.slice(4);
    url.port = '';
    return NextResponse.redirect(url, 301);
  }

  // Wall lifted: everything is public (the www redirect above still applies).
  if (!WALL_ENABLED) return NextResponse.next();

  const token = request.cookies.get(BETA_COOKIE)?.value;
  if (token === BETA_TOKEN) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const unlockUrl = new URL('/unlock', request.url);
  const target = `${pathname}${search}`;
  if (target && target !== '/') unlockUrl.searchParams.set('next', target);
  return NextResponse.redirect(unlockUrl, 307);
}

export const config = {
  // Gate everything EXCEPT the unlock screen, its API, and static assets.
  matcher: [
    '/((?!_next/static|_next/image|unlock|api/unlock|favicon\\.ico|icon\\.png|apple-icon\\.png|manifest\\.webmanifest|sw\\.js|og-recipe\\.png|og-cover\\.png|robots\\.txt|sitemap\\.xml|clips/|icons/|screens/).*)',
  ],
};
