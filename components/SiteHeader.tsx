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

// Platform nav — the generators are first-class tools, the Studio is the
// advanced flagship, pricing lives on its own page.
const DEFAULT_LINKS: NavLink[] = [
  { href: '/video', label: 'Video' },
  { href: '/image', label: 'Image' },
  { href: '/audio', label: 'Audio' },
  { href: '/studio', label: 'Studio Pro' },
  { href: '/files', label: 'Library' },
  { href: '/pricing', label: 'Pricing' },
];

const DEFAULT_CTA: NavLink = { href: '/video', label: 'Start creating' };

export function SiteHeader({ links = DEFAULT_LINKS, cta = DEFAULT_CTA }: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const reduce = useReducedMotion();

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
              // Gold marks WHERE YOU ARE; Studio Pro carries flagship weight always.
              const active = isActive(link.href);
              const flagship = link.href === '/studio';
              return (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative cursor-pointer font-mono text-[13px] transition focus-visible:text-[#e7cfa3] ${
                    active
                      ? 'font-semibold text-[#e7cfa3]'
                      : flagship
                        ? 'font-semibold text-[#bc9863] hover:text-[#e7cfa3]'
                        : 'text-[#8b8f99] hover:text-[#e7cfa3]'
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

            <nav aria-label="Primary" className="flex flex-1 flex-col justify-center gap-1 px-7">
              {links.map((link, i) => {
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
                      className={`flex items-center justify-between border-b border-white/6 py-4 font-[family-name:var(--font-sora)] text-[24px] font-semibold tracking-[-0.02em] transition ${
                        active ? 'text-[#e7cfa3]' : flagship ? 'text-[#bc9863]' : 'text-[#f4efe6]'
                      }`}
                    >
                      {link.label}
                      {flagship && (
                        <span className="rounded-full border border-[#bc9863]/40 bg-[#bc9863]/10 px-2.5 py-1 font-mono text-[9px] tracking-[0.18em] text-[#bc9863] uppercase">
                          Flagship
                        </span>
                      )}
                      {active && !flagship && <span className="h-1.5 w-1.5 rounded-full bg-[#bc9863]" />}
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
