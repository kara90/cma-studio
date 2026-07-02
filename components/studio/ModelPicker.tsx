'use client';

/**
 * ModelPicker — a single dropdown box for ONE media kind (Video OR Photo).
 * Two of these sit side by side so video and photo models are clearly separated.
 * The box whose model is currently selected shows it (gold/active); the other
 * shows a "choose…" placeholder. Picking from a box makes that model active.
 */
import { memo, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Video, Image as ImageIcon, Star, Tag, Check } from 'lucide-react';
import { VIDEO_MODELS, IMAGE_MODELS, findModel, type ModelOption, type ModelStatus, type ModelType } from '@/lib/modelRegistry';

const STATUS_STYLE: Record<ModelStatus, string> = {
  live: 'text-emerald-400 border-emerald-400/30',
  beta: 'text-amber-400 border-amber-400/30',
  preview: 'text-[#8b8f99] border-white/15',
};
const STATUS_LABEL: Record<ModelStatus, string> = { live: 'live', beta: 'beta', preview: 'soon' };

function Row({ m, active, onPick }: { m: ModelOption; active: boolean; onPick: () => void }) {
  // 'preview' models aren't live on Fal yet — show them, but don't let a user
  // select one and pay-then-404. They render greyed with a "soon" badge.
  const soon = m.status === 'preview';
  return (
    <button
      onClick={soon ? undefined : onPick}
      disabled={soon}
      aria-disabled={soon}
      title={soon ? 'Coming soon' : undefined}
      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition ${
        soon ? 'cursor-not-allowed opacity-45' : active ? 'cursor-pointer bg-[#bc9863]/12' : 'cursor-pointer hover:bg-white/5'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className={`font-[family-name:var(--font-sora)] text-[12.5px] font-semibold leading-tight ${active ? 'text-[#e7cfa3]' : 'text-[#f4efe6]'}`}>{m.label}</div>
        <div className="font-mono text-[9px] tracking-[0.08em] text-[#8b909e]">{m.provider}</div>
      </div>
      {active && !soon && <Check size={13} className="text-[#bc9863]" />}
      <span className={`rounded border px-1.5 py-0.5 font-mono text-[8px] tracking-[0.1em] uppercase ${STATUS_STYLE[m.status]}`}>{STATUS_LABEL[m.status]}</span>
    </button>
  );
}

function Group({ icon, label, models, value, onPick }: { icon: React.ReactNode; label: string; models: ModelOption[]; value: string; onPick: (id: string) => void }) {
  if (models.length === 0) return null;
  return (
    <div className="mb-1">
      <div className="flex items-center gap-1.5 px-2.5 pb-1 pt-2 font-mono text-[9px] tracking-[0.18em] text-[#8b909e] uppercase">{icon} {label}</div>
      {models.map((m) => (
        <Row key={m.id} m={m} active={m.id === value} onPick={() => onPick(m.id)} />
      ))}
    </div>
  );
}

function ModelPickerImpl({ kind, value, onChange }: { kind: ModelType; value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = findModel(value);
  const isActive = current?.type === kind;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pool = kind === 'video' ? VIDEO_MODELS : IMAGE_MODELS;
  const best = pool.filter((m) => m.top);
  const val = pool.filter((m) => m.value);
  const more = pool.filter((m) => !m.top && !m.value);
  const Icon = kind === 'video' ? Video : ImageIcon;
  const label = kind === 'video' ? 'Video' : 'Photo';

  return (
    <div ref={ref}>
      <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] tracking-[0.2em] text-[#8b8f99] uppercase">
        <Icon size={11} /> {label}
      </div>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${
          isActive ? 'border-[#bc9863]/50 bg-[#bc9863]/8' : 'border-[#bc9863]/25 bg-[#bc9863]/[0.04] hover:border-[#bc9863]/45'
        }`}
      >
        <span className="grid h-7 w-7 flex-none place-items-center rounded-lg border border-[#bc9863]/30 bg-[#bc9863]/10 text-[#bc9863]">
          <Icon size={14} />
        </span>
        <span className="min-w-0 flex-1">
          {isActive ? (
            <>
              <span className="block truncate font-[family-name:var(--font-sora)] text-[13px] font-semibold text-[#f4efe6]">{current?.label}</span>
              <span className="block font-mono text-[9px] tracking-[0.1em] text-[#8b909e]">{current?.provider}</span>
            </>
          ) : (
            <span className="block text-[12.5px] text-[#8b909e]">Choose a {label.toLowerCase()} model</span>
          )}
        </span>
        {isActive && current && (
          <span className={`rounded border px-1.5 py-0.5 font-mono text-[8px] tracking-[0.1em] uppercase ${STATUS_STYLE[current.status]}`}>{STATUS_LABEL[current.status]}</span>
        )}
        <ChevronDown size={15} className={`text-[#8b8f99] transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* in-flow panel: pushes content below down, no overlap */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
            <div className="mt-2 max-h-[300px] overflow-y-auto rounded-xl border border-[#bc9863]/25 bg-[#0b0d12]/95 p-1.5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)]">
              <Group icon={<Star size={11} className="text-[#bc9863]" />} label="Best" models={best} value={value} onPick={(id) => { onChange(id); setOpen(false); }} />
              <Group icon={<Tag size={11} className="text-emerald-400/70" />} label="Best for price" models={val} value={value} onPick={(id) => { onChange(id); setOpen(false); }} />
              <Group icon={<Icon size={11} />} label="More" models={more} value={value} onPick={(id) => { onChange(id); setOpen(false); }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const ModelPicker = memo(ModelPickerImpl);
