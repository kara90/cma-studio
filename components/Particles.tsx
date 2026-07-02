'use client';

/**
 * Particles — a sparse field of drifting gold motes (canvas). Inspired by the
 * "next-level" skin's particle hero, recast in the CMA champagne-gold identity.
 * Sits behind hero content; respects prefers-reduced-motion.
 */
import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

export function Particles({ className, count = 46 }: { className?: string; count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    const parent = canvas?.parentElement;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !parent || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let raf = 0;

    const resize = () => {
      const r = parent.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const parts = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.8 + 0.5,
      vy: -(Math.random() * 0.28 + 0.05),
      vx: (Math.random() - 0.5) * 0.16,
      a: Math.random() * 0.55 + 0.28,
    }));

    const draw = (animate: boolean) => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        if (animate) {
          p.y += p.vy;
          p.x += p.vx;
          if (p.y < -4) { p.y = h + 4; p.x = Math.random() * w; }
          if (p.x < -4) p.x = w + 4;
          if (p.x > w + 4) p.x = -4;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(188,152,99,${p.a})`;
        ctx.fill();
      }
      if (animate) raf = requestAnimationFrame(() => draw(true));
    };

    draw(!reduce);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [count, reduce]);

  return <canvas ref={ref} className={className} aria-hidden />;
}
