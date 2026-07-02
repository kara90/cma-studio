'use client';

/**
 * ScopeViewer — the cinematic output monitor. 16:9 or letterboxed 2.39:1 scope
 * (driven by the lens), a rule-of-thirds overlay, and a purpose-built render
 * state: a filmstrip of shimmering frame cells, an indeterminate progress bar,
 * and a cycling pipeline read-out — so the long wait feels like a render, not
 * a spinner. Crossfades to the finished clip.
 */
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Download, AudioLines } from 'lucide-react';
import type { StatusState, OutputKind } from '@/lib/vcpTypes';
import { BorderRotate } from '@/components/ui/animated-gradient-border';

// Cinematic standby backdrops — one is chosen at random on each mount so the
// placeholder swaps between stills as the visitor refreshes or navigates back.
const SCOPE_BGS = ['/scope/bg1.jpg', '/scope/bg2.jpg', '/scope/bg3.jpg', '/scope/bg4.jpg'];

const PIPELINE = [
  'Allocating GPU array…',
  'Reading intent…',
  'Blocking the scene…',
  'Choosing the glass…',
  'Designing the light…',
  'Grading the look…',
  'Locking the package…',
];

export function ScopeViewer({
  status,
  mediaUrl,
  output = 'video',
  queuePosition,
  barPct = 0,
  aspectLabel = '16:9 · SCOPE',
  engineLabel = 'CMA STUDIO',
  promptLabel,
  onMediaError,
  onDownload,
}: {
  status: StatusState | 'IDLE';
  mediaUrl?: string;
  output?: OutputKind;
  queuePosition?: number;
  /** letterbox bar height as a % of the monitor (0 = none) — live before render */
  barPct?: number;
  aspectLabel?: string;
  engineLabel?: string;
  /** the user's scene text — used as the finished media's accessible label */
  promptLabel?: string;
  onMediaError?: () => void;
  /** save the finished render — shown as a button on the clip itself */
  onDownload?: () => void;
}) {
  const reduce = useReducedMotion();
  const busy = status === 'IN_QUEUE' || status === 'IN_PROGRESS';

  // Random standby backdrop, picked client-side after mount so it swaps on
  // refresh/navigation without an SSR/CSR hydration mismatch.
  const [bg, setBg] = useState(SCOPE_BGS[0]);
  useEffect(() => {
    setBg(SCOPE_BGS[Math.floor(Math.random() * SCOPE_BGS.length)]);
  }, []);

  // Cycle the pipeline read-out while rendering.
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!busy || reduce) return;
    const id = setInterval(() => setStep((s) => (s + 1) % PIPELINE.length), 1400);
    return () => clearInterval(id);
  }, [busy, reduce]);

  return (
    <BorderRotate
      animationSpeed={7}
      borderWidth={2}
      borderRadius={18}
      backgroundColor="#05060a"
      className="w-full shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]"
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-[16px]">
        {/* live letterbox bars — reflect the selected anamorphic ratio, shown
            before AND after render so the framing preview is honest */}
        {barPct > 0 && (
          <>
            <div className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-black transition-[height] duration-300" style={{ height: `${barPct}%` }} />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-black transition-[height] duration-300" style={{ height: `${barPct}%` }} />
          </>
        )}

        <AnimatePresence mode="wait">
          {status === 'COMPLETED' && mediaUrl && output === 'audio' ? (
            /* audio deck — a centered player over a quiet sound-stage backdrop */
            <motion.div
              key="audio"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[radial-gradient(70%_90%_at_50%_30%,rgba(188,152,99,0.12),#05060a)] px-8"
            >
              <span className="grid h-16 w-16 place-items-center rounded-full border border-[#bc9863]/35 bg-[#bc9863]/10 text-[#e7cfa3]">
                <AudioLines size={28} />
              </span>
              <p className="max-w-md truncate font-mono text-[11px] tracking-[0.12em] text-[#e7cfa3]/85 uppercase">
                {promptLabel ? promptLabel : 'Generated audio'}
              </p>
              <audio
                src={mediaUrl}
                controls
                preload="metadata"
                onError={onMediaError}
                aria-label={promptLabel ? `Generated audio, ${promptLabel}` : 'Generated audio'}
                className="w-full max-w-md"
              />
            </motion.div>
          ) : status === 'COMPLETED' && mediaUrl && output === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <motion.img
              key="image"
              src={mediaUrl}
              alt={promptLabel ? `Generated still — ${promptLabel}` : 'Generated cinematic still'}
              onError={onMediaError}
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 h-full w-full bg-black object-contain"
            />
          ) : status === 'COMPLETED' && mediaUrl ? (
            <motion.video
              key="video"
              src={mediaUrl}
              aria-label={promptLabel ? `Generated clip — ${promptLabel}` : 'Generated cinematic clip'}
              controls
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              onError={onMediaError}
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              // object-contain so a native 21:9 anamorphic clip isn't cropped
              // inside the letterboxed frame.
              className="absolute inset-0 h-full w-full bg-black object-contain"
            />
          ) : (
            <motion.div
              key={status}
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[radial-gradient(60%_80%_at_50%_40%,rgba(14,24,44,0.6),#05060a)] px-6"
            >
              {status === 'IDLE' ? (
                <>
                  {/* cinematic backdrop + light dark-overlay, standby caption on top */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-95" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/20 to-black/60" />
                  <p className="relative font-mono text-xs tracking-[0.16em] text-[#e7cfa3]/85 uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                    Scope standby · awaiting direction
                  </p>
                </>
              ) : status === 'ERROR' ? (
                <p className="font-mono text-xs tracking-[0.16em] text-red-400 uppercase">Render error</p>
              ) : (
                <div className="w-full max-w-md">
                  {/* filmstrip */}
                  <div className="mb-5 flex gap-1.5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="film-cell h-11 flex-1 rounded-[5px] border border-white/8 bg-gradient-to-b from-[#bc9863]/6 to-[#188bf6]/5"
                        style={{ animationDelay: `${i * 0.14}s` }}
                      />
                    ))}
                  </div>
                  {/* indeterminate progress */}
                  <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/6">
                    <motion.div
                      className="h-full w-1/3 rounded-full bg-gradient-to-r from-[#8a6c40] via-[#e7cfa3] to-[#8a6c40]"
                      animate={reduce ? undefined : { x: ['-120%', '360%'] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </div>
                  {/* cycling read-out */}
                  <div aria-live="polite" className="mt-3 flex items-center justify-center gap-2 font-mono text-xs tracking-[0.08em] text-[#e7cfa3]">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#bc9863]" />
                    {status === 'IN_QUEUE'
                      ? `In queue${typeof queuePosition === 'number' ? ` · position ${queuePosition}` : '…'}`
                      : PIPELINE[step]}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Download — sits right on the finished clip/still so it's impossible to
            miss. Appears only once a render exists. */}
        {status === 'COMPLETED' && mediaUrl && onDownload && (
          <motion.button
            type="button"
            onClick={onDownload}
            initial={reduce ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.35 }}
            className="absolute right-3 top-3 z-40 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-3 py-1.5 text-[12px] font-semibold text-black shadow-[0_6px_20px_rgba(0,0,0,0.5)] transition hover:brightness-105"
            title="Save this render to your device"
          >
            <Download size={13} /> Download
          </motion.button>
        )}

        {/* rule-of-thirds framing overlay */}
        <div className="thirds pointer-events-none absolute inset-0 z-10" />

        {/* HUD */}
        <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-between p-3">
          <div className="flex justify-between font-mono text-[9px] tracking-[0.14em] text-white/40">
            <span>{aspectLabel}</span>
            <span>R.O.T. GUIDE</span>
          </div>
          <div className="flex justify-between font-mono text-[9px] tracking-[0.14em] text-white/40">
            <span className="inline-flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${busy ? 'animate-pulse bg-red-500' : 'bg-white/20'}`} />
              {status === 'COMPLETED' ? (output === 'image' ? 'STILL READY' : output === 'audio' ? 'MIX READY' : 'CLIP READY') : status === 'IDLE' ? 'STANDBY' : status === 'ERROR' ? 'ERROR' : 'ROLLING'}
            </span>
            <span className="uppercase">{engineLabel}</span>
          </div>
        </div>
      </div>
    </BorderRotate>
  );
}
