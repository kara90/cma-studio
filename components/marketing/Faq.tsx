'use client';

/**
 * Faq — clean glass accordion for the landing page. One item open at a time,
 * framer-motion height animation, chevron rotation, aria-expanded on buttons.
 * Respects prefers-reduced-motion.
 */

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

const FAQS = [
  {
    q: 'Whose key does it run on?',
    a: "You render on your own fal.ai key at fal's own rate. We charge a flat software fee and never mark up compute.",
  },
  {
    q: 'Can a generation be blocked?',
    a: 'Yes. Every model enforces its own content rules and can decline a request. CMA Studio cannot override that, on purpose.',
  },
  {
    q: 'If a render is blocked or misses, is it refunded?',
    a: 'A blocked or imperfect generation may still consume compute on your fal account. That charge is between you and the model provider, so it is not something we can refund. Our job is tuning every prompt so misses stay rare.',
  },
  {
    q: 'What content is restricted?',
    a: 'Prohibited material and likenesses of real public figures are blocked by the models themselves. That is true on every serious platform.',
  },
  {
    q: 'Will every render match what I imagined?',
    a: 'AI occasionally misses even on look. The DP engine narrows the gap with real cinematography language, which is why it gets there in fewer tries.',
  },
  {
    q: 'How long are my renders kept?',
    a: 'fal removes its copies after about 7 days. Your plan keeps renders cached and indexed with retention by tier, about 30 days on Starter and longer on higher tiers, with a fair use cap. Download anything you want to keep offline.',
  },
] as const;

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const reduce = useReducedMotion();

  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-6 px-6 py-20">
      <Reveal className="mb-10 text-center">
        <div className="mb-4 font-mono text-[11px] tracking-[0.26em] text-[#bc9863] uppercase">
          Straight answers
        </div>
        <h2 className="font-[family-name:var(--font-sora)] text-[clamp(1.9rem,4vw,3rem)] font-bold tracking-[-0.03em]">
          Asked, and <span className="text-[#bc9863]">answered.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[#8b8f99]">
          How the fee works, what the models can refuse, and where your renders live. No fine print games.
        </p>
      </Reveal>

      <div className="flex flex-col gap-3">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <Reveal key={f.q} delay={i * 0.05}>
              <div
                className={`glass rounded-2xl transition ${
                  isOpen ? 'glass-gold' : 'hover:border-[#bc9863]/25'
                }`}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}
                  id={`faq-trigger-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
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
                      id={`faq-panel-${i}`}
                      role="region"
                      aria-labelledby={`faq-trigger-${i}`}
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
    </section>
  );
}
