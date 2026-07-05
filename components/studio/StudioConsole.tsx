'use client';

/**
 * StudioConsole — the Virtual Camera Package workspace, self-contained so it can
 * run both on the gated /studio page and embedded in the landing.
 *
 * The user only ever HAS to pick four things: model, resolution, aspect, and the
 * scene description. Every cinematography department defaults to AUTO:
 *   • Camera Package (body · glass · focal · aperture)
 *   • Anamorphic (format + flares)
 *   • Sensor & Motion (ISO · grain · shutter)
 *   • Director's frame (style · lighting · shot · movement · grade)
 * Each department has its own Auto/Manual toggle. A pro can open any one of
 * them; a non-pro never has to.
 *
 * SERVER MAPPING (front-end only — no backend change in this pass):
 *   • ALL departments Auto  → sends auto:true (the existing Auto-Direct path;
 *     the server-side compiler chooses everything).
 *   • ANY department Manual → sends auto:false with the full manual payload.
 *     Departments still on Auto submit CMA's tuned defaults for that take.
 *   ⚠ TRUE mixed-mode ("server picks ISO while I pick the lens") needs
 *     /api/generate to accept omitted per-field values — flagged for a later
 *     backend pass. Flipping a department back to Auto resets it to defaults so
 *     stale manual values are never silently submitted.
 */
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles, AlertTriangle, Wand2, SlidersHorizontal, ShieldCheck, Maximize2, Minimize2, Download,
  Camera as CameraIcon, Gauge, RectangleHorizontal, Clapperboard,
} from 'lucide-react';
import { downloadRender, renderFilename } from '@/lib/download';
import {
  CAMERA_OPTIONS,
  LENS_OPTIONS,
  APERTURE_STOPS,
  GENRE_OPTIONS,
  ANAMORPHIC_OPTIONS,
  FLARE_OPTIONS,
  STYLE_OPTIONS,
  SHOT_OPTIONS,
  MOVE_OPTIONS,
  GRADE_OPTIONS,
  SPEED_OPTIONS,
  findCamera,
  findLens,
  findAnamorphic,
  findStyle,
  findShot,
  findMove,
  findGrade,
  findSpeed,
  letterboxPct,
  STYLE_LIGHTING_LOCKS,
  resolveLighting,
  type GenreStyle,
  type FlareColor,
  type VisualStyle,
  type ShotSize,
  type CameraMove,
  type ColorGrade,
  type SpeedStyle,
} from '@/lib/vcpManifest';
import { DEFAULT_MODEL, findModel } from '@/lib/modelRegistry';
import { getModelCaps, fmtRes, fmtDur, fmtAspect, resolutionLadder } from '@/lib/modelCaps';
import { DrumSelector } from '@/components/studio/DrumSelector';
import { DurationDial } from '@/components/studio/DurationDial';
import { ApiKeyVault } from '@/components/studio/ApiKeyVault';
import { ScopeViewer } from '@/components/studio/ScopeViewer';
import { ModelBrowser } from '@/components/studio/ModelBrowser';
import { LookTileRow } from '@/components/studio/LookTileRow';
import { STYLE_PREVIEWS, LIGHTING_PREVIEWS } from '@/lib/lookPreviews';
import { HonestNote } from '@/components/marketing/HonestNote';
import { LensThumb, CameraThumb } from '@/components/studio/HardwareThumb';
import { GenerationStrip } from '@/components/studio/GenerationStrip';
import { PromptTagEngine } from '@/components/PromptTagEngine';
import { addGeneration, type Generation } from '@/lib/generationStore';
import { makeThumb } from '@/lib/makeThumb';
import type { GenerateAccepted, GenerateError, StatusResult, StatusState, OutputKind } from '@/lib/vcpTypes';

const MAX_POLLS = 168;
const CARD = 'glass glass-gold rounded-2xl';

/** Per-model guidance for audio prompts (each takes text differently). */
const AUDIO_HINTS: Record<string, string> = {
  lyria2: 'Describe the music you want. Instrumental, about 30 seconds.',
  'stable-audio-25': 'Describe the sound effect, foley or musical stem you want.',
  'ace-step': 'Write style tags separated by commas, like: lofi, hiphop, chill, dreamy.',
  'elevenlabs-multilingual-v2': 'Write the exact words to be spoken. 29 languages supported.',
  'kokoro-american-english': 'Write the exact words to be spoken, American English.',
};

/** The four cinematography departments a user can flip to Manual. */
type DeptKey = 'camera' | 'anamorphic' | 'sensor' | 'director';

// Discrete, filmically-real values only — no continuous slider.
const ISO_STOPS = [100, 600, 800, 1600, 3200] as const;
const GRAIN_STOPS = [20, 40, 60] as const;
const SHUTTER_STOPS: { deg: number; msg: string }[] = [
  { deg: 45, msg: '45° — sharp, staccato motion' },
  { deg: 90, msg: '90° — the action, crisp look' },
  { deg: 180, msg: '180° — cinematic standard' },
  { deg: 360, msg: '360° — heavy, blurry motion' },
];

/** The label above each of the three workspace columns. */
function ColumnTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="px-1">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-[#bc9863]" />
        <h2 className="font-[family-name:var(--font-sora)] text-[13px] font-semibold tracking-[0.01em] text-[#e7cfa3]">{title}</h2>
      </div>
      <div className="mt-1 pl-3.5 font-mono text-[9px] tracking-[0.18em] text-[#8b909e] uppercase">{sub}</div>
    </div>
  );
}

/** A card's section header — a real Sora heading with a hairline rule, so it
 * leads the eye instead of blending into the wall of tiny mono micro-labels. */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3.5 border-b border-[#bc9863]/12 pb-2 font-[family-name:var(--font-sora)] text-[13px] font-semibold tracking-[0.01em] text-[#e7cfa3]">
      {children}
    </h3>
  );
}

/** A labelled row of pill options — the director's creative choices. */
function ChipRow<T extends string>({ label, options, value, onChange }: {
  label: string;
  options: readonly { id: T; label: string; hint?: string; disabled?: boolean }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 font-mono text-[9px] tracking-[0.18em] text-[#8b909e] uppercase">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.id}
            onClick={o.disabled ? undefined : () => onChange(o.id)}
            disabled={o.disabled}
            aria-disabled={o.disabled}
            title={o.disabled ? 'Not supported by this model' : o.hint}
            className={`inline-flex min-h-[40px] items-center justify-center rounded-lg border px-3 py-1.5 font-mono text-[11px] transition sm:min-h-0 ${
              o.disabled
                ? 'cursor-not-allowed border-white/5 text-[#575b64] line-through opacity-60'
                : value === o.id ? 'cursor-pointer border-[#bc9863] bg-[#bc9863]/12 text-[#e7cfa3]' : 'cursor-pointer border-white/8 text-[#8b8f99] hover:border-[#bc9863]/40'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** The Auto ⇄ Manual mini-switch every department carries. */
function AutoToggle({ isAuto, onChange, name }: { isAuto: boolean; onChange: (auto: boolean) => void; name: string }) {
  return (
    <div className="flex flex-none rounded-full border border-white/10 bg-black/30 p-0.5" role="group" aria-label={`${name} mode`}>
      {(['Auto', 'Manual'] as const).map((m) => {
        const active = m === 'Auto' ? isAuto : !isAuto;
        return (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m === 'Auto')}
            aria-pressed={active}
            className={`cursor-pointer rounded-full px-2.5 py-1.5 font-mono text-[9px] tracking-[0.12em] uppercase transition sm:py-1 ${
              active ? 'bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] font-semibold text-black' : 'text-[#8b8f99] hover:text-[#e7cfa3]'
            }`}
          >
            {m}
          </button>
        );
      })}
    </div>
  );
}

/** A cinematography department card: collapsed single Auto line, the full
 * controls when flipped to Manual, or a greyed "unavailable" state when the
 * current selections make the department logically impossible (e.g. anamorphic
 * with spherical glass — nothing anamorphic is compiled in that case). */
function DeptSection({
  title, icon, isAuto, onModeChange, autoNote, unavailable, children,
}: {
  title: string;
  icon: React.ReactNode;
  isAuto: boolean;
  onModeChange: (auto: boolean) => void;
  autoNote: string;
  /** when set, the department is locked out and this explains why */
  unavailable?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`${CARD} p-4 ${unavailable ? 'opacity-60 saturate-50' : ''}`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex min-w-0 items-center gap-2 font-[family-name:var(--font-sora)] text-[13px] font-semibold tracking-[0.01em] text-[#e7cfa3]">
          <span className="text-[#bc9863]">{icon}</span>
          <span className="truncate">{title}</span>
        </h3>
        {unavailable ? (
          <span className="flex-none rounded-full border border-white/12 px-2.5 py-1 font-mono text-[9px] tracking-[0.12em] text-[#8b909e] uppercase">
            Locked
          </span>
        ) : (
          <AutoToggle isAuto={isAuto} onChange={onModeChange} name={title} />
        )}
      </div>
      {unavailable ? (
        <p className="mt-3 text-[11.5px] leading-relaxed text-[#8b909e]">{unavailable}</p>
      ) : isAuto ? (
        <p className="mt-3 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-[#8b909e]">
          <Wand2 size={13} className="mt-0.5 shrink-0 text-[#bc9863]" /> {autoNote}
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-4 border-t border-[#bc9863]/12 pt-4">{children}</div>
      )}
    </div>
  );
}

export function StudioConsole({ locked = false, defaultPro = true }: { locked?: boolean; defaultPro?: boolean }) {
  const router = useRouter();
  // Per-department Auto/Manual. Default = Pro (all Manual) so the full rig is
  // visible immediately: people see the power, not the stripped-down easy view.
  // Pass defaultPro={false} for an Auto-first surface.
  const [deptAuto, setDeptAuto] = useState<Record<DeptKey, boolean>>(
    defaultPro
      ? { camera: false, anamorphic: false, sensor: false, director: false }
      : { camera: true, anamorphic: true, sensor: true, director: true },
  );
  const allAuto = deptAuto.camera && deptAuto.anamorphic && deptAuto.sensor && deptAuto.director;
  const allManual = !deptAuto.camera && !deptAuto.anamorphic && !deptAuto.sensor && !deptAuto.director;
  /** any DP-side department manual → the workspace opens into the 3-column rig */
  const dpManual = !deptAuto.camera || !deptAuto.anamorphic || !deptAuto.sensor;

  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [prompt, setPrompt] = useState(''); // example lives in the placeholder → grey + clears on type
  const [negativePrompt, setNegativePrompt] = useState(''); // optional "what to avoid"
  const caps = getModelCaps(model);
  const [resolution, setResolution] = useState(caps.resolutionDefault ?? '');
  const [duration, setDuration] = useState(caps.durationDefault ?? '');
  const [aspect, setAspect] = useState(caps.aspectDefault ?? '');
  const [seed, setSeed] = useState(''); // '' = random; a number locks it
  const [lastSeed, setLastSeed] = useState<number | null>(null);
  // When the model changes, snap format to what the new model supports.
  useEffect(() => {
    const c = getModelCaps(model);
    setResolution((r) => (c.resolutions.includes(r) ? r : c.resolutionDefault ?? ''));
    setDuration((d) => (c.durations.includes(d) ? d : c.durationDefault ?? ''));
    setAspect((a) => (c.aspects.includes(a) ? a : c.aspectDefault ?? ''));
    setSound(null); // back to the new model's own sound default
  }, [model]);
  const [cameraKey, setCameraKey] = useState(CAMERA_OPTIONS[0].id);
  const [lensKey, setLensKey] = useState(LENS_OPTIONS[0].id);
  const [focalLength, setFocalLength] = useState(LENS_OPTIONS[0].focalLengths[0]);
  const [aperture, setAperture] = useState(LENS_OPTIONS[0].maxAperture);
  const [iso, setIso] = useState(800);
  const [grain, setGrain] = useState(40); // discrete 20-by-20 stops
  const [shutter, setShutter] = useState(180);
  const [genre, setGenre] = useState<GenreStyle>('drama');
  const [style, setStyle] = useState<VisualStyle>('cinematic'); // visual aesthetic axis
  const [shotSize, setShotSize] = useState<ShotSize>('medium'); // director controls
  const [cameraMove, setCameraMove] = useState<CameraMove>('static');
  const [grade, setGrade] = useState<ColorGrade>('neutral');
  const [speed, setSpeed] = useState<SpeedStyle>('normal'); // temporal treatment, video only
  /** null = follow the model's own default; true/false = the user's explicit pick */
  const [sound, setSound] = useState<boolean | null>(null);
  const [anamorphic, setAnamorphic] = useState('2'); // default squeeze for anamorphic glass
  const [flare, setFlare] = useState<FlareColor>('blue'); // anamorphic streak-flare colour
  const [promptBig, setPromptBig] = useState(false);

  const camera = findCamera(cameraKey)!;
  const lens = findLens(lensKey)!;
  const modelInfo = findModel(model)!;

  /** Flipping a department back to Auto resets it to CMA defaults, so stale
   * manual values never ride along silently on the next render. */
  const resetDept = useCallback((k: DeptKey) => {
    if (k === 'camera') {
      setCameraKey(CAMERA_OPTIONS[0].id);
      setLensKey(LENS_OPTIONS[0].id);
      setFocalLength(LENS_OPTIONS[0].focalLengths[0]);
      setAperture(LENS_OPTIONS[0].maxAperture);
    } else if (k === 'anamorphic') {
      const g = findLens(lensKey)?.geometry;
      setAnamorphic(g === 'anamorphic' ? '2' : 'none');
      setFlare('blue');
    } else if (k === 'sensor') {
      setIso(800);
      setGrain(40);
      setShutter(180);
    } else {
      setGenre('drama');
      setStyle('cinematic');
      setShotSize('medium');
      setCameraMove('static');
      setGrade('neutral');
      setSpeed('normal');
    }
  }, [lensKey]);

  const setDeptMode = useCallback((k: DeptKey, isAuto: boolean) => {
    setDeptAuto((prev) => {
      // Anamorphic manual control only exists relative to a MANUAL camera
      // package — when the camera returns to Auto, the scope follows it.
      if (k === 'camera' && isAuto) return { ...prev, camera: true, anamorphic: true };
      return { ...prev, [k]: isAuto };
    });
    if (isAuto) {
      resetDept(k);
      if (k === 'camera') resetDept('anamorphic');
    }
  }, [resetDept]);

  /** Master switch — one tap to open or close every department. */
  const masterSet = useCallback((autoAll: boolean) => {
    setDeptAuto({ camera: autoAll, anamorphic: autoAll, sensor: autoAll, director: autoAll });
    if (autoAll) (['camera', 'anamorphic', 'sensor', 'director'] as DeptKey[]).forEach(resetDept);
  }, [resetDept]);

  const cameraItems = useMemo(
    () =>
      CAMERA_OPTIONS.map((c) => ({
        id: c.id,
        label: c.label,
        sub: c.spec,
        thumb: <CameraThumb image={c.image} variant={c.glyph} />,
      })),
    [],
  );
  const lensItems = useMemo(
    () =>
      LENS_OPTIONS.map((l) => ({
        id: l.id,
        label: l.label,
        sub: l.spec,
        thumb: <LensThumb image={l.image} variant={l.glyph} />,
      })),
    [],
  );
  const focalItems = useMemo(() => lens.focalLengths.map((f) => ({ id: String(f), label: `${f}mm` })), [lens]);
  const apertureItems = useMemo(
    () => APERTURE_STOPS.filter((a) => a >= lens.maxAperture).map((a) => ({ id: String(a), label: `T${a.toFixed(1)}` })),
    [lens],
  );

  // LOGIC RULE (Sebastien): spherical glass has NO anamorphic character, so
  // choosing a spherical lens LOCKS the Anamorphic department and guarantees
  // nothing anamorphic is ever compiled into the prompt. Only anamorphic glass
  // unlocks the scope controls — no silent lens swapping.
  const handleLensChange = useCallback((id: string) => {
    const next = findLens(id)!;
    setLensKey(id);
    setFocalLength(next.focalLengths[0]);
    setAperture(next.maxAperture);
    if (next.geometry === 'anamorphic') {
      setAnamorphic('2');
    } else {
      setAnamorphic('none');
      setFlare('blue');
      setDeptAuto((prev) => ({ ...prev, anamorphic: true })); // scope follows the glass
    }
  }, []);

  const handleAnamorphicChange = useCallback((id: string) => {
    setAnamorphic(id);
  }, []);

  // One style of video: picking a style locks the lighting moods that
  // contradict it (the anamorphic pattern on the look axes). If the current
  // mood just became contradictory, snap it to the style's home mood.
  const handleStyleChange = useCallback((v: VisualStyle) => {
    setStyle(v);
    setGenre((g) => resolveLighting(v, g));
  }, []);

  // Audio models take the text directly — no camera package, no framing.
  const isAudio = modelInfo.output === 'audio';

  // Anamorphic preview — only when the department is set manually; on Auto the
  // server decides the framing at render time.
  const ana = findAnamorphic(anamorphic);
  const barPct = deptAuto.anamorphic || isAudio ? 0 : letterboxPct(ana.ratio);
  const aspectLabel = isAudio ? 'AUDIO · MIX' : deptAuto.anamorphic || ana.id === 'none' ? '16:9 · SCOPE' : `${ana.label.split('· ')[1]} · ANAMORPHIC`;

  /* ── render job ── */
  const [status, setStatus] = useState<StatusState | 'IDLE'>('IDLE');
  const [mediaUrl, setMediaUrl] = useState<string | undefined>();
  const [outputKind, setOutputKind] = useState<OutputKind>('video');
  const [queuePos, setQueuePos] = useState<number | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [lastSummary, setLastSummary] = useState<GenerateAccepted['summary'] | null>(null);

  /* ── DP-engine allowance — shown near the render button so the included
     monthly generations are never a surprise. Loaded once for members,
     refreshed from every successful render response. ── */
  const [allowance, setAllowance] = useState<{ used: number; included: number; refreshesOn: string } | null>(null);
  useEffect(() => {
    if (locked) return; // visitors exploring the locked console have no account yet
    let live = true;
    fetch('/api/usage')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (live && d?.ok && d.allowance) setAllowance(d.allowance);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [locked]);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptsRef = useRef(0);
  const variantRef = useRef(0);
  const apiKeyRef = useRef(apiKey);
  const modelRef = useRef(model);
  const genMetaRef = useRef({ prompt: '', model: '' });
  useEffect(() => { apiKeyRef.current = apiKey; }, [apiKey]);
  useEffect(() => { modelRef.current = model; }, [model]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);
  useEffect(() => stopPolling, [stopPolling]);

  const poll = useCallback(
    (token: string) => {
      stopPolling();
      attemptsRef.current = 0;
      pollRef.current = setInterval(async () => {
        attemptsRef.current += 1;
        if (attemptsRef.current > MAX_POLLS) {
          setError('Render timed out. Check your Fal dashboard, then try again.');
          setStatus('ERROR');
          stopPolling();
          return;
        }
        try {
          const res = await fetch('/api/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              trackingToken: token,
              userApiKey: apiKeyRef.current,
              model: modelRef.current,
              // short scene note so the stored file is labelled in My Files
              promptNote: genMetaRef.current.prompt.slice(0, 200),
            }),
          });
          const data: StatusResult = await res.json();
          if (!data.ok) { setError(data.error ?? 'Render failed.'); setStatus('ERROR'); stopPolling(); return; }
          setStatus(data.status);
          setQueuePos(data.queuePosition);
          if (data.output) setOutputKind(data.output);
          if (data.status === 'COMPLETED' && data.mediaUrl) {
            const url = data.mediaUrl;
            const out = data.output ?? 'video';
            if (typeof data.seed === 'number') setLastSeed(data.seed); // capture for "reuse seed"
            setMediaUrl(url);
            // Build a tiny self-contained preview, then save it. If the thumb
            // can't be made (CORS/decode), it's undefined and the strip falls
            // back to the raw Fal URL — never blocks saving the generation.
            const meta = { ...genMetaRef.current };
            makeThumb(url, out).then((thumb) => {
              addGeneration({ url, output: out, prompt: meta.prompt, model: meta.model, thumb });
            });
            stopPolling();
          }
        } catch {
          setError('Lost contact with the render service.');
          setStatus('ERROR');
          stopPolling();
        }
      }, 2500);
    },
    [stopPolling],
  );

  async function generate() {
    stopPolling();
    setError(null);
    setMediaUrl(undefined);
    if (!apiKey) { setError('Connect your Fal.ai key first.'); return; }
    if (!prompt.trim()) { setError('Describe the scene you want to shoot.'); return; }
    if (modelInfo.status === 'preview') { setError(`${modelInfo.label} is coming soon — pick an available model.`); return; }
    variantRef.current += 1;
    genMetaRef.current = { prompt: prompt.trim(), model: modelInfo.label };
    setStatus('IN_QUEUE');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt, model, auto: allAuto, variant: variantRef.current,
          cameraKey, lensKey, focalLength, aperture,
          isoValue: iso, cineNoise: grain, shutterAngle: shutter,
          // Director's frame on Auto → omit, so the server-side compiler chooses.
          genreStyle: deptAuto.director ? undefined : genre,
          style: deptAuto.director ? undefined : style,
          shotSize: deptAuto.director ? undefined : shotSize,
          cameraMove: deptAuto.director ? undefined : cameraMove,
          grade: deptAuto.director ? undefined : grade,
          // temporal speed is a video concept — never sent for stills
          speed: deptAuto.director || isImage ? undefined : speed,
          // explicit sound pick only; null lets the server use the model default
          sound: sound === null ? undefined : sound,
          negativePrompt: negativePrompt.trim() || undefined,
          resolution: resolution || undefined,
          duration: duration || undefined,
          aspect: aspect || undefined,
          seed: seed ? Number(seed) : undefined,
          // Never sent unless the user MANUALLY chose anamorphic glass — spherical
          // glass guarantees zero anamorphic language in the compiled prompt.
          anamorphic: allAuto || deptAuto.anamorphic || lens.geometry !== 'anamorphic' ? undefined : anamorphic,
          flare: allAuto || deptAuto.anamorphic || lens.geometry !== 'anamorphic' || ana.id === 'none' ? undefined : flare,
          userApiKey: apiKey,
        }),
      });
      const data: (GenerateAccepted & { engineAllowance?: { used: number; included: number; refreshesOn: string } }) | GenerateError = await res.json();
      if (!data.ok) { setError(data.error); setStatus('ERROR'); return; }
      setOutputKind(data.output);
      setLastSummary(data.summary);
      if (data.engineAllowance) setAllowance(data.engineAllowance);
      poll(data.trackingToken);
    } catch {
      setError('Could not reach the render service.');
      setStatus('ERROR');
    }
  }

  const pickGeneration = useCallback((g: Generation) => {
    stopPolling();
    setError(null);
    setOutputKind(g.output);
    setMediaUrl(g.url);
    setStatus('COMPLETED');
  }, [stopPolling]);

  const busy = status === 'IN_QUEUE' || status === 'IN_PROGRESS';
  const isImage = modelInfo.output === 'image';

  /* ── shared pieces ── */
  const scope = (
    <ScopeViewer
      status={status}
      mediaUrl={mediaUrl}
      output={outputKind}
      queuePosition={queuePos}
      barPct={barPct}
      aspectLabel={aspectLabel}
      engineLabel={modelInfo.label}
      promptLabel={prompt.trim() || undefined}
      onMediaError={() => {
        setError('The finished render could not be loaded (the Fal URL may have expired).');
        setStatus('ERROR');
      }}
      onDownload={
        mediaUrl
          ? () => downloadRender(mediaUrl, renderFilename(prompt.trim() || 'render', outputKind, modelInfo.label))
          : undefined
      }
    />
  );

  // prompt + render, directly under the video. The Director's frame lives here
  // as its own Auto/Manual department.
  const promptRender = (
    <div className={`${CARD} p-4`}>
      {/* Director's frame — style, lighting, framing, movement, grade (visuals only) */}
      {!isAudio && (
        <div className="mb-3 rounded-xl border border-white/6 bg-black/20 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-[#8b8f99] uppercase">
              <Clapperboard size={13} className="text-[#bc9863]" /> Director&apos;s frame
            </div>
            <AutoToggle isAuto={deptAuto.director} onChange={(a) => setDeptMode('director', a)} name="Director's frame" />
          </div>
          {deptAuto.director ? (
            <p className="mt-2.5 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-[#8b909e]">
              <Wand2 size={13} className="mt-0.5 shrink-0 text-[#bc9863]" />
              Auto. Style, lighting, framing, movement and grade are chosen to fit your scene.
            </p>
          ) : (
            <div className="mt-3.5 flex flex-col gap-4">
              <LookTileRow label="Style" options={STYLE_OPTIONS} previews={STYLE_PREVIEWS} value={style} onChange={(v) => handleStyleChange(v as VisualStyle)} />
              <LookTileRow
                label="Lighting"
                options={GENRE_OPTIONS}
                previews={LIGHTING_PREVIEWS}
                value={genre}
                onChange={(v) => setGenre(v as GenreStyle)}
                lockedIds={STYLE_LIGHTING_LOCKS[style]}
                lockedNote={`Locked — contradicts the ${findStyle(style).label} style.`}
              />
              <ChipRow label="Shot size" options={SHOT_OPTIONS} value={shotSize} onChange={setShotSize} />
              <ChipRow label="Movement" options={MOVE_OPTIONS} value={cameraMove} onChange={setCameraMove} />
              {/* temporal speed — video renders only */}
              {!isImage && <ChipRow label="Speed" options={SPEED_OPTIONS} value={speed} onChange={setSpeed} />}
              <ChipRow label="Colour grade" options={GRADE_OPTIONS} value={grade} onChange={setGrade} />
            </div>
          )}
        </div>
      )}
      <div className="mb-2 flex items-center justify-between">
        <label className="block font-mono text-[10px] tracking-[0.2em] text-[#8b8f99] uppercase">
          {isAudio ? 'Describe your audio' : 'Describe your scene'}
        </label>
        <button
          onClick={() => setPromptBig((b) => !b)}
          aria-expanded={promptBig}
          className="inline-flex cursor-pointer items-center gap-1 font-mono text-[9px] tracking-[0.14em] text-[#8b8f99] uppercase transition hover:text-[#e7cfa3]"
          title={promptBig ? 'Collapse the prompt box' : 'Expand the prompt box'}
        >
          {promptBig ? <Minimize2 size={11} /> : <Maximize2 size={11} />} {promptBig ? 'Collapse' : 'Expand'}
        </button>
      </div>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={isAudio ? AUDIO_HINTS[model] ?? 'Describe the audio you want…' : 'A lone diver drifts through a sunken cathedral at dawn…'}
        className="w-full resize-y overflow-y-auto rounded-xl border border-white/10 bg-black/40 p-3.5 text-[15px] leading-relaxed text-[#f4efe6] outline-none transition focus:border-[#bc9863] placeholder:text-[#8b909e]"
        style={{ minHeight: promptBig ? 280 : 112, maxHeight: 620 }}
      />
      {isAudio && AUDIO_HINTS[model] && (
        <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-[#bc9863]/80">{AUDIO_HINTS[model]}</p>
      )}
      {/* only shown for models that actually honour a negative prompt */}
      {caps.supportsNegativePrompt && (
        <div className="mt-2">
          <label className="mb-1.5 block font-mono text-[9px] tracking-[0.18em] text-red-400 uppercase">
            Exclude <span className="normal-case tracking-normal text-red-400/70">— what to avoid (optional)</span>
          </label>
          <input
            type="text"
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            placeholder="blurry, text, watermark, distorted hands, extra limbs…"
            className="w-full rounded-lg border border-red-500/30 bg-black/40 px-3 py-2 font-mono text-[12px] text-red-200 outline-none transition focus:border-red-400 placeholder:text-red-400/35"
          />
        </div>
      )}
      {/* DP-engine inclusion meter — visible before the decision, never a surprise */}
      {!locked && !isAudio && allowance && (
        <p className="mt-3 flex items-center justify-center gap-2 font-mono text-[10.5px] tracking-[0.08em] text-[#8b909e]">
          <span className={`h-1.5 w-1.5 rounded-full ${allowance.included - allowance.used > 0 ? 'bg-[#bc9863]' : 'bg-red-400'}`} />
          DP engine: {Math.max(0, allowance.included - allowance.used)} of {allowance.included} generations left this
          month · refreshes {allowance.refreshesOn}
        </p>
      )}
      <button
        onClick={locked ? () => router.push('/pricing') : generate}
        disabled={locked ? false : busy || !apiKey}
        aria-disabled={locked ? false : busy || !apiKey}
        title={!locked && !apiKey ? 'Connect your Fal.ai key first' : undefined}
        className="mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-5 py-3.5 text-[15px] font-semibold text-black shadow-[0_10px_30px_rgba(188,152,99,0.3)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Sparkles size={17} />
        {locked
          ? 'Subscribe to render'
          : busy
            ? 'Rolling…'
            : !apiKey
              ? 'Connect a key to render'
              : `Render ${isImage ? 'image' : isAudio ? 'audio' : 'scene'}`}
      </button>
      {locked && (
        <p className="mt-2.5 text-center font-mono text-[11px] leading-relaxed text-[#8b8f99]">
          Explore every control — rendering unlocks with a plan.
        </p>
      )}
      {isAudio ? (
        <p className="mt-2.5 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-[#8b8f99]">
          <Wand2 size={13} className="mt-0.5 shrink-0 text-[#bc9863]" />
          Audio models take your text directly. The camera package does not apply here.
        </p>
      ) : allAuto ? (
        <p className="mt-2.5 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-[#8b8f99]">
          <Wand2 size={13} className="mt-0.5 shrink-0 text-[#bc9863]" />
          Auto-Direct chooses the camera, glass, light and motion to fit your scene. Flip any department to Manual to take control.
        </p>
      ) : (
        <p className="mt-2.5 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-[#8b8f99]">
          <SlidersHorizontal size={13} className="mt-0.5 shrink-0 text-[#bc9863]" />
          Departments left on Auto use CMA&apos;s tuned defaults for this take.
        </p>
      )}
      {/* honest expectations, right where the decision is made */}
      <HonestNote compact className="mt-3" />
      {error && (
        <p role="alert" className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/8 px-3 py-2 font-mono text-[11px] text-red-300">
          <AlertTriangle size={13} /> {error}
        </p>
      )}
      {/* G4.7: a failed or moderated render may still have cost compute on the
          provider side. State it, to match the Terms. */}
      {status === 'ERROR' && (
        <p className="mt-2 font-mono text-[10px] leading-relaxed text-[#8b909e]">
          If the model provider blocked or moderated this render, it may still have consumed compute on your fal.ai
          key. That charge is between you and fal.ai.
        </p>
      )}
    </div>
  );

  // A prominent Download appears right under the scope the moment a render finishes.
  const downloadBar =
    status === 'COMPLETED' && mediaUrl ? (
      <div className="flex justify-center">
        <button
          onClick={() => downloadRender(mediaUrl, renderFilename(prompt.trim() || 'render', outputKind, modelInfo.label))}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-5 py-2.5 text-[13px] font-semibold text-black shadow-[0_8px_24px_rgba(188,152,99,0.3)] transition hover:brightness-105"
        >
          <Download size={15} /> Download this render
        </button>
      </div>
    ) : null;

  // Per-model output format — its own block UNDER the prompt. Shows only the
  // options this model really accepts (hidden if it exposes none).
  const hasFormat = caps.resolutions.length > 0 || caps.durations.length > 0 || caps.aspects.length > 0 || caps.supportsSeed || Boolean(caps.audioParam);
  const soundOn = sound ?? caps.audioDefault ?? true;
  const formatControls = hasFormat ? (
    <div className={`${CARD} flex flex-col gap-3 p-4`}>
      <SectionTitle>Output format</SectionTitle>
      {caps.aspects.length > 0 && (
        <ChipRow label="Aspect" options={caps.aspects.map((v) => ({ id: v, label: fmtAspect(v) }))} value={aspect} onChange={setAspect} />
      )}
      {caps.resolutions.length > 0 && (
        <div>
          <ChipRow label="Resolution" options={resolutionLadder(caps)} value={resolution} onChange={setResolution} />
          <p className="mt-1.5 font-mono text-[9px] leading-relaxed tracking-[0.04em] text-[#8b909e]">
            Higher resolution uses more compute on your Fal key. Greyed tiers are not offered by this model.
          </p>
        </div>
      )}
      {(caps.durations.length > 0 || caps.durationRange) && (
        <DurationDial caps={caps} value={duration} onChange={setDuration} />
      )}
      {/* sound on/off — only for models with a real generate_audio switch */}
      {caps.audioParam && (
        <div>
          <ChipRow
            label="Sound"
            options={[{ id: 'on', label: 'Sound on' }, { id: 'off', label: 'Sound off' }]}
            value={soundOn ? 'on' : 'off'}
            onChange={(v) => setSound(v === 'on')}
          />
          <p className="mt-1.5 font-mono text-[9px] leading-relaxed tracking-[0.04em] text-[#8b909e]">
            Sound changes the compute price on some models. Check the model&apos;s cost note.
          </p>
        </div>
      )}
      {caps.supportsSeed && (
        <div>
          <div className="mb-1.5 font-mono text-[9px] tracking-[0.18em] text-[#8b909e] uppercase">Seed</div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={seed}
              onChange={(e) => setSeed(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
              placeholder="random"
              className="w-32 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 font-mono text-[12px] text-[#f4efe6] outline-none transition focus:border-[#bc9863] placeholder:text-[#8b909e]"
              title="Leave blank for a random seed, or set one to reproduce a look"
            />
            {lastSeed !== null && seed !== String(lastSeed) && (
              <button type="button" onClick={() => setSeed(String(lastSeed))} className="cursor-pointer font-mono text-[10px] text-[#bc9863] transition hover:text-[#e7cfa3]" title="Reuse the last render's seed">
                reuse {lastSeed}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  ) : null;

  /* ── the three DP department cards (shared between both layouts) ── */
  const deptCamera = (
    <DeptSection
      title="Camera Package"
      icon={<CameraIcon size={14} />}
      isAuto={deptAuto.camera}
      onModeChange={(a) => setDeptMode('camera', a)}
      autoNote="Auto. We choose the camera body, glass, focal length and aperture that fit your scene."
    >
      <div className="grid grid-cols-2 gap-4">
        <DrumSelector label="Body" items={cameraItems} value={cameraKey} onChange={setCameraKey} itemHeight={90} />
        <DrumSelector label="Glass" items={lensItems} value={lensKey} onChange={handleLensChange} itemHeight={90} />
        <DrumSelector label="Focal" items={focalItems} value={String(focalLength)} onChange={(v) => setFocalLength(Number(v))} itemHeight={46} />
        <DrumSelector label="Aperture" items={apertureItems} value={String(aperture)} onChange={(v) => setAperture(Number(v))} itemHeight={46} />
      </div>
      <p className="leading-relaxed text-[11px] text-[#8b909e]">
        <span className="text-[#c7c2b8]">Focal</span> — lower is wider, higher is tighter.{' '}
        <span className="text-[#c7c2b8]">Aperture</span> (T-stop) — lower means more background blur.
      </p>
    </DeptSection>
  );

  // The Anamorphic department is only ever interactive when the user has
  // MANUALLY chosen anamorphic glass — otherwise it is locked with the reason.
  const lensIsAnamorphic = lens.geometry === 'anamorphic';
  const anamorphicUnavailable = deptAuto.camera
    ? 'Follows the Camera Package. Flip Camera to Manual and pick anamorphic glass to take control of the scope.'
    : !lensIsAnamorphic
      ? 'Spherical glass has no anamorphic character, so nothing anamorphic is compiled into your prompt. Pick anamorphic glass to unlock the scope.'
      : undefined;

  const deptAnamorphic = (
    <DeptSection
      title="Anamorphic"
      icon={<RectangleHorizontal size={14} />}
      isAuto={deptAuto.anamorphic}
      onModeChange={(a) => setDeptMode('anamorphic', a)}
      autoNote="Auto. We frame the wide scope and flares when the scene calls for them."
      unavailable={anamorphicUnavailable}
    >
      <div className="grid grid-cols-2 gap-2">
        {ANAMORPHIC_OPTIONS.map((a) => (
          <button
            key={a.id}
            onClick={() => handleAnamorphicChange(a.id)}
            className={`cursor-pointer rounded-lg border px-3 py-2 text-left font-mono text-[11px] transition ${
              anamorphic === a.id ? 'border-[#bc9863] bg-[#bc9863]/12 text-[#e7cfa3]' : 'border-white/8 text-[#8b8f99] hover:border-[#bc9863]/40'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>
      <p className="leading-relaxed text-[11px] text-[#8b909e]">
        The wide cinema look with black bars — the scope previews them live, before you render.
      </p>
      {/* flare colour — only meaningful with a squeeze active */}
      {ana.id !== 'none' && (
        <div className="border-t border-white/6 pt-3.5">
          <div className="mb-2 font-mono text-[10px] tracking-[0.2em] text-[#8b8f99] uppercase">Lens flares</div>
          <div className="grid grid-cols-2 gap-2">
            {FLARE_OPTIONS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFlare(f.id)}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 font-mono text-[11px] transition ${
                  flare === f.id ? 'border-[#bc9863] bg-[#bc9863]/12 text-[#e7cfa3]' : 'border-white/8 text-[#8b8f99] hover:border-[#bc9863]/40'
                }`}
              >
                <span className="h-3 w-3 flex-none rounded-full" style={{ background: f.swatch, boxShadow: `0 0 8px ${f.swatch}` }} />
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </DeptSection>
  );

  const deptSensor = (
    <DeptSection
      title="Sensor & Motion"
      icon={<Gauge size={14} />}
      isAuto={deptAuto.sensor}
      onModeChange={(a) => setDeptMode('sensor', a)}
      autoNote="Auto. ISO, film grain and shutter angle are set to fit your scene."
    >
      {/* ISO — real film stops only, not the whole range */}
      <div>
        <div className="mb-2 font-mono text-[10px] tracking-[0.2em] text-[#8b8f99] uppercase">Sensor Gain (ISO)</div>
        <div className="flex flex-wrap gap-1.5">
          {ISO_STOPS.map((v) => (
            <button
              key={v}
              onClick={() => setIso(v)}
              className={`inline-flex min-h-[40px] cursor-pointer items-center justify-center rounded-lg border px-3 py-1.5 font-mono text-[11px] transition sm:min-h-0 ${
                iso === v ? 'border-[#bc9863] bg-[#bc9863]/12 text-[#e7cfa3]' : 'border-white/8 text-[#8b8f99] hover:border-[#bc9863]/40'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      {/* Film Grain — discrete 20-by-20 stops */}
      <div>
        <div className="mb-2 font-mono text-[10px] tracking-[0.2em] text-[#8b8f99] uppercase">Film Grain</div>
        <div className="flex flex-wrap gap-1.5">
          {GRAIN_STOPS.map((v) => (
            <button
              key={v}
              onClick={() => setGrain(v)}
              className={`inline-flex min-h-[40px] cursor-pointer items-center justify-center rounded-lg border px-3 py-1.5 font-mono text-[11px] transition sm:min-h-0 ${
                grain === v ? 'border-[#bc9863] bg-[#bc9863]/12 text-[#e7cfa3]' : 'border-white/8 text-[#8b8f99] hover:border-[#bc9863]/40'
              }`}
            >
              {v}%
            </button>
          ))}
        </div>
      </div>
      {/* Shutter — only the four real cinema angles, with a plain-language note */}
      <div>
        <div className="mb-2 font-mono text-[10px] tracking-[0.2em] text-[#8b8f99] uppercase">Shutter Angle</div>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {SHUTTER_STOPS.map((s) => (
            <button
              key={s.deg}
              onClick={() => setShutter(s.deg)}
              className={`inline-flex min-h-[40px] cursor-pointer items-center justify-center rounded-lg border px-2 py-2 font-mono text-[12px] transition ${
                shutter === s.deg ? 'border-[#bc9863] bg-[#bc9863]/12 text-[#e7cfa3]' : 'border-white/8 text-[#8b8f99] hover:border-[#bc9863]/40'
              }`}
            >
              {s.deg}°
            </button>
          ))}
        </div>
        <p className="mt-2 font-mono text-[10.5px] leading-relaxed text-[#bc9863]/80">
          {SHUTTER_STOPS.find((s) => s.deg === shutter)?.msg}
        </p>
      </div>
    </DeptSection>
  );

  // Model browsers — Video / Image / Audio mega-menu, right above the scope.
  // Order is the shoot order: pick the model, see the scope, set the OUTPUT
  // FORMAT (resolution/length/sound — the price levers), then direct + render.
  // The format block always sits ABOVE the generate button.
  const coreStack = (
    <>
      <ModelBrowser value={model} onChange={setModel} />
      {scope}
      {downloadBar}
      {formatControls}
      {promptRender}
    </>
  );

  const masterSwitch = (
    <div className="mb-5 flex flex-col items-center gap-2.5">
      <span className="font-mono text-[9px] tracking-[0.22em] text-[#8b909e] uppercase">Choose your mode</span>
      <div className="glass glass-gold flex gap-1 rounded-full border border-[#bc9863]/30 p-1">
        <button
          onClick={() => masterSet(false)}
          aria-pressed={allManual}
          className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-6 py-2.5 text-[13.5px] font-semibold transition ${
            allManual ? 'bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] text-black shadow-[0_6px_20px_rgba(188,152,99,0.35)]' : 'text-[#c7c2b8] hover:text-[#e7cfa3]'
          }`}
        >
          <SlidersHorizontal size={15} /> Pro
          <span className={`font-mono text-[9px] tracking-[0.14em] uppercase ${allManual ? 'opacity-70' : 'opacity-50'}`}>full control</span>
        </button>
        <button
          onClick={() => masterSet(true)}
          aria-pressed={allAuto}
          className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-6 py-2.5 text-[13.5px] font-semibold transition ${
            allAuto ? 'bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] text-black shadow-[0_6px_20px_rgba(188,152,99,0.35)]' : 'text-[#c7c2b8] hover:text-[#e7cfa3]'
          }`}
        >
          <Wand2 size={15} /> Auto
          <span className={`font-mono text-[9px] tracking-[0.14em] uppercase ${allAuto ? 'opacity-70' : 'opacity-50'}`}>easy</span>
        </button>
      </div>
      {/* one clear line so nobody wonders what the switch does */}
      <p className="max-w-md text-center text-[12px] leading-relaxed text-[#8b8f99]">
        {allManual ? (
          <><span className="text-[#e7cfa3]">Pro:</span> you direct the camera, lens, film stock and light. Every control, full power.</>
        ) : allAuto ? (
          <><span className="text-[#e7cfa3]">Auto:</span> just describe your scene and the DP engine directs it for you. Flip to Pro for full control.</>
        ) : (
          <><span className="text-[#bc9863]">Custom mix:</span> some departments on Auto, some on Pro.</>
        )}
      </p>
    </div>
  );

  return (
    <div>
      {/* audio models have no camera departments — the switch only shows for visuals */}
      {!isAudio && masterSwitch}

      {!dpManual || isAudio ? (
        /* ── SIMPLE layout — single column; departments collapsed to Auto ── */
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex flex-col gap-3">
            <div className={`${CARD} p-4`}>
              <div className="mb-2 flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-[#8b8f99] uppercase">
                <span className="grid h-4 w-4 place-items-center rounded-full bg-[#bc9863]/20 text-[9px] text-[#e7cfa3]">1</span> Connect your key
              </div>
              <ApiKeyVault onKeyChange={setApiKey} embedded />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {coreStack}
            {/* the departments, collapsed to slim Auto rows — flip any to take control */}
            {!isAudio && (
              <div>
                <div className="mb-2 px-1 font-mono text-[9px] tracking-[0.2em] text-[#8b909e] uppercase">
                  Cinematography departments · flip any to Manual
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {deptCamera}
                  {deptAnamorphic}
                  {deptSensor}
                </div>
              </div>
            )}
            <GenerationStrip onPick={pickGeneration} />
          </div>
        </div>
      ) : (
        /* ── OPEN RIG — 3 columns; manual departments expanded in the left rail ──
           Phone: shoot order — ALL the tools first, then the render, then the
           readout right under it (Sebastien's rule: everything you set comes
           BEFORE generate). Tablet: Director full-width on top, rails below.
           Desktop: classic 3-column rig with a sticky readout. */
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-[340px_1fr_340px]">
          <section className="order-1 flex flex-col gap-5 md:order-2 lg:order-1">
            <ColumnTitle title="Director of Photography" sub="Camera · lens · exposure" />
            <ApiKeyVault onKeyChange={setApiKey} />
            {deptCamera}
            {deptAnamorphic}
            {deptSensor}
          </section>

          <section className="order-2 flex flex-col gap-5 md:order-1 md:col-span-2 lg:col-span-1 lg:order-2">
            <ColumnTitle title="Director" sub="Scene · look · render" />
            <div className="flex flex-col gap-4">
              {coreStack}
              <GenerationStrip onPick={pickGeneration} />
            </div>
          </section>

          {/* Sticky on desktop: the readout is the DP's monitor — it follows the
              scroll so the full package stays under your eyes while you dial. */}
          <section className="order-3 flex flex-col gap-5 lg:sticky lg:top-16 lg:order-3 lg:max-h-[calc(100vh-5rem)] lg:self-start lg:overflow-y-auto lg:pr-1">
            <ColumnTitle title="Your Setup" sub="Live compiler · package readout" />
            {allManual ? (
              <PromptTagEngine
                prompt={prompt}
                cameraLabel={camera.label}
                lensLabel={lens.label}
                focalLength={focalLength}
                aperture={aperture}
                isoValue={iso}
                cineNoise={grain}
                shutterAngle={shutter}
                genre={genre}
                styleLabel={findStyle(style).label}
                isCelluloid={camera.isCelluloid}
              />
            ) : (
              <div className={`${CARD} p-4`}>
                <SectionTitle>Prompt Compiler</SectionTitle>
                <p className="text-[11.5px] leading-relaxed text-[#8b909e]">
                  The live compiler appears when every department is set to Manual. Departments on Auto are compiled
                  server side at render time.
                </p>
              </div>
            )}
            <div className={`${CARD} p-4`}>
              <SectionTitle>Package Readout</SectionTitle>
              <dl className="flex flex-col gap-2.5 font-mono text-[11px]">
                {[
                  ['Model', modelInfo.label],
                  ...(caps.aspects.length ? [['Aspect', fmtAspect(aspect)]] : []),
                  ...(caps.resolutions.length ? [['Resolution', fmtRes(resolution)]] : []),
                  ...(caps.durations.length ? [['Length', fmtDur(duration)]] : []),
                  ...(caps.audioParam ? [['Sound', soundOn ? 'On' : 'Off']] : []),
                  ...(!isImage ? [['Speed', deptAuto.director ? 'Auto' : findSpeed(speed).label]] : []),
                  ['Body', deptAuto.camera ? 'Auto' : camera.label],
                  ['Glass', deptAuto.camera ? 'Auto' : lens.label],
                  ['Anamorphic', !deptAuto.camera && !lensIsAnamorphic ? 'None · spherical glass' : deptAuto.anamorphic ? 'Auto' : ana.label],
                  ...(!deptAuto.anamorphic && ana.id !== 'none' ? [['Flares', flare === 'gold' ? 'Golden' : 'Blue']] : []),
                  ['Optics', deptAuto.camera ? 'Auto' : `${focalLength}mm · T${aperture.toFixed(1)}`],
                  ['Sensor', deptAuto.sensor ? 'Auto' : camera.isCelluloid ? `Celluloid · ${grain}% grain` : `Digital · ISO ${iso}`],
                  ['Style', deptAuto.director ? 'Auto' : findStyle(style).label],
                  ['Shot', deptAuto.director ? 'Auto' : findShot(shotSize).label],
                  ['Move', deptAuto.director ? 'Auto' : findMove(cameraMove).label],
                  ['Grade', deptAuto.director ? 'Auto' : findGrade(grade).label],
                  ['Genre', deptAuto.director ? 'Auto' : genre],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between border-b border-white/5 pb-2">
                    <dt className="tracking-[0.14em] text-[#8b909e] uppercase">{k}</dt>
                    <dd className="text-[#e7cfa3]">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        </div>
      )}

      {lastSummary?.auto && allAuto && (
        <p className="mt-4 text-center font-mono text-[11px] text-[#8b909e]">
          Last take, Auto-Direct chose {lastSummary.camera} · {lastSummary.lens} · {lastSummary.focalLength}mm · {findStyle(lastSummary.style).label} · {lastSummary.genre}.
        </p>
      )}
      <p className="mt-5 flex items-center justify-center gap-2 text-center font-mono text-[10.5px] leading-relaxed text-[#8b909e]">
        <ShieldCheck size={12} className="text-[#bc9863]" />
        Renders run on your own Fal.ai key. CMA never touches your compute billing.
      </p>
    </div>
  );
}
