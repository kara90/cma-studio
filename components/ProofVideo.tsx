'use client';

/**
 * ProofVideo — lazy, poster-first delivery for the homepage proof clips
 * (the "Same model. Different director." side-by-side, the single highest-value
 * proof on the site). Renders only the media box; the page keeps the
 * <figure>/<figcaption> around it.
 *
 * Delivery goals (FIX 7):
 *   • LAZY — the <video> element (and its bytes) only mount once the tile nears
 *     the viewport (IntersectionObserver, 200px margin). Zero cost until then.
 *   • POSTER FIRST — a pure-CSS gradient (or image) paints instantly and sits
 *     behind the video, so the slot is never blank while it loads.
 *   • SHORT MUTED LOOP — autoplays muted + looping inline, the only autoplay
 *     every browser allows without a gesture. `muted` is forced on the property
 *     (React doesn't reliably reflect it), same discipline as PresentationReel.
 *   • OFFSCREEN PAUSE — playback pauses when scrolled out of view to spare the
 *     visitor's battery/data, and resumes when it returns.
 *   • REDUCED MOTION — honored: the poster stays, the video never autoplays.
 *
 * Source resolution (self-hosted first, Cloudflare Stream seam second) lives in
 * lib/proofMedia.ts (proofSrc); this component just plays the URL it's handed.
 */

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

export function ProofVideo({
  src,
  poster,
  className = '',
}: {
  /** Resolved, ready-to-play URL (self-hosted or Stream). Empty = nothing to play. */
  src: string;
  /** CSS gradient value OR an image URL. Gradients paint via the wrapper background. */
  poster?: string;
  /** Applied to the wrapper box (sizing/shape, e.g. "aspect-video w-full"). */
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();
  const [near, setNear] = useState(false);
  const posterIsImage = poster ? /^(https?:|\/)/.test(poster) : false;

  // Lazy gate + offscreen pause. Mount the source only when the tile approaches
  // the viewport; pause when it leaves.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setNear(true);
          } else {
            const v = videoRef.current;
            if (v && !v.paused) v.pause();
          }
        }
      },
      { rootMargin: '200px 0px', threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Once mounted and in view, force muted playback (and resume on tab focus).
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !near || reduce || !src) return;
    v.muted = true;
    const play = () => {
      const p = v.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    };
    play();
    const onVisible = () => {
      if (!document.hidden && v.paused) play();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [near, reduce, src]);

  return (
    <div
      ref={wrapRef}
      className={`relative overflow-hidden ${className}`}
      style={!posterIsImage && poster ? { background: poster } : undefined}
    >
      {/* image poster layer (gradient posters use the wrapper background instead) */}
      {posterIsImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
      )}
      {near && src && !reduce && (
        <video
          ref={videoRef}
          src={src}
          poster={posterIsImage ? poster : undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}
