'use client';

/**
 * StudioConsole — the Virtual Camera Package workspace, self-contained so it can
 * run both on the gated /studio page and embedded in the landing.
 *
 *   • AUTO (default, "easy") — connect key, pick a model, describe & render.
 *     CMA's Auto-Director chooses the whole camera package for you.
 *   • MANUAL ("advanced") — full camera package + anamorphic control + live
 *     compiler for hands-on control.
 * The prompt + Render sit directly under the video; recent work shows as a strip
 * beneath it with a full "See all my work" gallery.
 */
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, AlertTriangle, Wand2, SlidersHorizontal, ShieldCheck, Maximize2, Minimize2, Download } from 'lucide-react';
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
  findCamera,
  findLens,
  findAnamorphic,
  findStyle,
  findShot,
  findMove,
  findGrade,
  letterboxPct,
  type GenreStyle,
  type FlareColor,
  type VisualStyle,
  type ShotSize,
  type CameraMove,
  type ColorGrade,
} from '@/lib/vcpManifest';
import { DEFAULT_MODEL, findModel } from '@/lib/modelRegistry';
import { getModelCaps, fmtRes, fmtDur, fmtAspect } from '@/lib/modelCaps';
import { DrumSelector } from '@/components/studio/DrumSelector';
import { ApiKeyVault } from '@/components/studio/ApiKeyVault';
import { ScopeViewer } from '@/components/studio/ScopeViewer';
import { ModelPicker } from '@/components/studio/ModelPicker';
import { LensThumb, CameraThumb } from '@/components/studio/HardwareThumb';
import { GenerationStrip } from '@/components/studio/GenerationStrip';
import { PromptTagEngine } from '@/components/PromptTagEngine';
import { addGeneration, type Generation } from '@/lib/generationStore';
import { makeThumb } from '@/lib/makeThumb';
import type { GenerateAccepted, GenerateError, StatusResult, StatusState, OutputKind } from '@/lib/vcpTypes';

const MAX_POLLS = 168;
const CARD = 'glass glass-gold rounded-2xl';
type Mode = 'auto' | 'manual';

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
  options: readonly { id: T; label: string; hint?: string }[];
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
            onClick={() => onChange(o.id)}
            title={o.hint}
            className={`inline-flex min-h-[40px] cursor-pointer items-center justify-center rounded-lg border px-3 py-1.5 font-mono text-[11px] transition sm:min-h-0 ${
              value === o.id ? 'border-[#bc9863] bg-[#bc9863]/12 text-[#e7cfa3]' : 'border-white/8 text-[#8b8f99] hover:border-[#bc9863]/40'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function StudioConsole({ locked = false }: { locked?: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('auto');
  const auto = mode === 'auto';
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
  const [anamorphic, setAnamorphic] = useState('2'); // default squeeze for anamorphic glass
  const [flare, setFlare] = useState<FlareColor>('blue'); // anamorphic streak-flare colour
  const [promptBig, setPromptBig] = useState(false);

  const camera = findCamera(cameraKey)!;
  const lens = findLens(lensKey)!;
  const modelInfo = findModel(model)!;

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

  const handleLensChange = useCallback((id: string) => {
    const next = findLens(id)!;
    setLensKey(id);
    setFocalLength(next.focalLengths[0]);
    setAperture(next.maxAperture);
    setAnamorphic(next.geometry === 'anamorphic' ? '2' : 'none');
  }, []);

  // Picking an anamorphic FORMAT while on spherical glass auto-swaps the lens to
  // Modern Anamorphic, so the lens we compile matches the format the user chose.
  const handleAnamorphicChange = useCallback((id: string) => {
    setAnamorphic(id);
    if (id === 'none') return;
    const current = findLens(lensKey)!;
    if (current.geometry !== 'anamorphic') {
      const next = findLens('modern-anamorphic')!;
      setLensKey(next.id);
      setFocalLength(next.focalLengths[0]);
      setAperture(next.maxAperture);
    }
  }, [lensKey]);

  // Anamorphic preview (manual only; auto lets the server pick the aspect).
  const ana = findAnamorphic(anamorphic);
  const barPct = auto ? 0 : letterboxPct(ana.ratio);
  const aspectLabel = auto || ana.id === 'none' ? '16:9 · SCOPE' : `${ana.label.split('· ')[1]} · ANAMORPHIC`;

  /* ── render job ── */
  const [status, setStatus] = useState<StatusState | 'IDLE'>('IDLE');
  const [mediaUrl, setMediaUrl] = useState<string | undefined>();
  const [outputKind, setOutputKind] = useState<OutputKind>('video');
  const [queuePos, setQueuePos] = useState<number | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [lastSummary, setLastSummary] = useState<GenerateAccepted['summary'] | null>(null);

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
            body: JSON.stringify({ trackingToken: token, userApiKey: apiKeyRef.current, model: modelRef.current }),
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
          prompt, model, auto, variant: variantRef.current,
          cameraKey, lensKey, focalLength, aperture,
          isoValue: iso, cineNoise: grain, shutterAngle: shutter, genreStyle: genre, style,
          shotSize, cameraMove, grade,
          negativePrompt: negativePrompt.trim() || undefined,
          resolution: resolution || undefined,
          duration: duration || undefined,
          aspect: aspect || undefined,
          seed: seed ? Number(seed) : undefined,
          anamorphic: auto ? undefined : anamorphic,
          flare: auto || ana.id === 'none' ? undefined : flare,
          userApiKey: apiKey,
        }),
      });
      const data: GenerateAccepted | GenerateError = await res.json();
      if (!data.ok) { setError(data.error); setStatus('ERROR'); return; }
      setOutputKind(data.output);
      setLastSummary(data.summary);
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

  // prompt + render, directly under the video
  const promptRender = (
    <div className={`${CARD} p-4`}>
      <div className="mb-3 flex flex-col gap-3">
        {/* Style + Lighting are the "basic" director choices — shown in easy AND advanced */}
        <ChipRow label="Style" options={STYLE_OPTIONS} value={style} onChange={setStyle} />
        <ChipRow label="Lighting" options={GENRE_OPTIONS} value={genre} onChange={setGenre} />
        {/* the rest of the director frame is advanced-only */}
        {!auto && (
          <>
            <ChipRow label="Shot size" options={SHOT_OPTIONS} value={shotSize} onChange={setShotSize} />
            <ChipRow label="Movement" options={MOVE_OPTIONS} value={cameraMove} onChange={setCameraMove} />
            <ChipRow label="Colour grade" options={GRADE_OPTIONS} value={grade} onChange={setGrade} />
          </>
        )}
      </div>
      <div className="mb-2 flex items-center justify-between">
        <label className="block font-mono text-[10px] tracking-[0.2em] text-[#8b8f99] uppercase">Describe your scene</label>
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
        placeholder="A lone diver drifts through a sunken cathedral at dawn…"
        className="w-full resize-y overflow-y-auto rounded-xl border border-white/10 bg-black/40 p-3.5 text-[15px] leading-relaxed text-[#f4efe6] outline-none transition focus:border-[#bc9863] placeholder:text-[#8b909e]"
        style={{ minHeight: promptBig ? 280 : 112, maxHeight: 620 }}
      />
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
              : `Render ${isImage ? 'image' : 'scene'}`}
      </button>
      {locked && (
        <p className="mt-2.5 text-center font-mono text-[11px] leading-relaxed text-[#8b8f99]">
          Explore every control — rendering unlocks with a plan.
        </p>
      )}
      {auto && (
        <p className="mt-2.5 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-[#8b8f99]">
          <Wand2 size={13} className="mt-0.5 shrink-0 text-[#bc9863]" />
          Auto-Direct is choosing the camera, lenses, focal length, aperture, ISO, grain, motion and shot angles for you — Style, Lighting and Exclude above are yours to guide.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/8 px-3 py-2 font-mono text-[11px] text-red-300">
          <AlertTriangle size={13} /> {error}
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
  const hasFormat = caps.resolutions.length > 0 || caps.durations.length > 0 || caps.aspects.length > 0 || caps.supportsSeed;
  const formatControls = hasFormat ? (
    <div className={`${CARD} flex flex-col gap-3 p-4`}>
      <SectionTitle>Output format</SectionTitle>
      {caps.aspects.length > 0 && (
        <ChipRow label="Aspect" options={caps.aspects.map((v) => ({ id: v, label: fmtAspect(v) }))} value={aspect} onChange={setAspect} />
      )}
      {caps.resolutions.length > 0 && (
        <div>
          <ChipRow label="Resolution" options={caps.resolutions.map((v) => ({ id: v, label: fmtRes(v) }))} value={resolution} onChange={setResolution} />
          <p className="mt-1.5 font-mono text-[9px] leading-relaxed tracking-[0.04em] text-[#8b909e]">
            Higher resolution uses more compute on your Fal key.
          </p>
        </div>
      )}
      {caps.durations.length > 0 && (
        <ChipRow label="Length" options={caps.durations.map((v) => ({ id: v, label: fmtDur(v) }))} value={duration} onChange={setDuration} />
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

  // Video + Photo model selectors — live in the Director column, right above the scope.
  const modelPickers = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <ModelPicker kind="video" value={model} onChange={setModel} />
      <ModelPicker kind="image" value={model} onChange={setModel} />
    </div>
  );

  const mainColumn = (
    <div className="flex flex-col gap-4">
      {modelPickers}
      {scope}
      {downloadBar}
      {promptRender}
      {formatControls}
      <GenerationStrip onPick={pickGeneration} />
    </div>
  );

  const modeSwitch = (
    <div className="mb-5 flex justify-center">
      <div className="glass flex gap-1 rounded-full p-1">
        {(['auto', 'manual'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition ${
              mode === m ? 'bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] text-black' : 'text-[#8b8f99] hover:text-[#e7cfa3]'
            }`}
          >
            {m === 'auto' ? <Wand2 size={15} /> : <SlidersHorizontal size={15} />}
            {m === 'auto' ? 'Auto-Direct' : 'Manual'}
            <span className={`font-mono text-[9px] tracking-[0.14em] uppercase ${mode === m ? 'opacity-70' : 'opacity-50'}`}>
              {m === 'auto' ? 'easy' : 'advanced'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      {modeSwitch}

      {auto ? (
        /* ── SIMPLE layout — single column, prompt under the video ── */
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex flex-col gap-3">
            <div className={`${CARD} p-4`}>
              <div className="mb-2 flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-[#8b8f99] uppercase">
                <span className="grid h-4 w-4 place-items-center rounded-full bg-[#bc9863]/20 text-[9px] text-[#e7cfa3]">1</span> Connect your key
              </div>
              <ApiKeyVault onKeyChange={setApiKey} embedded />
            </div>
          </div>
          {mainColumn}
        </div>
      ) : (
        /* ── ADVANCED layout — full camera package (tablet: Director on top, DP + info below) ── */
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-[340px_1fr_340px]">
          <section className="order-2 flex flex-col gap-5 lg:order-1">
            <ColumnTitle title="Director of Photography" sub="Camera · lens · exposure" />
            {/* logical order: 1 connect · 2 camera package · 3 anamorphic · 4 sensor (model lives in the Director column) */}
            <ApiKeyVault onKeyChange={setApiKey} />
            <div className={`${CARD} p-4`}>
              <SectionTitle>Camera Package</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <DrumSelector label="Body" items={cameraItems} value={cameraKey} onChange={setCameraKey} itemHeight={90} />
                <DrumSelector label="Glass" items={lensItems} value={lensKey} onChange={handleLensChange} itemHeight={90} />
                <DrumSelector label="Focal" items={focalItems} value={String(focalLength)} onChange={(v) => setFocalLength(Number(v))} itemHeight={46} />
                <DrumSelector label="Aperture" items={apertureItems} value={String(aperture)} onChange={(v) => setAperture(Number(v))} itemHeight={46} />
              </div>
              <p className="mt-3 leading-relaxed text-[11px] text-[#8b909e]">
                <span className="text-[#c7c2b8]">Focal</span> — lower is wider, higher is tighter.{' '}
                <span className="text-[#c7c2b8]">Aperture</span> (T-stop) — lower means more background blur.
              </p>
            </div>
            {/* anamorphic control with live letterbox preview */}
            <div className={`${CARD} p-4`}>
              <SectionTitle>Anamorphic</SectionTitle>
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
              <p className="mt-2.5 leading-relaxed text-[11px] text-[#8b909e]">
                The wide cinema look with black bars — the scope previews them live, before you render.
              </p>
              {/* flare colour — only meaningful with a squeeze active */}
              {ana.id !== 'none' && (
                <div className="mt-4 border-t border-white/6 pt-3.5">
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
            </div>
            <div className={`${CARD} flex flex-col gap-4 p-4`}>
              <SectionTitle>Sensor &amp; Motion</SectionTitle>
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
            </div>
          </section>

          <section className="order-1 flex flex-col gap-5 md:col-span-2 lg:col-span-1 lg:order-2">
            <ColumnTitle title="Director" sub="Scene · look · render" />
            {mainColumn}
          </section>

          <section className="order-3 flex flex-col gap-5 lg:order-3">
            <ColumnTitle title="Your Setup" sub="Live compiler · package readout" />
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
            <div className={`${CARD} p-4`}>
              <SectionTitle>Package Readout</SectionTitle>
              <dl className="flex flex-col gap-2.5 font-mono text-[11px]">
                {[
                  ['Model', modelInfo.label],
                  ...(caps.aspects.length ? [['Aspect', fmtAspect(aspect)]] : []),
                  ...(caps.resolutions.length ? [['Resolution', fmtRes(resolution)]] : []),
                  ...(caps.durations.length ? [['Length', fmtDur(duration)]] : []),
                  ['Body', camera.label],
                  ['Glass', lens.label],
                  ['Anamorphic', ana.label],
                  ...(ana.id !== 'none' ? [['Flares', flare === 'gold' ? 'Golden' : 'Blue']] : []),
                  ['Optics', `${focalLength}mm · T${aperture.toFixed(1)}`],
                  ['Sensor', camera.isCelluloid ? `Celluloid · ${grain}% grain` : `Digital · ISO ${iso}`],
                  ['Style', findStyle(style).label],
                  ['Shot', findShot(shotSize).label],
                  ['Move', findMove(cameraMove).label],
                  ['Grade', findGrade(grade).label],
                  ['Genre', genre],
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

      {lastSummary?.auto && auto && (
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
