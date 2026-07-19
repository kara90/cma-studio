'use client';

/**
 * Faq — the comprehensive glass accordion for the landing page. Four
 * mono-labeled groups (Getting started / Costs / Rendering / Your work),
 * one item open at a time across the whole section, framer-motion height
 * animation, chevron rotation, aria-expanded on triggers. Respects
 * prefers-reduced-motion.
 *
 * Copy rules (see lib/plans.ts): retention is always "about N days" plus
 * fair use, never "forever" or "unlimited"; pricing covers today's toolset
 * and never promises a price will not change; no em dashes.
 */

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
// FAQ content lives in a plain (non-client) module so the server /faq page can
// import the same array for its FAQPage JSON-LD without a client-reference error.
import { GROUPS } from '@/components/marketing/faqData';

export function Faq() {
  // one open item across all groups, keyed "groupIndex-itemIndex"
  const [open, setOpen] = useState<string | null>('0-0');
  const reduce = useReducedMotion();

  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-6 px-6 py-20">
      <Reveal className="mb-12 text-center">
        <div className="mb-4 font-mono text-[11px] tracking-[0.26em] text-[#bc9863] uppercase">
          Straight answers
        </div>
        <h1 className="font-[family-name:var(--font-sora)] text-[clamp(1.9rem,4vw,3rem)] font-bold tracking-[-0.03em]">
          Asked, and <span className="text-[#bc9863]">answered.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[#8b8f99]">
          The fee, the key, the models, what can fail, and where your work lives. No fine print
          games.
        </p>
      </Reveal>

      <div className="flex flex-col gap-10">
        {GROUPS.map((group, gi) => (
          <div key={group.label}>
            <Reveal>
              <div className="mb-4 flex items-center gap-3">
                <span className="font-mono text-[11px] tracking-[0.24em] text-[#bc9863] uppercase">
                  {String(gi + 1).padStart(2, '0')} · {group.label}
                </span>
                <span className="h-px flex-1 bg-gradient-to-r from-[#bc9863]/25 to-transparent" />
              </div>
            </Reveal>

            <div className="flex flex-col gap-3">
              {group.items.map((f, ii) => {
                const key = `${gi}-${ii}`;
                const isOpen = open === key;
                return (
                  <Reveal key={f.q} delay={ii * 0.04}>
                    <div
                      className={`glass rounded-2xl transition ${
                        isOpen ? 'glass-gold' : 'hover:border-[#bc9863]/25'
                      }`}
                    >
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={`faq-panel-${key}`}
                        id={`faq-trigger-${key}`}
                        onClick={() => setOpen(isOpen ? null : key)}
                        className="flex min-h-[44px] w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
                      >
                        <span className="font-[family-name:var(--font-sora)] text-[15px] font-semibold tracking-[-0.01em] text-[#f4efe6]">
                          {f.q}
                        </span>
                        <motion.span
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: reduce ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] }}
                          className={`shrink-0 ${isOpen ? 'text-[#bc9863]' : 'text-[#8b909e]'}`}
                        >
                          <ChevronDown size={18} />
                        </motion.span>
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            id={`faq-panel-${key}`}
                            role="region"
                            aria-labelledby={`faq-trigger-${key}`}
                            initial={reduce ? false : { height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={reduce ? undefined : { height: 0, opacity: 0 }}
                            transition={{ duration: reduce ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                            <p className="px-5 pb-5 text-[0.93rem] leading-relaxed text-[#8b8f99] sm:px-6">
                              {f.a}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Reveal className="mt-10 text-center">
        <p className="font-mono text-[12px] tracking-[0.04em] text-[#8b909e]">
          Something we missed?{' '}
          <a
            href="mailto:hello@cinemasteracademy.com?subject=CMA%20Studio%20question"
            className="cursor-pointer text-[#bc9863] transition hover:text-[#e7cfa3]"
          >
            Ask us directly
          </a>
          . A human answers.
        </p>
      </Reveal>
    </section>
  );
}
