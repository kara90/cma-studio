'use client';

/**
 * AudioStudio — the dedicated /audio experience ("Signal Deck").
 *
 * Audio is not video: this page is built around SOUND — waveform cards you can
 * play in place, an animated live-render equalizer, and a bottom composer dock
 * (model · prompt · voice/length · generate) instead of the video console's
 * sidebar. Inspired by the best audio tools, engineered our way.
 *
 * Wiring is the platform's existing, locked contract — POST /api/generate
 * (direct raw path) → poll /api/status → R2 library — identical to the other
 * generators; only the surface is new. The poll snapshots the model id at
 * generate time, so switching models mid-render can never orphan a job here.
 *
 * Every model in the picker was verified ACTIVE on fal (registry + OpenAPI,
 * 2026-07-18); voice lists are enum-verified where fal publishes one.
 */
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle, AudioLines, Check, ChevronDown, ChevronUp, Download, Loader2,
  Mic2, Music, Pause, Play, RotateCcw, Sparkles, Star, Waves,
} from 'lucide-react';
import { AUDIO_MODELS, findModel, type ModelOption } from '@/lib/modelRegistry';
import { getModelCaps } from '@/lib/modelCaps';
import { ApiKeyVault } from '@/components/studio/ApiKeyVault';
import { CostEstimateChip } from '@/components/CostEstimateChip';
import { addGeneration, useGenerations, type Generation } from '@/lib/generationStore';
import { downloadRender, renderFilename } from '@/lib/download';
import { loadWave, drawWave, seededWave, type WavePeaks } from '@/lib/audioWave';
import type { GenerateAccepted, GenerateError, StatusResult, StatusState } from '@/lib/vcpTypes';

const MAX_POLLS = 168; // × 2.5s = 7 minutes, same budget as the other generators

/* ── lanes ── */
type Lane = 'voice' | 'music' | 'sfx';
const LANES: { id: Lane; label: string; icon: typeof Mic2 }[] = [
  { id: 'voice', label: 'Voice', icon: Mic2 },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'sfx', label: 'SFX & Design', icon: Waves },
];

/** Per-model prompt guidance — each model listens differently. */
const AUDIO_HINTS: Record<string, string> = {
  'eleven-v3': 'Write the exact line to be spoken. Emotion reads from the words themselves…',
  'elevenlabs-multilingual-v2': 'Write the narration exactly as it should be read…',
  'minimax-speech-2-8-hd': 'Write the line to be narrated, plain and clean…',
  'kokoro-american-english': 'Write the line to be spoken…',
  'elevenlabs-music': 'Describe the track: genre, mood, instruments, tempo…',
  lyria2: 'Describe the score: instruments, mood, pace, space…',
  'ace-step': 'Style tags, comma separated: cinematic, dark strings, 90 bpm…',
  'elevenlabs-sfx-v2': 'Describe the sound: one heavy metal door slams shut in a cathedral…',
  'stable-audio-25': 'Describe the effect, foley or texture you need…',
};

/** Curated ElevenLabs voice names for the free-string voice models (fal passes
 * the name through; "Rachel" is the schema-verified default). */
const ELEVEN_VOICES = ['Rachel', 'Aria', 'Sarah', 'George', 'Charlie', 'Callum', 'Charlotte', 'Alice', 'Brian', 'Daniel', 'Lily', 'Jessica'];

function voiceLabel(v: string): string {
  if (/^af_/.test(v)) return `${v.slice(3)[0].toUpperCase()}${v.slice(4)} · F`;
  if (/^am_/.test(v)) return `${v.slice(3)[0].toUpperCase()}${v.slice(4)} · M`;
  return v.replace(/_/g, ' ');
}
function durLabel(caps: ReturnType<typeof getModelCaps>, v: string): string {
  if (v === 'auto') return 'Auto';
  const n = Number(v);
  if (caps.durationParam === 'music_length_ms') return `${Math.round(n / 1000)}s`;
  return `${n}s`;
}

/** label → lane, id → lane (history stores labels; the library stores ids). */
const LANE_BY_KEY: Record<string, Lane> = {};
for (const m of AUDIO_MODELS) {
  if (m.audioGroup) {
    LANE_BY_KEY[m.id] = m.audioGroup;
    LANE_BY_KEY[m.label] = m.audioGroup;
  }
}

/* ── one playable waveform card ── */
interface AudioItem {
  id: string;
  url: string;
  prompt: string;
  model: string; // label or id
  createdAt?: number;
  source: 'session' | 'library';
  daysLeft?: number;
}

const WaveCanvas = memo(function WaveCanvas({
  url, seedKey, progress, active, onSeek,
}: {
  url: string; seedKey: string; progress: number; active: boolean; onSeek: (f: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [wave, setWave] = useState<WavePeaks>(() => seededWave(seedKey));

  // Decode lazily, only once the card is near the viewport.
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    let alive = true;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          void loadWave(url, seedKey).then((w) => { if (alive) setWave(w); });
        }
      },
      { rootMargin: '250px 0px' },
    );
    io.observe(el);
    return () => { alive = false; io.disconnect(); };
  }, [url, seedKey]);

  // Redraw on wave/progress/resize.
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const draw = () => drawWave(el, wave.peaks, {
      progress: active ? progress : 0,
      played: '#e7cfa3',
      rest: active ? 'rgba(188,152,99,0.4)' : 'rgba(188,152,99,0.3)',
      cursor: '#f4efe6',
    });
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(el);
    return () => ro.disconnect();
  }, [wave, progress, active]);

  return (
    <canvas
      ref={canvasRef}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        onSeek(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
      }}
      className="h-20 w-full cursor-pointer sm:h-24"
      aria-hidden="true"
    />
  );
});

const AudioCard = memo(function AudioCard({
  item, playing, progress, onToggle, onSeek, onReuse,
}: {
  item: AudioItem;
  playing: boolean;
  progress: number;
  onToggle: (item: AudioItem) => void;
  onSeek: (item: AudioItem, f: number) => void;
  onReuse: (item: AudioItem) => void;
}) {
  const modelMeta = findModel(item.model);
  const displayModel = modelMeta?.label ?? item.model;
  return (
    <div className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-[#0a0b10] transition ${playing ? 'border-[#bc9863]/60 shadow-[0_0_40px_-18px_rgba(188,152,99,0.5)]' : 'border-white/8 hover:border-[#bc9863]/35'}`}>
      <div className="relative px-3 pt-3">
        <WaveCanvas url={item.url} seedKey={item.id} progress={progress} active={playing} onSeek={(f) => onSeek(item, f)} />
        {/* play / pause floats over the wave */}
        <button
          type="button"
          onClick={() => onToggle(item)}
          aria-label={playing ? 'Pause' : 'Play'}
          className={`absolute left-5 top-1/2 grid h-10 w-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full border backdrop-blur-md transition ${
            playing
              ? 'border-[#bc9863] bg-[#bc9863]/25 text-[#f4efe6] opacity-100'
              : 'border-white/20 bg-black/55 text-[#e7cfa3] opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
          }`}
        >
          {playing ? <Pause size={16} /> : <Play size={16} className="translate-x-[1px]" />}
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-4 pb-3.5 pt-2">
        <p className="line-clamp-2 min-h-[2.4em] text-[12px] leading-snug text-[#c7c2b8]">{item.prompt || 'Untitled sound'}</p>
        <div className="mt-auto flex items-center justify-between gap-2">
          {/* LED-style model tag — the audio deck's signature */}
          <span className="truncate font-mono text-[10px] font-semibold tracking-[0.34em] text-[#bc9863] uppercase [text-shadow:0_0_12px_rgba(188,152,99,0.55)]">
            {displayModel}
          </span>
          <span className="flex flex-none items-center gap-2">
            {item.source === 'library' && typeof item.daysLeft === 'number' && (
              <span className="rounded border border-white/12 px-1 py-0.5 font-mono text-[8px] tracking-[0.1em] text-[#8b909e] uppercase">{item.daysLeft}d</span>
            )}
            <button
              type="button"
              onClick={() => onReuse(item)}
              title="Reuse this prompt"
              aria-label="Reuse this prompt"
              className="cursor-pointer text-[#8b909e] opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100 hover:text-[#e7cfa3]"
            >
              <RotateCcw size={13} />
            </button>
            <button
              type="button"
              onClick={() => void downloadRender(item.url, renderFilename(item.prompt || 'audio', 'audio', displayModel))}
              title="Download"
              aria-label="Download"
              className="cursor-pointer text-[#8b909e] opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100 hover:text-[#e7cfa3]"
            >
              <Download size={13} />
            </button>
          </span>
        </div>
      </div>
    </div>
  );
});

/* ── the rendering card: a live equalizer while fal works ── */
function RenderingCard({ status, queuePos, modelLabel, reduce }: { status: StatusState; queuePos?: number; modelLabel: string; reduce: boolean }) {
  const bars = 28;
  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-[#bc9863]/50 bg-[#0a0b10] shadow-[0_0_50px_-16px_rgba(188,152,99,0.55)]">
      <div className="flex h-20 items-center justify-center gap-[3px] px-5 sm:h-24">
        {Array.from({ length: bars }, (_, i) => (
          <span
            key={i}
            className="w-[3px] rounded-full bg-gradient-to-b from-[#e7cfa3] to-[#bc9863]"
            style={
              reduce
                ? { height: `${18 + 40 * Math.abs(Math.sin(i * 0.9))}%` }
                : { height: '16%', animation: `cma-eq 1.1s ease-in-out ${(i % 7) * 0.11}s infinite alternate` }
            }
          />
        ))}
      </div>
      <div className="flex items-center justify-between px-4 pb-3.5 pt-1">
        <span className="flex items-center gap-2 font-mono text-[10.5px] tracking-[0.14em] text-[#e7cfa3] uppercase">
          <Loader2 size={12} className="animate-spin" />
          {status === 'IN_QUEUE' ? (typeof queuePos === 'number' ? `In queue · #${queuePos + 1}` : 'In queue') : 'Rendering'}
        </span>
        <span className="truncate font-mono text-[10px] tracking-[0.3em] text-[#bc9863] uppercase">{modelLabel}</span>
      </div>
    </div>
  );
}

/* ── empty-state idle wave ── */
function IdleWave({ reduce }: { reduce: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let t = 0;
    const draw = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = el.clientWidth, h = el.clientHeight;
      if (el.width !== w * dpr || el.height !== h * dpr) { el.width = w * dpr; el.height = h * dpr; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const mid = h / 2;
      for (const [amp, freq, speed, color, lw] of [
        [0.32, 0.011, 1.0, 'rgba(231,207,163,0.75)', 1.6],
        [0.2, 0.019, -0.7, 'rgba(188,152,99,0.4)', 1.2],
        [0.42, 0.006, 0.45, 'rgba(188,152,99,0.2)', 1],
      ] as const) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const envelope = Math.sin((x / w) * Math.PI) ** 1.4;
          const y = mid + Math.sin(x * freq + t * speed) * Math.sin(x * freq * 0.37 + t * speed * 1.7) * (h * amp) * envelope;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.stroke();
      }
      t += 0.035;
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [reduce]);
  return <canvas ref={ref} className="h-36 w-full" aria-hidden="true" />;
}

/* ── the model menu (opens UP from the dock) ── */
function ModelMenu({ value, onPick, onClose }: { value: string; onPick: (id: string) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  return (
    <div ref={ref} className="absolute bottom-full left-0 z-10 mb-2 w-[320px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-[#bc9863]/30 bg-[#0b0d12]/98 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.95)] backdrop-blur-xl">
      <div className="max-h-[52vh] overflow-y-auto p-2">
        {LANES.map((lane) => {
          const models = AUDIO_MODELS.filter((m) => m.audioGroup === lane.id);
          if (!models.length) return null;
          return (
            <div key={lane.id} className="mb-1.5">
              <div className="flex items-center gap-1.5 px-2.5 pb-1 pt-2 font-mono text-[9px] tracking-[0.22em] text-[#8b909e] uppercase">
                <lane.icon size={11} className="text-[#bc9863]" /> {lane.label}
              </div>
              {models.map((m, i) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onPick(m.id)}
                  className={`w-full cursor-pointer rounded-lg px-2.5 py-2 text-left transition ${m.id === value ? 'bg-[#bc9863]/12' : 'hover:bg-white/5'}`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`min-w-0 flex-1 truncate font-[family-name:var(--font-sora)] text-[13px] font-semibold ${m.id === value ? 'text-[#e7cfa3]' : 'text-[#f4efe6]'}`}>
                      {m.label}
                    </span>
                    {i === 0 && (
                      <span className="inline-flex flex-none items-center gap-1 rounded border border-[#bc9863]/40 bg-[#bc9863]/10 px-1.5 py-0.5 font-mono text-[8px] tracking-[0.1em] text-[#e7cfa3] uppercase">
                        <Star size={8} /> Top pick
                      </span>
                    )}
                    {m.id === value && <Check size={13} className="flex-none text-[#bc9863]" />}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] leading-snug text-[#8b8f99]">{m.blurb}</span>
                  <span className="mt-0.5 block font-mono text-[9px] tracking-[0.08em] text-[#8b909e]">{m.provider}</span>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════ THE STUDIO ══════════════════════════ */

interface LibFile { id: string; output: string; model: string; note?: string; daysLeft?: number; createdAt?: string }
interface FilesResult { ok: boolean; files?: LibFile[]; retentionDays?: number; storageOffline?: boolean }

export function AudioStudio() {
  const reduce = useReducedMotion() ?? false;
  const localAll = useGenerations();
  const localAudio = useMemo(() => localAll.filter((g) => g.output === 'audio'), [localAll]);

  /* composer state */
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('eleven-v3');
  const [prompt, setPrompt] = useState('');
  const caps = getModelCaps(model);
  const [voice, setVoice] = useState<string>(caps.voiceDefault ?? '');
  const [duration, setDuration] = useState<string>(caps.durationDefault ?? '');
  const [instrumental, setInstrumental] = useState<boolean | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lane, setLane] = useState<Lane | 'all'>('all');

  // snap voice/duration to the new model's caps on switch
  const [prevModel, setPrevModel] = useState(model);
  if (prevModel !== model) {
    setPrevModel(model);
    const c = getModelCaps(model);
    setVoice(c.voiceDefault ?? '');
    setDuration(c.durations.includes(duration) ? duration : c.durationDefault ?? '');
    setInstrumental(null);
  }
  const modelInfo = findModel(model)!;

  /* render job */
  const [status, setStatus] = useState<StatusState | 'IDLE'>('IDLE');
  const [queuePos, setQueuePos] = useState<number | undefined>();
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptsRef = useRef(0);
  const apiKeyRef = useRef(apiKey);
  useEffect(() => { apiKeyRef.current = apiKey; }, [apiKey]);
  // Snapshot at generate time: polling always follows the JOB's model, never
  // the picker's current selection.
  const jobRef = useRef({ prompt: '', modelId: '', modelLabel: '' });

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);
  useEffect(() => stopPolling, [stopPolling]);

  const rolling = status === 'IN_QUEUE' || status === 'IN_PROGRESS';

  /* library */
  const [library, setLibrary] = useState<LibFile[]>([]);
  const loadLibrary = useCallback(async () => {
    try {
      const res = await fetch('/api/files');
      const data: FilesResult = await res.json();
      if (data.ok && data.files) setLibrary(data.files.filter((f) => f.output === 'audio'));
    } catch { /* signed out — session cards still work */ }
  }, []);
  useEffect(() => { void loadLibrary(); }, [loadLibrary]);

  /* playback — one shared element for the whole deck */
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(0);

  const stopPlayback = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    audioRef.current?.pause();
    setPlayingId(null);
    setProgress(0);
  }, []);
  useEffect(() => () => { cancelAnimationFrame(rafRef.current); audioRef.current?.pause(); }, []);

  const togglePlay = useCallback((item: AudioItem) => {
    let el = audioRef.current;
    if (!el) {
      el = new Audio();
      el.preload = 'auto';
      audioRef.current = el;
    }
    if (playingId === item.id) {
      stopPlayback();
      return;
    }
    cancelAnimationFrame(rafRef.current);
    el.src = item.url;
    el.currentTime = 0;
    setPlayingId(item.id);
    setProgress(0);
    const tick = () => {
      const a = audioRef.current;
      if (!a) return;
      setProgress(a.duration > 0 ? a.currentTime / a.duration : 0);
      rafRef.current = requestAnimationFrame(tick);
    };
    el.onended = () => { cancelAnimationFrame(rafRef.current); setPlayingId(null); setProgress(0); };
    void el.play().then(() => { rafRef.current = requestAnimationFrame(tick); }).catch(() => setPlayingId(null));
  }, [playingId, stopPlayback]);

  const seek = useCallback((item: AudioItem, f: number) => {
    const el = audioRef.current;
    if (playingId === item.id && el && el.duration > 0) {
      el.currentTime = f * el.duration;
      setProgress(f);
    } else {
      togglePlay(item);
    }
  }, [playingId, togglePlay]);

  /* generate + poll (contract mirrors the other generators) */
  const failWith = useCallback((msg: string) => { setError(msg); setStatus('ERROR'); }, []);

  const poll = useCallback((token: string) => {
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
            model: jobRef.current.modelId, // job snapshot, never the live picker
            promptNote: jobRef.current.prompt.slice(0, 200),
          }),
        });
        const data: StatusResult = await res.json();
        if (!data.ok) { failWith(data.error ?? 'Render failed.'); stopPolling(); return; }
        setStatus(data.status);
        setQueuePos(data.queuePosition);
        if (data.status === 'COMPLETED' && data.mediaUrl) {
          const meta = { ...jobRef.current };
          addGeneration({ url: data.mediaUrl, output: 'audio', prompt: meta.prompt, model: meta.modelLabel });
          setStatus('IDLE');
          stopPolling();
          // the R2 copy is written during this same poll — refresh the library
          setTimeout(() => void loadLibrary(), 1200);
        }
      } catch {
        failWith('Lost contact with the render service.');
        stopPolling();
      }
    }, 2500);
  }, [stopPolling, failWith, loadLibrary]);

  async function generate() {
    stopPolling();
    setError(null);
    if (!apiKey) { setError('Connect your Fal.ai key first.'); return; }
    if (!prompt.trim()) { setError('Describe the sound you want to make.'); return; }
    jobRef.current = { prompt: prompt.trim(), modelId: model, modelLabel: modelInfo.label };
    setStatus('IN_QUEUE');
    setQueuePos(undefined);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model,
          direct: true,
          duration: duration && duration !== 'auto' ? duration : undefined,
          voice: caps.voiceParam ? (voice || undefined) : undefined,
          sound: caps.audioParam ? (instrumental === null ? undefined : instrumental) : undefined,
          userApiKey: apiKey,
        }),
      });
      const data: GenerateAccepted | GenerateError = await res.json();
      if (!data.ok) { failWith(data.error); return; }
      poll(data.trackingToken);
    } catch {
      failWith('Could not reach the render service.');
    }
  }

  /* card sets */
  const laneOf = (key: string): Lane | undefined => LANE_BY_KEY[key];
  const inLane = (key: string) => lane === 'all' || laneOf(key) === lane;
  const sessionItems: AudioItem[] = useMemo(
    () => localAudio
      .filter((g) => inLane(g.model))
      .map((g: Generation) => ({ id: g.id, url: g.url, prompt: g.prompt, model: g.model, createdAt: g.createdAt, source: 'session' as const })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [localAudio, lane],
  );
  const libraryItems: AudioItem[] = useMemo(
    () => library
      .filter((f) => inLane(f.model))
      .map((f) => ({ id: `lib-${f.id}`, url: `/api/files/${f.id}`, prompt: f.note ?? '', model: f.model, source: 'library' as const, daysLeft: f.daysLeft })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [library, lane],
  );
  const empty = sessionItems.length === 0 && libraryItems.length === 0 && !rolling;

  return (
    <div className="pb-44">
      {/* equalizer keyframes for the live-render card */}
      <style>{`@keyframes cma-eq { from { height: 12%; } to { height: 88%; } }`}</style>

      {/* ── deck header: lanes + key ── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] p-1">
          {([{ id: 'all' as const, label: 'All', icon: AudioLines }, ...LANES]).map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLane(l.id)}
              aria-pressed={lane === l.id}
              className={`inline-flex min-h-[34px] cursor-pointer items-center gap-1.5 rounded-full px-3.5 font-mono text-[10.5px] tracking-[0.16em] uppercase transition ${
                lane === l.id ? 'bg-[#bc9863]/18 text-[#e7cfa3]' : 'text-[#8b909e] hover:text-[#c7c2b8]'
              }`}
            >
              <l.icon size={12} /> {l.label}
            </button>
          ))}
        </div>
        <div className="w-full max-w-sm">
          <ApiKeyVault onKeyChange={setApiKey} embedded />
        </div>
      </div>

      {/* ── the deck ── */}
      {empty ? (
        <div className="rounded-3xl border border-white/8 bg-[#0a0b10] px-6 py-14 text-center">
          <IdleWave reduce={reduce} />
          <p className="mt-6 font-[family-name:var(--font-sora)] text-[17px] font-semibold text-[#f4efe6]">
            Your soundstage is quiet.
          </p>
          <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-[#8b8f99]">
            Voiceover, score or sound design — describe it below, pick a model, and the render lands here as a living
            waveform. Compute runs on your own fal.ai key.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {(sessionItems.length > 0 || rolling) && (
            <section>
              <h2 className="mb-3 font-mono text-[10px] tracking-[0.24em] text-[#8b909e] uppercase">This session</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rolling && <RenderingCard status={status as StatusState} queuePos={queuePos} modelLabel={jobRef.current.modelLabel} reduce={reduce} />}
                {sessionItems.map((it) => (
                  <AudioCard
                    key={it.id}
                    item={it}
                    playing={playingId === it.id}
                    progress={playingId === it.id ? progress : 0}
                    onToggle={togglePlay}
                    onSeek={seek}
                    onReuse={(x) => setPrompt(x.prompt)}
                  />
                ))}
              </div>
            </section>
          )}
          {libraryItems.length > 0 && (
            <section>
              <h2 className="mb-3 font-mono text-[10px] tracking-[0.24em] text-[#8b909e] uppercase">Your library</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {libraryItems.map((it) => (
                  <AudioCard
                    key={it.id}
                    item={it}
                    playing={playingId === it.id}
                    progress={playingId === it.id ? progress : 0}
                    onToggle={togglePlay}
                    onSeek={seek}
                    onReuse={(x) => setPrompt(x.prompt)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mx-auto mt-6 flex w-fit items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/8 px-4 py-2.5 font-mono text-[11.5px] leading-relaxed text-red-300">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {error}
        </p>
      )}

      {/* ── the composer dock ── */}
      <div className="fixed inset-x-0 bottom-4 z-[60] px-4">
        <div className="mx-auto max-w-4xl rounded-2xl border border-[#bc9863]/30 bg-[#0b0d12]/95 p-3 shadow-[0_24px_80px_-16px_rgba(0,0,0,0.9)] backdrop-blur-xl">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end">
            {/* model selector */}
            <div className="relative flex-none">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-expanded={menuOpen}
                className="flex min-h-[46px] w-full cursor-pointer items-center gap-2.5 rounded-xl border border-[#bc9863]/30 bg-[#bc9863]/[0.06] px-3 py-2 text-left transition hover:border-[#bc9863]/55 sm:w-[190px]"
              >
                <span className="grid h-8 w-8 flex-none place-items-center rounded-lg border border-[#bc9863]/30 bg-[#bc9863]/10 text-[#bc9863]">
                  {(() => { const L = LANES.find((l) => l.id === modelInfo.audioGroup); const I = L?.icon ?? AudioLines; return <I size={15} />; })()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-[family-name:var(--font-sora)] text-[12.5px] font-semibold text-[#f4efe6]">{modelInfo.label}</span>
                  <span className="block font-mono text-[8.5px] tracking-[0.14em] text-[#8b909e] uppercase">{LANES.find((l) => l.id === modelInfo.audioGroup)?.label ?? 'Audio'}</span>
                </span>
                {menuOpen ? <ChevronDown size={14} className="flex-none text-[#8b8f99]" /> : <ChevronUp size={14} className="flex-none text-[#8b8f99]" />}
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: 6 }} transition={{ duration: 0.18 }}>
                    <ModelMenu value={model} onPick={(id) => { setModel(id); setMenuOpen(false); }} onClose={() => setMenuOpen(false)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* prompt */}
            <div className="min-w-0 flex-1">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!rolling) void generate(); } }}
                rows={1}
                placeholder={AUDIO_HINTS[model] ?? 'Describe the sound you imagine…'}
                aria-label="Describe the audio to generate"
                className="max-h-28 min-h-[46px] w-full resize-none rounded-xl border border-white/10 bg-black/50 px-3.5 py-3 text-[13.5px] leading-snug text-[#f4efe6] outline-none transition [field-sizing:content] placeholder:text-[#8b909e] focus:border-[#bc9863]"
              />
            </div>

            {/* per-model controls */}
            {caps.voiceParam && (
              <label className="flex-none">
                <span className="mb-1 block font-mono text-[8.5px] tracking-[0.18em] text-[#8b909e] uppercase">Voice</span>
                <select
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  className="min-h-[46px] w-full cursor-pointer rounded-xl border border-white/10 bg-black/50 px-2.5 text-[12.5px] text-[#f4efe6] outline-none transition focus:border-[#bc9863] sm:w-[130px]"
                >
                  {(caps.voices?.length ? caps.voices : ELEVEN_VOICES).map((v) => (
                    <option key={v} value={v} className="bg-[#0b0d12]">{voiceLabel(v)}</option>
                  ))}
                </select>
              </label>
            )}
            {caps.durationParam && caps.durations.length > 0 && (
              <label className="flex-none">
                <span className="mb-1 block font-mono text-[8.5px] tracking-[0.18em] text-[#8b909e] uppercase">Length</span>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="min-h-[46px] w-full cursor-pointer rounded-xl border border-white/10 bg-black/50 px-2.5 text-[12.5px] text-[#f4efe6] outline-none transition focus:border-[#bc9863] sm:w-[92px]"
                >
                  {caps.durations.map((d) => (
                    <option key={d} value={d} className="bg-[#0b0d12]">{durLabel(caps, d)}</option>
                  ))}
                </select>
              </label>
            )}
            {caps.audioParam === 'force_instrumental' && (
              <button
                type="button"
                onClick={() => setInstrumental((v) => (v === true ? false : true))}
                aria-pressed={instrumental === true}
                className={`min-h-[46px] flex-none cursor-pointer rounded-xl border px-3 font-mono text-[10px] tracking-[0.12em] uppercase transition ${
                  instrumental === true ? 'border-[#bc9863] bg-[#bc9863]/15 text-[#e7cfa3]' : 'border-white/10 text-[#8b909e] hover:border-[#bc9863]/40'
                }`}
                title="Instrumental only — no vocals"
              >
                Instrumental
              </button>
            )}

            {/* generate */}
            <button
              type="button"
              onClick={() => void generate()}
              disabled={rolling || !apiKey}
              aria-disabled={rolling || !apiKey}
              title={!apiKey ? 'Connect your Fal.ai key first' : undefined}
              className="inline-flex min-h-[46px] flex-none cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-5 text-[13.5px] font-semibold text-black shadow-[0_10px_30px_rgba(188,152,99,0.35)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {rolling ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {rolling ? 'Rolling…' : 'Generate'}
            </button>
          </div>

          {/* cost honesty line */}
          <div className="mt-2 flex items-center justify-center">
            <CostEstimateChip
              modelId={model}
              falKey={apiKey}
              durationSeconds={
                duration && duration !== 'auto'
                  ? caps.durationParam === 'music_length_ms' ? Number(duration) / 1000 : Number(duration)
                  : undefined
              }
              fallback={<span className="font-mono text-[10px] text-[#8b909e]">compute billed by fal on your key at fal&apos;s rate</span>}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
