'use client';

/**
 * ModelBrowser — the studio's model mega-menu.
 * One glass rail with three kind triggers (Video / Image / Audio). Clicking a
 * trigger expands a single shared panel BELOW the rail, in-flow with animated
 * height (same technique as the old ModelPicker), so it pushes content down
 * and never overlaps. Esc and click-outside close it.
 *
 * Audio is LIVE: the five text-to-audio models are wired end to end. Only the
 * two models that require a media file input (MiniMax Music, MMAudio V2) stay
 * disabled until the upload flow lands — they self-disable via wired:false.
 */
import { memo, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AudioLines, Check, ChevronDown, Image as ImageIcon, Star, Tag, Video } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  AUDIO_MODELS,
  IMAGE_MODELS,
  VIDEO_MODELS,
  findModel,
  type ModelKind,
  type ModelOption,
  type ModelStatus,
} from '@/lib/modelRegistry';

const STATUS_STYLE: Record<ModelStatus, string> = {
  live: 'text-emerald-400 border-emerald-400/30',
  beta: 'text-amber-400 border-amber-400/30',
  preview: 'text-[#8b8f99] border-white/15',
};
const STATUS_LABEL: Record<ModelStatus, string> = { live: 'live', beta: 'beta', preview: 'soon' };

const KINDS: { kind: ModelKind; label: string; icon: LucideIcon; pool: ModelOption[] }[] = [
  { kind: 'video', label: 'Video', icon: Video, pool: VIDEO_MODELS },
  { kind: 'image', label: 'Image', icon: ImageIcon, pool: IMAGE_MODELS },
  { kind: 'audio', label: 'Audio', icon: AudioLines, pool: AUDIO_MODELS },
];

function Row({ m, active, locked, onPick }: { m: ModelOption; active: boolean; locked: boolean; onPick: () => void }) {
  // 'preview' and unwired models are visible but not selectable — a user must
  // never be able to pick a model that would pay-then-404 on the backend.
  const soon = locked || m.status === 'preview' || m.wired === false;
  return (
    <button
      type="button"
      onClick={soon ? undefined : onPick}
      disabled={soon}
      aria-disabled={soon}
      aria-pressed={active}
      title={soon ? 'Coming soon' : undefined}
      className={`w-full rounded-lg px-2.5 py-2 text-left transition ${
        soon ? 'cursor-not-allowed opacity-45' : active ? 'cursor-pointer bg-[#bc9863]/12' : 'cursor-pointer hover:bg-white/5'
      }`}
    >
      <span className="flex items-center gap-2">
        <span
          className={`min-w-0 flex-1 truncate font-[family-name:var(--font-sora)] text-[13px] leading-tight font-semibold ${
            active ? 'text-[#e7cfa3]' : 'text-[#f4efe6]'
          }`}
        >
          {m.label}
        </span>
        {active && !soon && <Check size={13} className="flex-none text-[#bc9863]" />}
        <span className={`flex-none rounded border px-1.5 py-0.5 font-mono text-[8px] tracking-[0.1em] uppercase ${STATUS_STYLE[m.status]}`}>
          {STATUS_LABEL[m.status]}
        </span>
      </span>
      <span className="mt-0.5 block truncate text-[11px] leading-snug text-[#8b8f99]">{m.blurb}</span>
      <span className="mt-0.5 block font-mono text-[9px] tracking-[0.08em] text-[#8b909e]">{m.provider}</span>
    </button>
  );
}

function Group({
  icon,
  label,
  models,
  value,
  locked,
  onPick,
}: {
  icon: React.ReactNode;
  label: string;
  models: ModelOption[];
  value: string;
  locked: boolean;
  onPick: (id: string) => void;
}) {
  if (models.length === 0) return null;
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 px-2.5 pt-1 pb-1 font-mono text-[9px] tracking-[0.18em] text-[#8b909e] uppercase">
        {icon} {label}
      </div>
      <div className="flex flex-col gap-0.5">
        {models.map((m) => (
          <Row key={m.id} m={m} active={m.id === value} locked={locked} onPick={() => onPick(m.id)} />
        ))}
      </div>
    </div>
  );
}

function ModelBrowserImpl({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [openKind, setOpenKind] = useState<ModelKind | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const current = findModel(value);

  useEffect(() => {
    if (openKind === null) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpenKind(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenKind(null);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [openKind]);

  const openEntry = openKind !== null ? KINDS.find((k) => k.kind === openKind) : undefined;
  const pool = openEntry ? openEntry.pool : [];
  const best = pool.filter((m) => m.top);
  const val = pool.filter((m) => m.value);
  const more = pool.filter((m) => !m.top && !m.value);
  const groupCount = [best, val, more].filter((g) => g.length > 0).length;
  const gridCols = groupCount >= 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : groupCount === 2 ? 'sm:grid-cols-2' : '';
  // No blanket tab lock — rows self-disable via status:'preview' / wired:false.
  const locked = false;
  const audioNote = openEntry?.kind === 'audio';

  const pick = (id: string) => {
    onChange(id);
    setOpenKind(null);
  };

  return (
    <div ref={ref}>
      {/* The rail: three kind triggers side by side */}
      <div className="glass glass-gold rounded-2xl p-1.5">
        <div className="grid grid-cols-3 gap-1.5">
          {KINDS.map(({ kind, label, icon: Icon, pool: kindPool }) => {
            const selectedHere = current?.type === kind;
            const isOpen = openKind === kind;
            return (
              <button
                key={kind}
                type="button"
                onClick={() => setOpenKind(isOpen ? null : kind)}
                aria-expanded={isOpen}
                className={`min-h-[44px] cursor-pointer rounded-xl border px-2 py-2 text-left transition sm:px-3 sm:py-2.5 ${
                  isOpen
                    ? 'border-[#bc9863] bg-[#bc9863]/12'
                    : selectedHere
                      ? 'border-[#bc9863]/50 bg-[#bc9863]/8 hover:border-[#bc9863]'
                      : 'border-white/8 hover:border-[#bc9863]/40'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Icon size={12} className={`flex-none ${selectedHere || isOpen ? 'text-[#bc9863]' : 'text-[#8b8f99]'}`} />
                  <span
                    className={`truncate font-mono text-[10px] tracking-[0.2em] uppercase ${
                      selectedHere || isOpen ? 'text-[#e7cfa3]' : 'text-[#8b909e]'
                    }`}
                  >
                    {label}
                  </span>
                  <ChevronDown size={13} className={`ml-auto hidden flex-none text-[#8b8f99] transition sm:block ${isOpen ? 'rotate-180' : ''}`} />
                </span>
                {/* Mobile compresses to labels only; details show from sm up */}
                <span className="mt-1 hidden sm:block">
                  {selectedHere && current ? (
                    <>
                      <span className="block truncate font-[family-name:var(--font-sora)] text-[13px] font-semibold text-[#f4efe6]">
                        {current.label}
                      </span>
                      <span className="block truncate font-mono text-[9px] tracking-[0.1em] text-[#8b909e]">{current.provider}</span>
                    </>
                  ) : (
                    <span className="block text-[12px] text-[#8b909e]">Browse {kindPool.length} models</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Shared mega-panel: in-flow, pushes content below down, never overlaps */}
      <AnimatePresence initial={false}>
        {openEntry && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-2 max-h-[420px] overflow-y-auto rounded-xl border border-[#bc9863]/25 bg-[#0b0d12]/95 p-2.5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)]">
              {audioNote && (
                <div className="mb-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2">
                  <AudioLines size={12} className="flex-none text-[#bc9863]" />
                  <span className="text-[11.5px] leading-snug text-[#8b8f99]">
                    Music, voice and sound design, rendered on your key. Models marked soon need a reference file and
                    arrive with the upload flow.
                  </span>
                </div>
              )}
              <div className={`grid grid-cols-1 gap-x-3 gap-y-2 ${gridCols}`}>
                <Group icon={<Star size={11} className="text-[#bc9863]" />} label="Best" models={best} value={value} locked={locked} onPick={pick} />
                <Group icon={<Tag size={11} className="text-emerald-400/70" />} label="Best for price" models={val} value={value} locked={locked} onPick={pick} />
                {openEntry && <Group icon={<openEntry.icon size={11} />} label="More" models={more} value={value} locked={locked} onPick={pick} />}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const ModelBrowser = memo(ModelBrowserImpl);
