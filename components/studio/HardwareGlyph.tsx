/**
 * HardwareGlyph — small, on-brand SVG illustrations of cine lenses and camera
 * bodies for the drum selectors. Copyright-safe (original vector art, no brand
 * product photos). Each option can later swap to a real photo by setting its
 * `image` path — see StudioConsole thumb rendering.
 */

export type LensVariant = 'anamorphic' | 'spherical' | 'vintage';
export type CameraVariant = 's35' | 'largeformat' | 'digital8k' | 'celluloid';

export function LensGlyph({ variant }: { variant: LensVariant }) {
  const barrel = variant === 'vintage' ? '#5b5f68' : '#191c22';
  const barrel2 = variant === 'vintage' ? '#3d4048' : '#0f1218';
  const ring = variant === 'vintage' ? '#8a8f98' : '#2a2f3a';
  const element = variant === 'vintage' ? '#e6d5ad' : '#22303f';
  const elementHi = variant === 'vintage' ? '#fff6df' : '#4a6b86';
  return (
    <svg viewBox="0 0 100 60" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      {/* barrel */}
      <rect x="30" y="9" width="64" height="42" rx="7" fill={barrel} />
      <rect x="30" y="9" width="64" height="42" rx="7" fill="url(#lg-shade)" />
      {/* focus/iris gear rings */}
      {[52, 62, 72, 82].map((x) => (
        <rect key={x} x={x} y="9" width="2" height="42" fill={ring} opacity="0.7" />
      ))}
      {/* front element */}
      <ellipse cx="26" cy="30" rx="18" ry="22" fill={barrel2} />
      <ellipse cx="26" cy="30" rx="13" ry="17" fill={element} />
      <ellipse cx="26" cy="30" rx="13" ry="17" fill="url(#lg-elem)" />
      {/* highlight */}
      <ellipse cx="21" cy="23" rx="4" ry="6" fill={elementHi} opacity="0.55" />
      {/* anamorphic blue streak */}
      {variant === 'anamorphic' && (
        <>
          <rect x="4" y="28.5" width="44" height="3" rx="1.5" fill="#3aa0ff" opacity="0.9" />
          <rect x="10" y="29.4" width="34" height="1.2" fill="#bfe0ff" />
        </>
      )}
      <defs>
        <linearGradient id="lg-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="0.5" stopColor="#000000" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.35" />
        </linearGradient>
        <radialGradient id="lg-elem" cx="0.38" cy="0.34" r="0.8">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="0.55" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export function CameraGlyph({ variant }: { variant: CameraVariant }) {
  const body = variant === 'celluloid' ? '#5a5048' : '#1a1d24';
  const accent =
    variant === 'digital8k' ? '#e0533b' : variant === 'largeformat' ? '#4a6b86' : variant === 'celluloid' ? '#bfa06a' : '#bc9863';
  return (
    <svg viewBox="0 0 100 60" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      {/* top handle */}
      <rect x="30" y="8" width="34" height="5" rx="2.5" fill="#2a2f3a" />
      {/* body */}
      <rect x="26" y="13" width="52" height="34" rx="6" fill={body} />
      <rect x="26" y="13" width="52" height="34" rx="6" fill="url(#cg-shade)" />
      {/* lens mount */}
      <circle cx="20" cy="32" r="13" fill="#0f1218" />
      <circle cx="20" cy="32" r="9" fill="#22262e" />
      <circle cx="20" cy="32" r="4.5" fill="#0a0c10" />
      {/* record dot / brand accent */}
      <circle cx="68" cy="22" r="3" fill={accent} />
      {/* viewfinder */}
      <rect x="60" y="30" width="16" height="10" rx="2" fill="#0f1218" />
      <defs>
        <linearGradient id="cg-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.4" />
        </linearGradient>
      </defs>
    </svg>
  );
}
