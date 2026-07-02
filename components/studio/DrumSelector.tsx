'use client';

/**
 * DrumSelector — a tactile cinema drum wheel. Items scroll vertically and snap
 * into a fixed center marker. Optional per-item `thumb` (a lens/camera visual)
 * shows alongside the label. Fully keyboard-navigable and memoized.
 */
import { memo, useEffect, useId, useRef, useCallback, type ReactNode } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface DrumItem {
  id: string;
  label: string;
  sub?: string;
  thumb?: ReactNode;
}

function DrumSelectorImpl({
  label,
  items,
  value,
  onChange,
  itemHeight = 36,
  accent = '#bc9863',
}: {
  label: string;
  items: DrumItem[];
  value: string;
  onChange: (id: string) => void;
  itemHeight?: number;
  accent?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The last value WE committed from a user scroll — used to avoid the sync
  // effect yanking the wheel back mid-scroll (which caused the skipping/jank).
  const committedRef = useRef<string | null>(null);
  const uid = useId();
  const activeIndex = Math.max(0, items.findIndex((i) => i.id === value));

  const H = itemHeight * 3;
  const pad = itemHeight; // (H - itemHeight) / 2
  const hasThumbs = items.some((i) => i.thumb);

  // Align the wheel to `value` ONLY on external changes (mount, preset, lens
  // reset, click) — never in response to our own scroll commit.
  useEffect(() => {
    if (committedRef.current === value) return;
    committedRef.current = value;
    const el = ref.current;
    if (!el) return;
    const target = activeIndex * itemHeight;
    if (Math.abs(el.scrollTop - target) > 2) el.scrollTo({ top: target, behavior: 'auto' });
  }, [value, activeIndex, itemHeight]);

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    // Commit only after scrolling settles, so snap has finished positioning.
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      const idx = Math.min(items.length - 1, Math.max(0, Math.round(el.scrollTop / itemHeight)));
      const next = items[idx];
      if (next && next.id !== value) {
        committedRef.current = next.id; // mark as ours → sync effect won't re-scroll
        onChange(next.id);
      }
      // ease onto the centered item (proximity may stop slightly off)
      const target = idx * itemHeight;
      if (Math.abs(el.scrollTop - target) > 1) el.scrollTo({ top: target });
    }, 140);
  }, [items, value, onChange, itemHeight]);

  const move = useCallback(
    (to: number) => {
      const idx = Math.min(items.length - 1, Math.max(0, to));
      const next = items[idx];
      if (next && next.id !== value) onChange(next.id);
    },
    [items, value, onChange],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(activeIndex + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(activeIndex - 1); }
      else if (e.key === 'Home') { e.preventDefault(); move(0); }
      else if (e.key === 'End') { e.preventDefault(); move(items.length - 1); }
    },
    [activeIndex, items.length, move],
  );

  return (
    <div>
      <div className="mb-1.5 font-mono text-[10px] tracking-[0.2em] uppercase text-[#8b8f99]">{label}</div>
      <div className="relative rounded-xl border border-[#bc9863]/15 bg-black/40">
        <div className="drum-marker" style={{ borderColor: accent, height: itemHeight }} />
        <div className="drum-barrel" />
        {/* tap arrows — the drum is scroll-snap, but touch users need a tap target */}
        <button
          type="button"
          aria-label={`Previous ${label}`}
          tabIndex={-1}
          onClick={() => move(activeIndex - 1)}
          className="absolute inset-x-0 top-0 z-20 flex h-7 items-center justify-center text-[#bc9863]/45 transition hover:text-[#e7cfa3] active:text-[#e7cfa3]"
        >
          <ChevronUp size={15} />
        </button>
        <button
          type="button"
          aria-label={`Next ${label}`}
          tabIndex={-1}
          onClick={() => move(activeIndex + 1)}
          className="absolute inset-x-0 bottom-0 z-20 flex h-7 items-center justify-center text-[#bc9863]/45 transition hover:text-[#e7cfa3] active:text-[#e7cfa3]"
        >
          <ChevronDown size={15} />
        </button>
        <div
          className="drum"
          ref={ref}
          onScroll={onScroll}
          onKeyDown={onKeyDown}
          role="listbox"
          aria-label={label}
          aria-activedescendant={`${uid}-${activeIndex}`}
          tabIndex={0}
          style={{ height: H }}
        >
          <div className="drum-pad" style={{ paddingTop: pad, paddingBottom: pad }}>
            {items.map((it, i) => {
              const isActive = it.id === value;
              return (
                <div
                  key={it.id}
                  id={`${uid}-${i}`}
                  className="drum-item"
                  data-active={isActive}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => onChange(it.id)}
                  style={
                    hasThumbs
                      ? { height: itemHeight, flexDirection: 'column', gap: 3, justifyContent: 'center', padding: '0 4px' }
                      : { height: itemHeight }
                  }
                >
                  {it.thumb && (
                    <span className="flex-none overflow-hidden" style={{ width: '78%', height: itemHeight * 0.46 }}>
                      {it.thumb}
                    </span>
                  )}
                  <span className="flex w-full flex-col items-center leading-tight">
                    <span
                      className="di-label w-full truncate text-center"
                      style={{ ...(isActive ? { color: accent } : {}), ...(hasThumbs ? { fontSize: '10.5px' } : {}) }}
                    >
                      {it.label}
                    </span>
                    {it.sub && <span className="di-sub w-full truncate text-center">{it.sub}</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export const DrumSelector = memo(DrumSelectorImpl);
