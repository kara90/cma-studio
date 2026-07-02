'use client';

/**
 * DirectGenerator — the PLAIN generator behind /video, /image and /audio.
 * The user's own prompt goes to the model exactly as written (server `direct`
 * mode): no studio recipe, no camera package, no compiled cinematography.
 * One kind per page; the ModelPicker only offers models of that kind.
 *
 * DESIGN: the clean everyday tool, visually distinct from the Studio flagship.
 * Two-column desktop grid — a 400px composer sidebar in plain .glass on the
 * left, the result canvas (ScopeViewer) + download bar + recent work on the
 * right. Mobile stacks the composer first. Gold is reserved for the Generate
 * button and active chips; section labels are slim mono.
 *
 * Wire protocol mirrors StudioConsole exactly:
 *   POST /api/generate { prompt, model, direct:true, …format, startImage?,
 *   endImage?, sound?, userApiKey } → { ok, trackingToken, output } → poll
 *   POST /api/status every 2500ms (MAX_POLLS cap) → COMPLETED gives mediaUrl
 *   (+ optional seed, stored).
 * Start/end frames are uploaded AT GENERATE TIME straight to fal on the
 * user's own key (lib/falUpload) — they never touch CMA servers.
 */
import { useEffect, useRef, useState, useCallback, useId } from 'react';
import Link from 'next/link';
import { Sparkles, AlertTriangle, Download, ArrowRight, ImagePlus, X } from 'lucide-react';
import { downloadRender, renderFilename } from '@/lib/download';
import { findModel } from '@/lib/modelRegistry';
import { getModelCaps, fmtRes, fmtDur, fmtAspect, resolutionLadder } from '@/lib/modelCaps';
import { DurationDial } from '@/components/studio/DurationDial';
import { uploadToFal } from '@/lib/falUpload';
import { ModelPicker } from '@/components/studio/ModelPicker';
import { ApiKeyVault } from '@/components/studio/ApiKeyVault';
import { ScopeViewer } from '@/components/studio/ScopeViewer';
import { GenerationStrip } from '@/components/studio/GenerationStrip';
import { HonestNote } from '@/components/marketing/HonestNote';
import { addGeneration, type Generation } from '@/lib/generationStore';
import { makeThumb } from '@/lib/makeThumb';
import type { GenerateAccepted, GenerateError, StatusResult, StatusState, OutputKind } from '@/lib/vcpTypes';

const MAX_POLLS = 168;
const MAX_FRAME_BYTES = 10 * 1024 * 1024; // 10 MB client-side ceiling per frame

type DirectKind = 'video' | 'image' | 'audio';

const DEFAULT_BY_KIND: Record<DirectKind, string> = {
  video: 'seedance-2',
  image: 'nano-banana-pro',
  audio: 'lyria2',
};

const PLACEHOLDER_BY_KIND: Record<DirectKind, string> = {
  video: 'A lone surfer carves across glassy water at golden hour, spray catching the light…',
  image: 'A rain-soaked neon street at night, reflections shimmering on wet asphalt…',
  audio: 'Describe the audio you want…',
};

/** Per-model guidance for audio prompts (each takes text differently). */
const AUDIO_HINTS: Record<string, string> = {
  lyria2: 'Describe the music you want. Instrumental, about 30 seconds.',
  'stable-audio-25': 'Describe the sound effect, foley or musical stem you want.',
  'ace-step': 'Write style tags separated by commas, like: lofi, hiphop, chill, dreamy.',
  'elevenlabs-multilingual-v2': 'Write the exact words to be spoken. 29 languages supported.',
  'kokoro-american-english': 'Write the exact words to be spoken, American English.',
};

/** A labelled row of pill options — same pattern as the studio's chips. */
function ChipRow<T extends string>({ label, options, value, onChange }: {
  label: string;
  options: readonly { id: T; label: string; disabled?: boolean }[];
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
            type="button"
            onClick={o.disabled ? undefined : () => onChange(o.id)}
            disabled={o.disabled}
            aria-disabled={o.disabled}
            aria-pressed={value === o.id}
            title={o.disabled ? 'Not supported by this model' : undefined}
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

/** A picked frame: the file plus its object-URL preview (revoked on replace/remove). */
interface FramePick {
  file: File;
  url: string;
}

/**
 * FrameSlot — one dashed drop/click tile for a start, end or reference image.
 * Hidden file input behind a keyboard-accessible label; picked files show a
 * thumbnail preview with the name and a remove button. Type + size checks
 * surface friendly errors via onIssue. Stateless: the parent owns the pick
 * (and its preview URL), so this stays a pure controlled component.
 */
function FrameSlot({ inputId, label, sublabel, frame, onFile, onIssue }: {
  inputId: string;
  label: string;
  sublabel: string;
  frame: FramePick | null;
  onFile: (f: File | null) => void;
  onIssue: (msg: string | null) => void;
}) {
  const accept = (f: File | null | undefined) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      onIssue('Frames must be images. Pick a JPG or PNG file.');
      return;
    }
    if (f.size > MAX_FRAME_BYTES) {
      onIssue('That image is over 10 MB. Pick a smaller file.');
      return;
    }
    onIssue(null);
    onFile(f);
  };

  return (
    <div>
      <div className="mb-1.5 flex items-baseline gap-2">
        <span className="font-mono text-[9px] tracking-[0.18em] text-[#8b909e] uppercase">{label}</span>
        <span className="font-mono text-[9px] tracking-[0.04em] text-[#8b909e]/70">{sublabel}</span>
      </div>
      {frame ? (
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={frame.url} alt={`${label} preview`} className="h-24 w-full object-cover" />
          <button
            type="button"
            onClick={() => { onFile(null); onIssue(null); }}
            aria-label={`Remove ${label.toLowerCase()}`}
            title={`Remove ${label.toLowerCase()}`}
            className="absolute right-1.5 top-1.5 grid h-8 w-8 cursor-pointer place-items-center rounded-lg bg-black/70 text-white transition hover:bg-black/90"
          >
            <X size={14} />
          </button>
          <p className="truncate border-t border-white/8 px-2.5 py-1.5 font-mono text-[10px] text-[#8b909e]">{frame.file.name}</p>
        </div>
      ) : (
        <>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            className="peer sr-only"
            onChange={(e) => { accept(e.target.files?.[0]); e.target.value = ''; }}
          />
          <label
            htmlFor={inputId}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); accept(e.dataTransfer.files?.[0]); }}
            className="flex min-h-[72px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/15 bg-black/25 px-3 py-4 text-center transition hover:border-white/30 peer-focus-visible:border-[#bc9863] peer-focus-visible:ring-1 peer-focus-visible:ring-[#bc9863]/50"
          >
            <ImagePlus size={16} className="text-[#8b909e]" />
            <span className="text-[12px] text-[#8b8f99]">Drop an image or click to browse</span>
          </label>
        </>
      )}
    </div>
  );
}

export function DirectGenerator({ kind }: { kind: DirectKind }) {
  const uid = useId();
  const promptId = `${uid}-prompt`;
  const startFrameId = `${uid}-start-frame`;
  const endFrameId = `${uid}-end-frame`;

  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(DEFAULT_BY_KIND[kind]);
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const caps = getModelCaps(model);
  const [resolution, setResolution] = useState(caps.resolutionDefault ?? '');
  const [duration, setDuration] = useState(caps.durationDefault ?? '');
  const [aspect, setAspect] = useState(caps.aspectDefault ?? '');
  const [seed, setSeed] = useState(''); // '' = random; a number locks it
  const [lastSeed, setLastSeed] = useState<number | null>(null);
  /** null = untouched (omit from the request); true/false = explicit user pick */
  const [sound, setSound] = useState<boolean | null>(null);
  const [startFrame, setStartFrame] = useState<FramePick | null>(null);
  const [endFrame, setEndFrame] = useState<FramePick | null>(null);
  const [frameError, setFrameError] = useState<string | null>(null);

  /** Replace/clear a frame pick, revoking the old preview URL as it goes. */
  const pickStartFrame = (f: File | null) => {
    if (startFrame) URL.revokeObjectURL(startFrame.url);
    setStartFrame(f ? { file: f, url: URL.createObjectURL(f) } : null);
  };
  const pickEndFrame = (f: File | null) => {
    if (endFrame) URL.revokeObjectURL(endFrame.url);
    setEndFrame(f ? { file: f, url: URL.createObjectURL(f) } : null);
  };

  // When the model changes, snap format + frames + sound to what it supports
  // (state adjustment during render — no effect, no extra paint).
  const [prevModel, setPrevModel] = useState(model);
  if (prevModel !== model) {
    setPrevModel(model);
    const c = getModelCaps(model);
    setResolution(c.resolutions.includes(resolution) ? resolution : c.resolutionDefault ?? '');
    setDuration(c.durations.includes(duration) ? duration : c.durationDefault ?? '');
    setAspect(c.aspects.includes(aspect) ? aspect : c.aspectDefault ?? '');
    setSound(null); // back to the new model's default until the user picks
    if (!c.frames && startFrame) { URL.revokeObjectURL(startFrame.url); setStartFrame(null); }
    if (c.frames !== 'start-end' && endFrame) { URL.revokeObjectURL(endFrame.url); setEndFrame(null); }
    setFrameError(null);
  }

  const modelInfo = findModel(model)!;
  const showFrames = kind !== 'audio' && !!caps.frames;

  /* ── render job ── */
  const [status, setStatus] = useState<StatusState | 'IDLE'>('IDLE');
  const [uploading, setUploading] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | undefined>();
  const [outputKind, setOutputKind] = useState<OutputKind>(kind);
  const [queuePos, setQueuePos] = useState<number | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [showPlans, setShowPlans] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptsRef = useRef(0);
  const apiKeyRef = useRef(apiKey);
  const modelRef = useRef(model);
  const genMetaRef = useRef({ prompt: '', model: '' });
  useEffect(() => { apiKeyRef.current = apiKey; }, [apiKey]);
  useEffect(() => { modelRef.current = model; }, [model]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);
  useEffect(() => stopPolling, [stopPolling]);

  /** Errors that mean "this account needs a plan" get a See plans link. */
  const failWith = useCallback((msg: string, is402 = false) => {
    setError(msg);
    setShowPlans(is402 || /subscribe/i.test(msg));
    setStatus('ERROR');
  }, []);

  const poll = useCallback(
    (token: string) => {
      stopPolling();
      attemptsRef.current = 0;
      pollRef.current = setInterval(async () => {
        attemptsRef.current += 1;
        if (attemptsRef.current > MAX_POLLS) {
          failWith('Render timed out. Check your Fal dashboard, then try again.');
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
          if (!data.ok) { failWith(data.error ?? 'Render failed.', res.status === 402); stopPolling(); return; }
          setStatus(data.status);
          setQueuePos(data.queuePosition);
          if (data.output) setOutputKind(data.output);
          if (data.status === 'COMPLETED' && data.mediaUrl) {
            const url = data.mediaUrl;
            const out = data.output ?? kind;
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
          failWith('Lost contact with the render service.');
          stopPolling();
        }
      }, 2500);
    },
    [stopPolling, failWith, kind],
  );

  async function generate() {
    stopPolling();
    setError(null);
    setShowPlans(false);
    setMediaUrl(undefined);
    if (!apiKey) { setError('Connect your Fal.ai key first.'); return; }
    if (!prompt.trim()) { setError(`Describe the ${kind} you want to make.`); return; }
    if (modelInfo.status === 'preview' || modelInfo.wired === false) {
      setError(`${modelInfo.label} is coming soon. Pick an available model.`);
      return;
    }
    genMetaRef.current = { prompt: prompt.trim(), model: modelInfo.label };

    // Frames upload AT GENERATE TIME, straight to fal on the user's own key.
    let startImage: string | undefined;
    let endImage: string | undefined;
    if (showFrames && (startFrame || endFrame)) {
      setUploading(true);
      try {
        if (startFrame) startImage = await uploadToFal(startFrame.file, apiKey);
        if (caps.frames === 'start-end' && endFrame) endImage = await uploadToFal(endFrame.file, apiKey);
      } catch (e) {
        setUploading(false);
        failWith(e instanceof Error && e.message ? e.message : 'Could not upload the frame. Try a smaller image.');
        return;
      }
      setUploading(false);
    }

    setStatus('IN_QUEUE');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model,
          direct: true,
          negativePrompt: negativePrompt.trim() || undefined,
          resolution: resolution || undefined,
          duration: duration || undefined,
          aspect: aspect || undefined,
          seed: seed ? Number(seed) : undefined,
          startImage,
          endImage,
          // only when the user explicitly toggled the Sound chip; otherwise
          // omitted and the server applies the model's own default
          sound: sound === null ? undefined : sound,
          userApiKey: apiKey,
        }),
      });
      const data: GenerateAccepted | GenerateError = await res.json();
      if (!data.ok) { failWith(data.error, res.status === 402); return; }
      setOutputKind(data.output);
      poll(data.trackingToken);
    } catch {
      failWith('Could not reach the render service.');
    }
  }

  const pickGeneration = useCallback((g: Generation) => {
    stopPolling();
    setError(null);
    setShowPlans(false);
    setOutputKind(g.output);
    setMediaUrl(g.url);
    setStatus('COMPLETED');
  }, [stopPolling]);

  const rolling = status === 'IN_QUEUE' || status === 'IN_PROGRESS';
  const busy = uploading || rolling;
  const hasFormat = caps.resolutions.length > 0 || caps.durations.length > 0 || caps.aspects.length > 0 || caps.supportsSeed || !!caps.audioParam;
  const costLine = modelInfo.costHint
    ? `${modelInfo.costHint} · billed by fal on your key`
    : "compute billed by fal on your key at fal's rate";

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[400px_1fr] lg:gap-6">
      {/* ── LEFT: the composer sidebar (plain glass, minimal gold) ── */}
      <aside className="glass flex flex-col gap-5 rounded-2xl p-4 sm:p-5">
        {/* 1 · key */}
        <section>
          <div className="mb-2 font-mono text-[10px] tracking-[0.2em] text-[#8b8f99] uppercase">Connect your key</div>
          <ApiKeyVault onKeyChange={setApiKey} embedded />
        </section>

        {/* 2 · model */}
        <section className="border-t border-white/8 pt-5">
          <ModelPicker kind={kind} value={model} onChange={setModel} />
        </section>

        {/* 3 · frames — only for models that take a start/end/reference image */}
        {showFrames && (
          <section className="border-t border-white/8 pt-5">
            <div className="mb-3 font-mono text-[10px] tracking-[0.2em] text-[#8b8f99] uppercase">
              {kind === 'video' ? 'Frames' : 'Reference'}
            </div>
            <div className="flex flex-col gap-3">
              {kind === 'video' ? (
                <>
                  <FrameSlot
                    inputId={startFrameId}
                    label="Start frame"
                    sublabel="optional"
                    frame={startFrame}
                    onFile={pickStartFrame}
                    onIssue={setFrameError}
                  />
                  {caps.frames === 'start-end' && (
                    <FrameSlot
                      inputId={endFrameId}
                      label="End frame"
                      sublabel="optional"
                      frame={endFrame}
                      onFile={pickEndFrame}
                      onIssue={setFrameError}
                    />
                  )}
                </>
              ) : (
                <FrameSlot
                  inputId={startFrameId}
                  label="Reference image"
                  sublabel="optional, guides the generation"
                  frame={startFrame}
                  onFile={pickStartFrame}
                  onIssue={setFrameError}
                />
              )}
            </div>
            {frameError && (
              <p role="alert" className="mt-2 flex items-center gap-1.5 font-mono text-[10px] text-red-400">
                <AlertTriangle size={11} className="shrink-0" /> {frameError}
              </p>
            )}
            {(startFrame || endFrame) && (
              <p className="mt-2 font-mono text-[9px] leading-relaxed tracking-[0.04em] text-[#8b909e]">
                Uploads go straight to fal on your key. Never through our servers.
              </p>
            )}
          </section>
        )}

        {/* 4 · prompt — RAW by contract: what you type is the exact string the
            model receives on your fal account. The CMA DP engine only ever
            runs in Studio Pro. */}
        <section className="border-t border-white/8 pt-5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <label htmlFor={promptId} className="block font-mono text-[10px] tracking-[0.2em] text-[#8b8f99] uppercase">
              Your prompt
            </label>
            <span
              title="Your words go to the model exactly as typed — nothing added, nothing rewritten."
              className="rounded-md border border-white/10 bg-black/40 px-2 py-0.5 font-mono text-[9px] tracking-[0.16em] text-[#8b909e] uppercase"
            >
              Raw · sent as written
            </span>
          </div>
          <textarea
            id={promptId}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={kind === 'audio' ? AUDIO_HINTS[model] ?? PLACEHOLDER_BY_KIND.audio : PLACEHOLDER_BY_KIND[kind]}
            className="min-h-[128px] w-full resize-y overflow-y-auto rounded-xl border border-white/10 bg-black/40 p-3.5 text-[15px] leading-relaxed text-[#f4efe6] outline-none transition focus:border-[#bc9863] placeholder:text-[#8b909e]"
            style={{ maxHeight: 620 }}
          />
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-[#8b909e]">
            This page sends your prompt to the model <span className="text-[#cfcabf]">exactly as written</span> — no
            structure, no optimization, no studio recipe. Want a shot engineered like a DP would?{' '}
            <Link href="/studio" className="font-semibold text-[#bc9863] underline-offset-2 transition hover:text-[#e7cfa3] hover:underline">
              That&apos;s Studio Pro
            </Link>
            .
          </p>
          {kind === 'audio' && AUDIO_HINTS[model] && (
            <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-[#bc9863]/80">{AUDIO_HINTS[model]}</p>
          )}

          {/* only shown for models that actually honour a negative prompt */}
          {caps.supportsNegativePrompt && (
            <div className="mt-3">
              <label className="mb-1.5 block font-mono text-[9px] tracking-[0.18em] text-red-400 uppercase">
                Exclude <span className="normal-case tracking-normal text-red-400/70">(what to avoid, optional)</span>
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
        </section>

        {/* 5 · per-model output format — only what this model really accepts */}
        {hasFormat && (
          <section className="flex flex-col gap-3 border-t border-white/8 pt-5">
            <div className="font-mono text-[10px] tracking-[0.2em] text-[#8b8f99] uppercase">Output format</div>
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
            {caps.audioParam && (
              <div>
                <ChipRow
                  label="Sound"
                  options={[{ id: 'on', label: 'Sound on' }, { id: 'off', label: 'Sound off' }] as const}
                  value={(sound ?? caps.audioDefault ?? true) ? 'on' : 'off'}
                  onChange={(v) => setSound(v === 'on')}
                />
                <p className="mt-1.5 font-mono text-[9px] leading-relaxed tracking-[0.04em] text-[#8b909e]">
                  Sound changes the compute price on some models.
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
                    aria-label="Seed"
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
          </section>
        )}

        {/* 6 · cost + honesty + generate */}
        <section className="border-t border-white/8 pt-5">
          {/* cost transparency, right where the decision is made */}
          <div className="flex justify-center">
            <span className="inline-flex items-center rounded-lg border border-white/8 px-2.5 py-1 text-center font-mono text-[10px] leading-relaxed tracking-[0.04em] text-[#8b909e]">
              {costLine}
            </span>
          </div>

          <HonestNote compact className="mt-3" />

          <button
            type="button"
            onClick={generate}
            disabled={busy || !apiKey}
            aria-disabled={busy || !apiKey}
            aria-busy={busy}
            title={!apiKey ? 'Connect your Fal.ai key first' : undefined}
            className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-5 py-3.5 text-[15px] font-semibold text-black shadow-[0_10px_30px_rgba(188,152,99,0.3)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles size={17} />
            {!apiKey ? 'Connect a key to generate' : uploading ? 'Uploading frames…' : rolling ? 'Rolling…' : `Generate ${kind}`}
          </button>

          {error && (
            <div role="alert" className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-500/30 bg-red-500/8 px-3 py-2">
              <span className="flex min-w-0 items-center gap-2 font-mono text-[11px] text-red-300">
                <AlertTriangle size={13} className="shrink-0" /> {error}
              </span>
              {showPlans && (
                <Link
                  href="/pricing"
                  className="inline-flex flex-none cursor-pointer items-center gap-1.5 rounded-lg bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-3 py-1.5 text-[11px] font-semibold text-black transition hover:brightness-105"
                >
                  See plans <ArrowRight size={12} />
                </Link>
              )}
            </div>
          )}
        </section>
      </aside>

      {/* ── RIGHT: the result canvas ── */}
      <div className="flex min-w-0 flex-col gap-4">
        <ScopeViewer
          status={status}
          mediaUrl={mediaUrl}
          output={outputKind}
          queuePosition={queuePos}
          barPct={0}
          aspectLabel={`${kind.toUpperCase()} · DIRECT`}
          engineLabel={modelInfo.label}
          promptLabel={prompt.trim() || undefined}
          onMediaError={() => {
            failWith('The finished render could not be loaded (the Fal URL may have expired).');
          }}
          onDownload={
            mediaUrl
              ? () => downloadRender(mediaUrl, renderFilename(prompt.trim() || 'render', outputKind, modelInfo.label))
              : undefined
          }
        />

        {/* prominent download the moment a render finishes */}
        {status === 'COMPLETED' && mediaUrl && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => downloadRender(mediaUrl, renderFilename(prompt.trim() || 'render', outputKind, modelInfo.label))}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-5 py-2.5 text-[13px] font-semibold text-black shadow-[0_8px_24px_rgba(188,152,99,0.3)] transition hover:brightness-105"
            >
              <Download size={15} /> Download this render
            </button>
          </div>
        )}

        {/* recent work + the My Files library */}
        <GenerationStrip onPick={pickGeneration} />
      </div>
    </div>
  );
}
