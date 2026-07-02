'use client';

/**
 * SiteHeader — scroll-aware site chrome shared by the landing, pricing and
 * legal pages. Floats transparent over the hero at the very top of the page,
 * then condenses into a frosted glass bar once the user scrolls past 16px.
 * Passive scroll listener with a requestAnimationFrame guard, no layout shift
 * beyond the padding ease.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
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
  { href: '/studio', label: 'Studio' },
  { href: '/pricing', label: 'Pricing' },
];

const DEFAULT_CTA: NavLink = { href: '/video', label: 'Start creating' };

export function SiteHeader({ links = DEFAULT_LINKS, cta = DEFAULT_CTA }: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

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

  return (
    <header
      className={`sticky top-0 z-40 transition-[background,box-shadow,border,padding] duration-300 ${
        scrolled
          ? 'border-b border-[#bc9863]/18 bg-[#07080b]/78 shadow-[0_16px_44px_-30px_rgba(0,0,0,0.95)] backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent shadow-none'
      }`}
    >
      <div
        className={`mx-auto flex max-w-6xl items-center justify-between px-6 transition-[padding] duration-300 ${
          scrolled ? 'py-3' : 'py-5'
        }`}
      >
        <Link href="/" aria-label="CMA Studio home" className="flex cursor-pointer items-center gap-3">
          <Logo size={40} />
          <span className="font-[family-name:var(--font-sora)] text-[17px] font-semibold tracking-[-0.01em] text-[#f4efe6]">
            CMA Studio
          </span>
          <span className="rounded-full border border-[#bc9863]/30 bg-[#bc9863]/8 px-2 py-0.5 font-mono text-[8px] tracking-[0.16em] text-[#bc9863] uppercase">
            beta
          </span>
        </Link>

        <div className="flex items-center gap-5">
          <nav aria-label="Primary" className="hidden items-center gap-5 sm:flex">
            {links.map((link) => (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                className="cursor-pointer font-mono text-[13px] text-[#8b8f99] transition hover:text-[#e7cfa3] focus-visible:text-[#e7cfa3]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Link
            href={cta.href}
            className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-4 py-2.5 text-[13.5px] font-semibold text-black shadow-[0_6px_22px_rgba(188,152,99,0.28)] transition hover:brightness-105"
          >
            {cta.label} <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </header>
  );
}
