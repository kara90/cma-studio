'use client';

/**
 * Logo — CMA Studio mark. Uses the real brand logo, background-keyed to a
 * TRANSPARENT PNG at /public/logo.png (built from logo.jpg with sharp) so there
 * is no black square around it. Falls back to an original gold aperture/vortex
 * SVG only if the file actually errors (no broken image, no flicker).
 */
import { useState } from 'react';

export function Logo({ size = 26, className }: { size?: number; className?: string }) {
  // Show the real (transparent) logo by default; only fall back to the SVG if
  // it actually errors (avoids the cached-image onLoad race that showed the SVG).
  const [failed, setFailed] = useState(false);
  return (
    <span className={`relative inline-block ${className ?? ''}`} style={{ width: size, height: size }}>
      {failed ? (
        <ApertureMark size={size} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/logo.png"
          alt="CMA Studio"
          width={size}
          height={size}
          onError={() => setFailed(true)}
          style={{ width: size, height: size, objectFit: 'contain' }}
        />
      )}
    </span>
  );
}

function ApertureMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" role="img" aria-label="CMA Studio">
      <defs>
        <linearGradient id="cma-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e7cfa3" />
          <stop offset="0.5" stopColor="#bc9863" />
          <stop offset="1" stopColor="#8a6c40" />
        </linearGradient>
      </defs>
      {/* swirling vortex blades */}
      <path d="M50 5 A45 45 0 0 1 95 50" stroke="url(#cma-gold)" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 95 A45 45 0 0 1 5 50" stroke="url(#cma-gold)" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 16 A34 34 0 0 1 84 50" stroke="url(#cma-gold)" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
      <path d="M50 84 A34 34 0 0 1 16 50" stroke="url(#cma-gold)" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
      <path d="M50 27 A23 23 0 0 1 73 50" stroke="url(#cma-gold)" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      <path d="M50 73 A23 23 0 0 1 27 50" stroke="url(#cma-gold)" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      {/* inner ring + play */}
      <circle cx="50" cy="50" r="15" stroke="url(#cma-gold)" strokeWidth="2.5" />
      <path d="M45 42 L61 50 L45 58 Z" fill="url(#cma-gold)" />
    </svg>
  );
}
