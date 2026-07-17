'use client';

/**
 * RealEstateConsole — CMA Real Estate Studio control panel (INERT preview).
 *
 * Real-estate-native controls only: no lenses, no anamorphic, no film stock,
 * no DP vocabulary. An agent thinks in listings — shots, light, pace — and the
 * panel speaks that language. Renders always start from the user's OWN photos
 * of the property (we cannot invent a real house from nothing); drone moves
 * animate from an uploaded aerial base photo.
 *
 * INERT: no network calls anywhere in this tree. The render bar is disabled.
 * The dedicated listing-film skill plugs in later (lib/skills/realEstateSkill).
 */
import { useState } from 'react';
import { StudioCard, Chips, Field, UploadTile, InertRenderBar } from '@/components/studios/InertStudioKit';

/* Templated presets for the shots every listing needs. Picking one pre-fills
 * the movement/light/pacing controls below so a non-technical agent gets a
 * proven recipe in one tap, then fine-tunes if they want. */
const LISTING_PRESETS = [
  { id: 'exterior-reveal', label: 'Exterior reveal', move: 'drone-rise', light: 'bright', time: 'golden', pace: 'calm' },
  { id: 'twilight-exterior', label: 'Twilight exterior', move: 'push-in', light: 'cinematic', time: 'twilight', pace: 'calm' },
  { id: 'walk-through', label: 'Full walk-through', move: 'walk-through', light: 'bright', time: 'midday', pace: 'balanced' },
  { id: 'kitchen-hero', label: 'Kitchen hero', move: 'push-in', light: 'bright', time: 'morning', pace: 'calm' },
  { id: 'backyard-pool', label: 'Backyard & pool', move: 'drone-orbit', light: 'bright', time: 'golden', pace: 'balanced' },
  { id: 'curb-appeal', label: 'Curb appeal approach', move: 'fly-through', light: 'bright', time: 'morning', pace: 'energetic' },
] as const;

type PresetId = (typeof LISTING_PRESETS)[number]['id'];

const MOVES = [
  { id: 'drone-orbit', label: 'Drone orbit', hint: 'Circle the property from the air' },
  { id: 'drone-rise', label: 'Drone rise & reveal', hint: 'Lift from ground level to a full aerial reveal' },
  { id: 'push-in', label: 'Push-in', hint: 'Glide toward the front of the home' },
  { id: 'walk-through', label: 'Floating walk-through', hint: 'Smooth first-person tour through the rooms' },
  { id: 'fly-through', label: 'Fly through the home', hint: 'Continuous flight from room to room' },
  { id: 'doors-open', label: 'Doors open as you pass', hint: 'Doorways open ahead of the camera' },
  { id: 'static', label: 'Composed still', hint: 'Locked, magazine-style framing' },
] as const;

export function RealEstateConsole() {
  const [preset, setPreset] = useState<PresetId | ''>('');
  const [move, setMove] = useState<string>('drone-orbit');
  const [light, setLight] = useState<string>('bright');
  const [time, setTime] = useState<string>('golden');
  const [pace, setPace] = useState<string>('calm');
  const [sky, setSky] = useState<string>('as-shot');
  const [length, setLength] = useState<string>('15');
  const [aspect, setAspect] = useState<string>('16:9');
  const [endCard, setEndCard] = useState('');

  function applyPreset(id: PresetId) {
    const p = LISTING_PRESETS.find((x) => x.id === id)!;
    setPreset(id);
    setMove(p.move);
    setLight(p.light);
    setTime(p.time);
    setPace(p.pace);
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[380px_1fr]">
      {/* ── the property — the user's own media is the ground truth ── */}
      <section className="flex flex-col gap-5">
        <StudioCard
          title="Your property"
          sub="Listing films always start from your own photos. We enhance and move the camera; we never invent a house that isn't yours."
        >
          <UploadTile
            label="Property photo"
            note="A clear photo of the room or exterior you want the shot built from."
          />
          <UploadTile
            label="Aerial base photo · for drone shots"
            note="Drone moves animate from your own aerial or elevated photo. No aerial photo, no drone shot — that keeps the footage honest."
          />
        </StudioCard>
        <StudioCard title="Listing shot templates" sub="One tap sets the movement, light and pacing to a proven listing recipe. Fine-tune anything after.">
          <div className="grid grid-cols-2 gap-1.5">
            {LISTING_PRESETS.map((p) => (
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

      {/* ── the shot — plain-language controls ── */}
      <section className="flex flex-col gap-5">
        <StudioCard title="Camera movement">
          <Chips label="Movement" options={MOVES} value={move} onChange={(v) => { setMove(v); setPreset(''); }} />
        </StudioCard>
        <StudioCard title="Light & mood">
          <Chips
            label="Lighting"
            options={[
              { id: 'bright', label: 'Bright & airy', hint: 'Clean daylight, the MLS-friendly look' },
              { id: 'cinematic', label: 'Cinematic', hint: 'Warmer, moodier, film-style light' },
            ]}
            value={light}
            onChange={(v) => { setLight(v); setPreset(''); }}
          />
          <Chips
            label="Time of day"
            options={[
              { id: 'morning', label: 'Morning' },
              { id: 'midday', label: 'Midday' },
              { id: 'golden', label: 'Golden hour' },
              { id: 'twilight', label: 'Twilight' },
            ]}
            value={time}
            onChange={(v) => { setTime(v); setPreset(''); }}
          />
          <Chips
            label="Sky"
            options={[
              { id: 'as-shot', label: 'As shot' },
              { id: 'blue', label: 'Clear blue' },
              { id: 'sunset', label: 'Soft sunset' },
            ]}
            value={sky}
            onChange={setSky}
          />
          <p className="text-[11px] leading-relaxed text-[#8b909e]">
            Keep listing media truthful: enhancements should stay representative of the property as it really is.
          </p>
        </StudioCard>
        <StudioCard title="Motion & delivery">
          <Chips
            label="Pacing"
            options={[
              { id: 'calm', label: 'Calm & elegant' },
              { id: 'balanced', label: 'Balanced' },
              { id: 'energetic', label: 'Energetic' },
            ]}
            value={pace}
            onChange={(v) => { setPace(v); setPreset(''); }}
          />
          <Chips
            label="Clip length"
            options={[
              { id: '10', label: '10s' },
              { id: '15', label: '15s' },
              { id: '30', label: '30s' },
            ]}
            value={length}
            onChange={setLength}
          />
          <Chips
            label="Format"
            options={[
              { id: '16:9', label: '16:9 · Tour & MLS' },
              { id: '9:16', label: '9:16 · Reels' },
              { id: '1:1', label: '1:1 · Feed' },
            ]}
            value={aspect}
            onChange={setAspect}
          />
          <Field
            label="Agent end-card · optional"
            value={endCard}
            onChange={setEndCard}
            placeholder="Jane Doe · Compass · (555) 010-2030"
          />
        </StudioCard>
        <InertRenderBar studio="CMA Real Estate Studio" />
      </section>
    </div>
  );
}
