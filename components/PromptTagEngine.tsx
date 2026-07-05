'use client';

/**
 * PromptTagEngine — live, color-tagged prompt compiler view.
 *   Green  → Camera body      Cyan → Lens/glass
 *   Purple → Aperture/optics   Yellow → Texture data (grain / ISO gain)
 *
 * IMPORTANT: this renders a user-facing PREVIEW built from the redacted
 * manifest, not the server's proprietary injection strings. The authoritative
 * prompt is compiled in app/api/generate and is never sent to the browser.
 */
import { memo } from 'react';
import type { GenreStyle } from '@/lib/vcpManifest';

export interface TagState {
  prompt: string;
  cameraLabel: string;
  lensLabel: string;
  focalLength: number;
  aperture: number;
  /** focal handed to the DP engine — show "Auto" instead of a fixed mm */
  focalAuto?: boolean;
  /** aperture handed to the DP engine — show "Auto" instead of a fixed T-stop */
  apertureAuto?: boolean;
  isoValue: number;
  cineNoise: number;
  shutterAngle: number;
  genre: GenreStyle;
  /** visual-style label, e.g. "Cinematic" */
  styleLabel: string;
  isCelluloid: boolean;
}

interface Tag {
  kind: string;
  text: string;
  color: string;
}

function buildTags(s: TagState): Tag[] {
  // Cinema colour science, not IDE syntax: one champagne-gold family
  // differentiated by luminance, with a single restrained cool accent (the
  // brand blue, softened) for the glass — echoing an anamorphic flare.
  const goldBright = '#e7cfa3';
  const goldMid = '#cfa96b';
  const goldBase = '#bc9863';
  const cool = '#5b9bd6';
  const neutral = '#8b8f99';

  const texture = s.isCelluloid
    ? `Chemical grain ${s.cineNoise}%`
    : s.isoValue >= 3200
      ? `ISO ${s.isoValue} shadow gain`
      : `ISO ${s.isoValue} clean`;

  const focalTxt = s.focalAuto ? 'Auto' : `${s.focalLength}mm`;
  const apertureTxt = s.apertureAuto ? 'Auto' : `T${s.aperture.toFixed(1)}`;

  return [
    { kind: 'CAMERA', text: s.cameraLabel, color: goldBright },
    { kind: 'LENS', text: s.lensLabel, color: cool },
    { kind: 'OPTICS', text: `${focalTxt} · ${apertureTxt}`, color: goldBase },
    { kind: 'TEXTURE', text: texture, color: goldMid },
    { kind: 'SHUTTER', text: `${s.shutterAngle}°`, color: neutral },
    { kind: 'STYLE', text: s.styleLabel, color: goldBright },
    { kind: 'GENRE', text: s.genre, color: '#bc9863' },
  ];
}

function PromptTagEngineImpl(props: TagState) {
  const tags = buildTags(props);

  return (
    <div className="glass glass-gold rounded-2xl p-4">
      <div className="mb-3.5 flex items-center justify-between border-b border-[#bc9863]/12 pb-2">
        <span className="font-[family-name:var(--font-sora)] text-[13px] font-semibold tracking-[0.01em] text-[#e7cfa3]">
          Prompt Compiler
        </span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.16em] uppercase text-[#8b909e]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#37ca37]" /> live
        </span>
      </div>

      {/* color tabs */}
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <span
            key={t.kind}
            className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[10.5px]"
            style={{
              color: t.color,
              borderColor: `${t.color}44`,
              background: `${t.color}12`,
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: t.color }} />
            <span className="text-[#8b8f99]">{t.kind}</span>
            <span style={{ color: t.color }}>{t.text}</span>
          </span>
        ))}
      </div>

      {/* preview line */}
      <div className="mt-3 rounded-lg border border-white/5 bg-black/50 p-3">
        <p className="font-mono text-[11px] leading-relaxed text-[#c7c2b8]">
          <span className="text-[#e7cfa3]">{props.prompt || 'Your scene…'}</span>
          <span className="text-[#8b909e]">
            {' '}
            — shot on the {props.cameraLabel} through the {props.lensLabel},{' '}
            {props.focalAuto ? 'auto focal length' : `${props.focalLength}mm`} at{' '}
            {props.apertureAuto ? 'an auto aperture' : `T${props.aperture.toFixed(1)}`}. The lens, lighting and grain
            recipe are assembled server-side at render.
          </span>
        </p>
      </div>
    </div>
  );
}

export const PromptTagEngine = memo(PromptTagEngineImpl);
