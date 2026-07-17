'use client';

/**
 * MarketingConsole — CMA Marketing Studio control panel (INERT preview).
 *
 * Commercial-native controls only: no DP complexity, no lenses to choose (the
 * studio defaults to clean sharp glass), no film stock. A marketer thinks in
 * product, backdrop, action and platform — the panel speaks that language.
 *
 * INERT: no network calls anywhere in this tree. The render bar is disabled.
 * The dedicated product-ad skill plugs in later (lib/skills/marketingSkill).
 */
import { useState } from 'react';
import { StudioCard, Chips, Field, UploadTile, InertRenderBar } from '@/components/studios/InertStudioKit';

/* One-tap ad recipes — each pre-fills backdrop, action and camera below. */
const AD_PRESETS = [
  { id: 'hero-reveal', label: 'Hero reveal', backdrop: 'studio-black', action: 'hero-reveal', camera: 'push-in', light: 'cinematic' },
  { id: 'clean-spin', label: 'Clean 360 spin', backdrop: 'studio-white', action: 'spinning', camera: 'static', light: 'bright' },
  { id: 'splash', label: 'Liquid splash', backdrop: 'gradient', action: 'splash', camera: 'orbit', light: 'cinematic' },
  { id: 'lifestyle', label: 'On location', backdrop: 'beach', action: 'floating', camera: 'orbit', light: 'bright' },
  { id: 'macro', label: 'Macro detail', backdrop: 'marble', action: 'none', camera: 'macro', light: 'cinematic' },
  { id: 'unbox', label: 'Unboxing', backdrop: 'wood', action: 'unboxing', camera: 'push-in', light: 'bright' },
] as const;

type PresetId = (typeof AD_PRESETS)[number]['id'];

export function MarketingConsole() {
  const [preset, setPreset] = useState<PresetId | ''>('');
  const [description, setDescription] = useState('');
  const [position, setPosition] = useState('center');
  const [backdrop, setBackdrop] = useState('studio-white');
  const [motion, setMotion] = useState('slow-spin');
  const [action, setAction] = useState('hero-reveal');
  const [camera, setCamera] = useState('push-in');
  const [shotType, setShotType] = useState('camera');
  const [light, setLight] = useState('bright');
  const [platform, setPlatform] = useState('16:9');
  const [length, setLength] = useState('10');
  const [hook, setHook] = useState('');
  const [ctaText, setCtaText] = useState('');

  function applyPreset(id: PresetId) {
    const p = AD_PRESETS.find((x) => x.id === id)!;
    setPreset(id);
    setBackdrop(p.backdrop);
    setAction(p.action);
    setCamera(p.camera);
    setLight(p.light);
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[380px_1fr]">
      {/* ── the product — the user's own shot + one line of intent ── */}
      <section className="flex flex-col gap-5">
        <StudioCard
          title="Your product"
          sub="Every ad starts from your own product image. Describe what you want in one or two lines — the studio does the commercial thinking."
        >
          <UploadTile label="Product image" note="A clean shot of the product, any background. Cutout not required." />
          <div>
            <div className="mb-1.5 font-mono text-[9px] tracking-[0.18em] text-[#8b909e] uppercase">
              What do you want the ad to do?
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A 10 second hero reveal of the bottle on black, slow push-in, gold light, premium feel…"
              className="min-h-[96px] w-full resize-y rounded-xl border border-white/10 bg-black/40 p-3.5 text-[14px] leading-relaxed text-[#f4efe6] outline-none transition focus:border-[#bc9863] placeholder:text-[#8b909e]"
            />
          </div>
        </StudioCard>
        <StudioCard title="Ad recipes" sub="One tap sets the backdrop, action, camera and light to a proven commercial shape.">
          <div className="grid grid-cols-2 gap-1.5">
            {AD_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id)}
                aria-pressed={preset === p.id}
                className={`cursor-pointer rounded-lg border px-3 py-2.5 text-left font-mono text-[11px] transition ${
                  preset === p.id
                    ? 'border-[#bc9863] bg-[#bc9863]/12 text-[#e7cfa3]'
                    : 'border-white/8 text-[#8b8f99] hover:border-[#bc9863]/40'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </StudioCard>
      </section>

      {/* ── the commercial — plain-language controls ── */}
      <section className="flex flex-col gap-5">
        <StudioCard title="Stage & backdrop">
          <Chips
            label="Backdrop"
            options={[
              { id: 'studio-white', label: 'Studio white' },
              { id: 'studio-black', label: 'Studio black' },
              { id: 'gradient', label: 'Gradient glow' },
              { id: 'marble', label: 'Marble' },
              { id: 'wood', label: 'Warm wood' },
              { id: 'beach', label: 'Beach' },
              { id: 'urban', label: 'Urban street' },
              { id: 'nature', label: 'Nature' },
            ]}
            value={backdrop}
            onChange={(v) => { setBackdrop(v); setPreset(''); }}
          />
          <Chips
            label="Product position"
            options={[
              { id: 'center', label: 'Centered hero' },
              { id: 'thirds-left', label: 'Thirds · left' },
              { id: 'thirds-right', label: 'Thirds · right' },
              { id: 'pedestal', label: 'On a pedestal' },
            ]}
            value={position}
            onChange={setPosition}
          />
        </StudioCard>
        <StudioCard title="Motion & action">
          <Chips
            label="Object movement"
            options={[
              { id: 'none', label: 'Locked still' },
              { id: 'slow-spin', label: 'Slow 360 spin' },
              { id: 'float', label: 'Gentle float' },
              { id: 'tumble', label: 'Tumble reveal' },
            ]}
            value={motion}
            onChange={setMotion}
          />
          <Chips
            label="The action"
            options={[
              { id: 'hero-reveal', label: 'Hero reveal' },
              { id: 'floating', label: 'Floating' },
              { id: 'spinning', label: 'Spinning' },
              { id: 'splash', label: 'Liquid splash' },
              { id: 'unboxing', label: 'Unboxing' },
              { id: 'exploded', label: 'Exploded parts' },
              { id: 'none', label: 'None · product only' },
            ]}
            value={action}
            onChange={(v) => { setAction(v); setPreset(''); }}
          />
          <Chips
            label="Camera movement"
            options={[
              { id: 'static', label: 'Static' },
              { id: 'push-in', label: 'Slow push-in' },
              { id: 'orbit', label: 'Orbit' },
              { id: 'top-down', label: 'Top-down' },
              { id: 'macro', label: 'Macro glide' },
              { id: 'pull-back', label: 'Pull-back reveal' },
            ]}
            value={camera}
            onChange={(v) => { setCamera(v); setPreset(''); }}
          />
          <Chips
            label="Shot type"
            options={[
              { id: 'camera', label: 'Camera shot' },
              { id: 'drone', label: 'Drone shot' },
            ]}
            value={shotType}
            onChange={setShotType}
          />
        </StudioCard>
        <StudioCard title="Light & delivery">
          <Chips
            label="Lighting"
            options={[
              { id: 'bright', label: 'Bright & clean', hint: 'E-commerce clarity' },
              { id: 'cinematic', label: 'Cinematic', hint: 'Dramatic, premium contrast' },
            ]}
            value={light}
            onChange={(v) => { setLight(v); setPreset(''); }}
          />
          <p className="text-[11px] leading-relaxed text-[#8b909e]">
            Glass is handled for you: clean, sharp, modern lenses by default. No lens menu to learn.
          </p>
          <Chips
            label="Platform"
            options={[
              { id: '16:9', label: '16:9 · YouTube & web' },
              { id: '9:16', label: '9:16 · Reels & TikTok' },
              { id: '1:1', label: '1:1 · Feed' },
            ]}
            value={platform}
            onChange={setPlatform}
          />
          <Chips
            label="Clip length"
            options={[
              { id: '6', label: '6s' },
              { id: '10', label: '10s' },
              { id: '15', label: '15s' },
              { id: '30', label: '30s' },
            ]}
            value={length}
            onChange={setLength}
          />
          <Field label="Hook line · optional" value={hook} onChange={setHook} placeholder="Text that opens the ad" />
          <Field label="End-card CTA · optional" value={ctaText} onChange={setCtaText} placeholder="Shop now · yourbrand.com" />
        </StudioCard>
        <InertRenderBar studio="CMA Marketing Studio" />
      </section>
    </div>
  );
}
