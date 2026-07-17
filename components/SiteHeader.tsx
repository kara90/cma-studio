'use client';

/**
 * SiteHeader — scroll-aware site chrome shared by the landing, pricing and
 * legal pages. Floats transparent over the hero at the very top of the page,
 * then condenses into a frosted glass bar once the user scrolls past 16px.
 * Passive scroll listener with a requestAnimationFrame guard, no layout shift
 * beyond the padding ease.
 *
 * On phones the nav lives behind a hamburger: a full-screen frosted sheet with
 * staggered links, the CTA, and a "Get the app" install entry (dispatches the
 * cma:install event handled by PwaProvider).
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Menu, X, Smartphone } from 'lucide-react';
import { Logo } from '@/components/Logo';

type NavLink = { href: string; label: string };

export interface SiteHeaderProps {
  links?: NavLink[];
  cta?: NavLink;
}

/** The CMA studio family. Director is LIVE; Marketing and Real Estate are
 * inert previews this pass (navigable, cannot render or take payment). */
const STUDIO_FAMILY = [
  { href: '/studio', label: 'CMA Director Studio', sub: 'Cinematic films', tag: 'Flagship' },
  { href: '/marketing', label: 'CMA Marketing Studio', sub: 'Product ads that convert', tag: 'Preview' },
  { href: '/real-estate', label: 'CMA Real Estate Studio', sub: 'Listing films that sell', tag: 'Preview' },
] as const;

/** Sentinel href — rendered as the Studios dropdown (desktop) / group (mobile). */
const STUDIOS_SENTINEL = '__studios__';

// Platform nav — the generators are first-class tools, the studio family is the
// advanced flagship group, pricing lives on its own page.
const DEFAULT_LINKS: NavLink[] = [
  { href: '/video', label: 'Video' },
  { href: '/image', label: 'Image' },
  { href: '/audio', label: 'Audio' },
  { href: STUDIOS_SENTINEL, label: 'Studios' },
  { href: '/files', label: 'Library' },
  { href: '/pricing', label: 'Pricing' },
];

const DEFAULT_CTA: NavLink = { href: '/video', label: 'Start creating' };

export function SiteHeader({ links = DEFAULT_LINKS, cta = DEFAULT_CTA }: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [studiosOpen, setStudiosOpen] = useState(false);
  const pathname = usePathname();
  const reduce = useReducedMotion();

  // Close the studios dropdown whenever navigation happens.
  useEffect(() => {
    setStudiosOpen(false);
  }, [pathname]);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      setScrolled(window.scrollY > 16);
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };
    // Sync immediately so a page restored mid-scroll renders the condensed bar.
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Freeze the page behind the open sheet; always restore on close/unmount.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const isActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));

  return (
    <>
    <header
      className={`sticky top-0 z-40 transition-[background,box-shadow,border,padding] duration-300 ${
        scrolled
          ? 'border-b border-[#bc9863]/18 bg-[#07080b]/78 shadow-[0_16px_44px_-30px_rgba(0,0,0,0.95)] backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent shadow-none'
      }`}
    >
      <div
        className={`mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 transition-[padding] duration-300 sm:px-6 ${
          scrolled ? 'py-3' : 'py-4 sm:py-5'
        }`}
      >
        <Link href="/" aria-label="CMA Studio home" className="flex min-w-0 cursor-pointer items-center gap-2.5 sm:gap-3">
          <Logo size={36} />
          <span className="font-[family-name:var(--font-sora)] text-[16px] font-semibold whitespace-nowrap tracking-[-0.01em] text-[#f4efe6] sm:text-[17px]">
            CMA Studio
          </span>
          <span className="hidden rounded-full border border-[#bc9863]/30 bg-[#bc9863]/8 px-2 py-0.5 font-mono text-[8px] tracking-[0.16em] text-[#bc9863] uppercase min-[380px]:inline-block">
            beta
          </span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-5">
          <nav aria-label="Primary" className="hidden items-center gap-5 md:flex">
            {links.map((link) => {
              // Gold marks WHERE YOU ARE; the studio family carries flagship weight always.
              if (link.href === STUDIOS_SENTINEL) {
                const studioActive = STUDIO_FAMILY.some((s) => isActive(s.href));
                return (
                  <div
                    key={STUDIOS_SENTINEL}
                    className="relative"
                    onMouseEnter={() => setStudiosOpen(true)}
                    onMouseLeave={() => setStudiosOpen(false)}
                  >
                    <button
                      type="button"
                      aria-expanded={studiosOpen}
                      aria-haspopup="menu"
                      onClick={() => setStudiosOpen((o) => !o)}
                      className={`relative inline-flex cursor-pointer items-center gap-1 font-mono text-[13px] font-semibold transition focus-visible:text-[#e7cfa3] ${
                        studioActive ? 'text-[#e7cfa3]' : 'text-[#bc9863] hover:text-[#e7cfa3]'
                      }`}
                    >
                      {link.label}
                      <span className={`text-[9px] transition-transform ${studiosOpen ? 'rotate-180' : ''}`}>▾</span>
                      {studioActive && (
                        <span className="absolute inset-x-0 -bottom-1.5 h-px bg-gradient-to-r from-transparent via-[#bc9863] to-transparent" />
                      )}
                    </button>
                    {studiosOpen && (
                      <div
                        role="menu"
                        className="absolute left-1/2 top-full z-50 w-72 -translate-x-1/2 pt-3"
                      >
                        <div className="overflow-hidden rounded-2xl border border-[#bc9863]/20 bg-[#07080b]/96 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl">
                          {STUDIO_FAMILY.map((s) => (
                            <Link
                              key={s.href}
                              href={s.href}
                              role="menuitem"
                              aria-current={isActive(s.href) ? 'page' : undefined}
                              className={`flex cursor-pointer items-center justify-between gap-3 border-b border-white/5 px-4 py-3.5 transition last:border-b-0 hover:bg-[#bc9863]/8 ${
                                isActive(s.href) ? 'bg-[#bc9863]/6' : ''
                              }`}
                            >
                              <span className="min-w-0">
                                <span className={`block truncate text-[13.5px] font-semibold ${isActive(s.href) ? 'text-[#e7cfa3]' : 'text-[#f4efe6]'}`}>
                                  {s.label}
                                </span>
                                <span className="block font-mono text-[10px] tracking-[0.06em] text-[#8b909e]">{s.sub}</span>
                              </span>
                              <span
                                className={`flex-none rounded-full border px-2 py-0.5 font-mono text-[8px] tracking-[0.16em] uppercase ${
                                  s.tag === 'Flagship'
                                    ? 'border-[#bc9863]/40 bg-[#bc9863]/10 text-[#bc9863]'
                                    : 'border-white/12 text-[#8b909e]'
                                }`}
                              >
                                {s.tag}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
              const active = isActive(link.href);
              return (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative cursor-pointer font-mono text-[13px] transition focus-visible:text-[#e7cfa3] ${
                    active ? 'font-semibold text-[#e7cfa3]' : 'text-[#8b8f99] hover:text-[#e7cfa3]'
                  }`}
                >
                  {link.label}
                  {active && <span className="absolute inset-x-0 -bottom-1.5 h-px bg-gradient-to-r from-transparent via-[#bc9863] to-transparent" />}
                </Link>
              );
            })}
          </nav>
          <Link
            href={cta.href}
            className="hidden min-h-[40px] cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-4 py-2.5 text-[13.5px] font-semibold whitespace-nowrap text-black shadow-[0_6px_22px_rgba(188,152,99,0.28)] transition hover:brightness-105 sm:inline-flex"
          >
            {cta.label} <ArrowRight size={15} />
          </Link>

          {/* phone: everything lives behind the hamburger */}
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-black/40 text-[#e7cfa3] transition hover:border-[#bc9863]/50 md:hidden"
          >
            <Menu size={19} />
          </button>
        </div>
      </div>

    </header>

    {/* ── Mobile menu — full-screen sheet. MUST live OUTSIDE the <header>:
        its backdrop-filter creates a containing block that would trap this
        fixed overlay and let the page bleed through. Solid ground, no bleed. ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[80] flex flex-col bg-[#05060a] md:hidden"
          >
            <div className="flex items-center justify-between px-5 py-4">
              <Link href="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5">
                <Logo size={36} />
                <span className="font-[family-name:var(--font-sora)] text-[16px] font-semibold text-[#f4efe6]">
                  CMA Studio
                </span>
              </Link>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-black/40 text-[#e7cfa3]"
              >
                <X size={19} />
              </button>
            </div>

            <nav aria-label="Primary" className="flex flex-1 flex-col justify-center gap-1 overflow-y-auto px-7">
              {links
                .flatMap((link) =>
                  link.href === STUDIOS_SENTINEL
                    ? STUDIO_FAMILY.map((s) => ({ href: s.href, label: s.label, tag: s.tag }))
                    : [{ ...link, tag: undefined as string | undefined }],
                )
                .map((link, i) => {
                  const active = isActive(link.href);
                  const flagship = link.href === '/studio';
                  return (
                    <motion.div
                      key={link.href}
                      initial={reduce ? false : { opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: reduce ? 0 : 0.05 + i * 0.045, duration: 0.28 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setMenuOpen(false)}
                        aria-current={active ? 'page' : undefined}
                        className={`flex items-center justify-between border-b border-white/6 py-4 font-[family-name:var(--font-sora)] font-semibold tracking-[-0.02em] transition ${
                          link.tag ? 'text-[19px]' : 'text-[24px]'
                        } ${active ? 'text-[#e7cfa3]' : flagship ? 'text-[#bc9863]' : 'text-[#f4efe6]'}`}
                      >
                        {link.label}
                        {link.tag && (
                          <span
                            className={`rounded-full border px-2.5 py-1 font-mono text-[9px] tracking-[0.18em] uppercase ${
                              link.tag === 'Flagship'
                                ? 'border-[#bc9863]/40 bg-[#bc9863]/10 text-[#bc9863]'
                                : 'border-white/12 text-[#8b909e]'
                            }`}
                          >
                            {link.tag}
                          </span>
                        )}
                        {active && !link.tag && <span className="h-1.5 w-1.5 rounded-full bg-[#bc9863]" />}
                      </Link>
                    </motion.div>
                  );
                })}
            </nav>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : 0.32, duration: 0.28 }}
              className="flex flex-col gap-3 px-7 pb-10"
            >
              <Link
                href={cta.href}
                onClick={() => setMenuOpen(false)}
                className="inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] py-3.5 text-[15px] font-semibold text-black"
              >
                {cta.label} <ArrowRight size={16} />
              </Link>
              <Link
                href="/app"
                onClick={() => setMenuOpen(false)}
                className="inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#bc9863]/40 py-3.5 text-[15px] font-semibold text-[#e7cfa3] transition hover:bg-[#bc9863]/10"
              >
                <Smartphone size={16} /> Get the app
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
