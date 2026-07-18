/**
 * proxy.ts — Next 16 network proxy (the renamed `middleware`, nodejs runtime).
 *
 * TEMPORARY BETA WALL: every page and API route is gated behind a shared beta
 * password until public launch. A request passes only when it carries the beta
 * cookie set by /api/unlock; otherwise it is redirected to /unlock. The proxy
 * only compares the cookie to a constant token (lib/betaGate) — it reads no
 * secret, so it can never lock the site out over an env-read failure.
 *
 * The matcher excludes the unlock page + its API and all static assets, so the
 * unlock screen (and its CSS/JS/logo) always loads even while gated.
 *
 * ⚠ SEAM: delete proxy.ts (or clear the matcher) at public launch to lift the
 * wall. This does not touch auth, payments, or any existing logic.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { BETA_COOKIE, BETA_TOKEN } from '@/lib/betaGate';

export function proxy(request: NextRequest) {
  const token = request.cookies.get(BETA_COOKIE)?.value;
  if (token === BETA_TOKEN) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const unlockUrl = new URL('/unlock', request.url);
  const target = `${pathname}${search}`;
  if (target && target !== '/') unlockUrl.searchParams.set('next', target);
  // 307 keeps it obviously temporary; the /unlock path is excluded below so
  // there is no redirect loop.
  return NextResponse.redirect(unlockUrl, 307);
}

export const config = {
  // Gate everything EXCEPT the unlock screen, its API, and static assets.
  matcher: [
    '/((?!_next/static|_next/image|unlock|api/unlock|favicon\\.ico|icon\\.png|apple-icon\\.png|manifest\\.webmanifest|sw\\.js|og-recipe\\.png|robots\\.txt|sitemap\\.xml|clips/|icons/|screens/).*)',
  ],
};
