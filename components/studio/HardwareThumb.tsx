'use client';

/**
 * HardwareThumb — shows a real hardware PHOTO if one exists at the given path,
 * otherwise falls back to the original SVG glyph. Drop your own licensed photos
 * into /public/lenses or /public/cameras (see the README there) and they replace
 * the glyphs automatically — no code change.
 */
import { useState } from 'react';
import { LensGlyph, CameraGlyph, type LensVariant, type CameraVariant } from './HardwareGlyph';

export function LensThumb({ image, variant }: { image?: string; variant: LensVariant }) {
  const [failed, setFailed] = useState(false);
  if (image && !failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt="" className="h-full w-full object-contain p-0.5" onError={() => setFailed(true)} />;
  }
  return <LensGlyph variant={variant} />;
}

export function CameraThumb({ image, variant }: { image?: string; variant: CameraVariant }) {
  const [failed, setFailed] = useState(false);
  if (image && !failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt="" className="h-full w-full object-contain p-0.5" onError={() => setFailed(true)} />;
  }
  return <CameraGlyph variant={variant} />;
}
