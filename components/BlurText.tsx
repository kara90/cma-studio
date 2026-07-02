'use client';

/**
 * BlurText — words un-blur and rise into place, staggered. Inspired by the
 * "next-level" skin's blur-in hero reveal. Respects prefers-reduced-motion.
 */
import { motion, useReducedMotion } from 'framer-motion';

export function BlurText({
  text,
  className,
  delay = 0,
  stagger = 0.09,
  block = false,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  /** blur the whole line in as one block (keeps a gradient continuous) */
  block?: boolean;
}) {
  const reduce = useReducedMotion();

  if (block) {
    return (
      <motion.span
        className={className}
        initial={reduce ? false : { opacity: 0, filter: 'blur(12px)', y: 18 }}
        whileInView={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
        viewport={{ once: true, margin: '0px 0px -8% 0px' }}
        transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {text}
      </motion.span>
    );
  }

  const words = text.split(' ');
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          className="inline-block"
          initial={reduce ? false : { opacity: 0, filter: 'blur(12px)', y: 18 }}
          whileInView={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          viewport={{ once: true, margin: '0px 0px -8% 0px' }}
          transition={{ duration: 0.7, delay: delay + i * stagger, ease: [0.16, 1, 0.3, 1] }}
        >
          {word}
          {i < words.length - 1 ? ' ' : ''}
        </motion.span>
      ))}
    </span>
  );
}
