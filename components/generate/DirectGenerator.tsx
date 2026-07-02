'use client';

/**
 * DirectGenerator — the PLAIN generator behind /video, /image and /audio.
 * The user's own prompt goes to the model exactly as written (server `direct`
 * mode): no studio recipe, no camera package, no compiled cinematography.
 * One kind per page; the ModelPicker only offers models of that kind.
 *
 * Wire protocol mirrors StudioConsole exactly:
 *   POST /api/generate { prompt, model, direct:true, …format, userApiKey }
 *   → { ok, trackingToken, output } → poll POST /api/status every 2500ms
 *   (MAX_POLLS cap) → COMPLETED gives mediaUrl (+ optional seed, stored).
 */
import { useEffect, useRef, useState, useCallback, useId } from 'react';
import Link from 'next/link';
import { Sparkles, AlertTriangle, Download, ArrowRight } from 'lucide-react';
import { downloadRender, renderFilename } from '@/lib/download';
import { findModel } from '@/lib/modelRegistry';
import { getModelCaps, fmtRes, fmtDur, fmtAspect } from '@/lib/modelCaps';
import { ModelPicker } from '@/components/studio/ModelPicker';
import { ApiKeyVault } from '@/components/studio/ApiKeyVault';
import { ScopeViewer } from '@/components/studio/ScopeViewer';
import { GenerationStrip } from '@/components/studio/GenerationStrip';
import { HonestNote } from '@/components/marketing/HonestNote';
import { addGeneration, type Generation } from '@/lib/generationStore';
import { makeThumb } from '@/lib/makeThumb';
import type { GenerateAccepted, GenerateError, StatusResult, StatusState, OutputKind } from '@/lib/vcpTypes';

const MAX_POLLS = 168;
const CARD = 'glass glass-gold rounded-2xl';

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
  options: readonly { id: T; label: string }[];
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
            onClick={() => onChange(o.id)}
            aria-pressed={value === o.id}
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

export function DirectGenerator({ kind }: { kind: DirectKind }) {
  const promptId = useId();
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
  // When the model changes, snap format to what the new model supports.
  useEffect(() => {
    const c = getModelCaps(model);
    setResolution((r) => (c.resolutions.includes(r) ? r : c.resolutionDefault ?? ''));
    setDuration((d) => (c.durations.includes(d) ? d : c.durationDefault ?? ''));
    setAspect((a) => (c.aspects.includes(a) ? a : c.aspectDefault ?? ''));
  }, [model]);

  const modelInfo = findModel(model)!;

  /* ── render job ── */
  const [status, setStatus] = useState<StatusState | 'IDLE'>('IDLE');
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

  const busy = status === 'IN_QUEUE' || status === 'IN_PROGRESS';
  const hasFormat = caps.resolutions.length > 0 || caps.durations.length > 0 || caps.aspects.length > 0 || caps.supportsSeed;
  const costLine = modelInfo.costHint
    ? `${modelInfo.costHint} · billed by fal on your key`
    : "compute billed by fal on your key at fal's rate";

  return (
    <div className="flex flex-col gap-4">
      {/* ── result first: the scope monitor ── */}
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

      {/* ── the composer ── */}
      <div className={`${CARD} p-4 sm:p-5`}>
        <label htmlFor={promptId} className="mb-2 block font-mono text-[10px] tracking-[0.2em] text-[#8b8f99] uppercase">
          Your prompt
        </label>
        <textarea
          id={promptId}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={kind === 'audio' ? AUDIO_HINTS[model] ?? PLACEHOLDER_BY_KIND.audio : PLACEHOLDER_BY_KIND[kind]}
          className="min-h-[128px] w-full resize-y overflow-y-auto rounded-xl border border-white/10 bg-black/40 p-3.5 text-[15px] leading-relaxed text-[#f4efe6] outline-none transition focus:border-[#bc9863] placeholder:text-[#8b909e]"
          style={{ maxHeight: 620 }}
        />
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-[#8b909e]">
          Sent to the model exactly as written. No studio recipe is added on this page.
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

        {/* per-model output format — only the options this model really accepts */}
        {hasFormat && (
          <div className="mt-4 flex flex-col gap-3 border-t border-[#bc9863]/12 pt-4">
            <div className="font-mono text-[10px] tracking-[0.2em] text-[#8b8f99] uppercase">Output format</div>
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
          </div>
        )}

        {/* key + model — the vault sits right above the picker */}
        <div className="mt-4 flex flex-col gap-4 border-t border-[#bc9863]/12 pt-4">
          <div>
            <div className="mb-2 font-mono text-[10px] tracking-[0.2em] text-[#8b8f99] uppercase">Connect your key</div>
            <ApiKeyVault onKeyChange={setApiKey} embedded />
          </div>
          <ModelPicker kind={kind} value={model} onChange={setModel} />
        </div>

        {/* generate */}
        <button
          type="button"
          onClick={generate}
          disabled={busy || !apiKey}
          aria-disabled={busy || !apiKey}
          title={!apiKey ? 'Connect your Fal.ai key first' : undefined}
          className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-5 py-3.5 text-[15px] font-semibold text-black shadow-[0_10px_30px_rgba(188,152,99,0.3)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Sparkles size={17} />
          {busy ? 'Rolling…' : !apiKey ? 'Connect a key to generate' : `Generate ${kind}`}
        </button>

        {/* cost transparency, right where the decision is made */}
        <div className="mt-2.5 flex justify-center">
          <span className="inline-flex items-center rounded-lg border border-white/8 px-2.5 py-1 font-mono text-[10px] tracking-[0.04em] text-[#8b909e]">
            {costLine}
          </span>
        </div>

        <HonestNote compact className="mt-3" />

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
      </div>

      {/* recent work + the My Files library */}
      <GenerationStrip onPick={pickGeneration} />
    </div>
  );
}
