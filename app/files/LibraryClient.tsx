'use client';

/**
 * app/files/LibraryClient.tsx — the account library view rendered by /files.
 * Fetches GET /api/files on mount (the contract in app/api/files/route.ts) and
 * shows every stored render for the user's whole retention window: a summary
 * line, All/Video/Image/Audio filter chips, a responsive tile grid with
 * Open/Download hover actions, plus friendly empty / storage-offline / locked
 * (401, 403, 402) states. Mirrors the patterns of the GenerationStrip modal
 * this page graduates into a destination.
 */
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  AudioLines,
  Clapperboard,
  Download,
  ExternalLink,
  Film,
  Image as ImageIcon,
  LockKeyhole,
  RefreshCw,
  Search,
  TriangleAlert,
} from 'lucide-react';
import type { FilesResult, OutputKind, StoredFile } from '@/lib/vcpTypes';

type Filter = 'all' | OutputKind;

type ViewState =
  | { phase: 'loading' }
  | { phase: 'ready'; files: StoredFile[]; retentionDays: number }
  | { phase: 'offline' }
  | { phase: 'locked'; status: number }
  | { phase: 'error'; message: string };

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'video', label: 'Video' },
  { key: 'image', label: 'Image' },
  { key: 'audio', label: 'Audio' },
];

/** Glyph tile for a stored file (no server-side thumbnails, so tiles stay light). */
function KindGlyph({ output }: { output: OutputKind }) {
  const Icon = output === 'audio' ? AudioLines : output === 'image' ? ImageIcon : Film;
  return (
    <div className="grid aspect-video w-full place-items-center bg-[radial-gradient(70%_90%_at_50%_30%,rgba(188,152,99,0.12),#0a0b10)] text-[#bc9863]">
      <Icon size={26} />
    </div>
  );
}

function FileTile({ file, index, reduce }: { file: StoredFile; index: number; reduce: boolean }) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.3), ease: 'easeOut' }}
      className="group overflow-hidden rounded-xl border border-[#bc9863]/25 bg-black transition hover:border-[#bc9863]/55"
    >
      <div className="relative">
        <KindGlyph output={file.output} />
        <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[9px] tracking-[0.1em] text-[#e7cfa3] uppercase">
          {file.daysLeft}d left
        </span>
        {/* hover / focus actions — full-size touch targets */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 backdrop-blur-[2px] transition group-focus-within:opacity-100 group-hover:opacity-100">
          <a
            href={`/api/files/${file.id}`}
            target="_blank"
            rel="noopener"
            className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-3.5 text-[12px] font-semibold text-black transition hover:brightness-105"
            title="Open the full file in a new tab"
          >
            <ExternalLink size={13} /> Open
          </a>
          <a
            href={`/api/files/${file.id}?download=1`}
            className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-xl border border-[#bc9863]/45 bg-black/50 px-3.5 text-[12px] font-semibold text-[#e7cfa3] transition hover:bg-[#bc9863]/10"
            title="Save this file to your device"
          >
            <Download size={13} /> Download
          </a>
        </div>
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-[12px] leading-snug text-[#c7c2b8]">{file.note || 'Untitled render'}</p>
        <p className="mt-1.5 font-mono text-[9px] tracking-[0.08em] text-[#8b909e] uppercase">
          {file.model} · {new Date(file.createdAt).toLocaleDateString()}
        </p>
        {/* full camera recipe, once render-time capture starts populating it */}
        {file.recipe && (file.recipe.camera || file.recipe.lens) && (
          <p className="mt-1 line-clamp-1 font-mono text-[9px] tracking-[0.04em] text-[#bc9863]/80">
            {[
              file.recipe.camera,
              file.recipe.lens,
              file.recipe.focalLength ? `${file.recipe.focalLength}mm` : null,
              file.recipe.aperture ? `T${file.recipe.aperture}` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export function LibraryClient() {
  const [state, setState] = useState<ViewState>({ phase: 'loading' });
  const [filter, setFilter] = useState<Filter>('all');
  // Vault search + facet filters (project/model facets appear only when the
  // library actually contains those values — no dead dropdowns).
  const [query, setQuery] = useState('');
  const [modelFilter, setModelFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const prefersReduced = useReducedMotion();
  const reduce = prefersReduced ?? false;

  // Resolves to the next view state — setState happens in the caller's
  // callback so the mount effect never sets state synchronously.
  const fetchLibrary = useCallback(async (): Promise<ViewState> => {
    try {
      const res = await fetch('/api/files', { cache: 'no-store' });
      const data = (await res.json()) as FilesResult;
      if (data.ok) {
        if (data.storageOffline) return { phase: 'offline' };
        return { phase: 'ready', files: data.files ?? [], retentionDays: data.retentionDays ?? 30 };
      }
      if (res.status === 401 || res.status === 403 || res.status === 402) {
        return { phase: 'locked', status: res.status };
      }
      return { phase: 'error', message: data.error || 'Could not load your library. Try again.' };
    } catch {
      return { phase: 'error', message: 'Could not load your library. Try again.' };
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchLibrary().then((next) => {
      if (!cancelled) setState(next);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchLibrary]);

  const retry = () => {
    setState({ phase: 'loading' });
    fetchLibrary().then(setState);
  };

  /* ---------- loading ---------- */
  if (state.phase === 'loading') {
    return (
      <div aria-busy="true" aria-label="Loading your library" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className={`h-48 rounded-xl border border-white/6 bg-white/[0.03] ${reduce ? '' : 'animate-pulse'}`} />
        ))}
      </div>
    );
  }

  /* ---------- storage offline (local dev without bindings) ---------- */
  if (state.phase === 'offline') {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-amber-400/40 bg-amber-400/[0.07] px-7 py-8 text-center">
        <TriangleAlert size={22} className="mx-auto mb-3 text-amber-400" />
        <p className="text-[14px] leading-relaxed text-amber-100/90">
          <span className="font-semibold text-amber-300">Storage is not connected in this environment,</span> so your
          library cannot be shown here. Your account library is available where CMA storage is online.
        </p>
      </div>
    );
  }

  /* ---------- locked: signed out, no Academy access, or no plan ---------- */
  if (state.phase === 'locked') {
    const needsPlan = state.status === 402;
    return (
      <div className="glass glass-gold mx-auto max-w-lg rounded-2xl px-8 py-10 text-center">
        <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full border border-[#bc9863]/35 bg-[#bc9863]/10 text-[#e7cfa3]">
          <LockKeyhole size={20} />
        </span>
        <h2 className="font-[family-name:var(--font-sora)] text-[20px] font-semibold text-[#f4efe6]">
          Your library follows your account.
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-[#8b8f99]">
          {needsPlan
            ? 'You are signed in, but a plan is what gives your renders a storage window. Pick one and every finished render is kept for you.'
            : 'Sign in and every render stored on your plan is right here, on any device.'}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={needsPlan ? '/pricing' : '/login'}
            className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-5 text-[13.5px] font-semibold text-black transition hover:brightness-105"
          >
            {needsPlan ? 'See plans' : 'Sign in'}
          </Link>
          <Link
            href={needsPlan ? '/login' : '/pricing'}
            className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-[#bc9863]/40 px-5 text-[13.5px] font-semibold text-[#e7cfa3] transition hover:bg-[#bc9863]/10"
          >
            {needsPlan ? 'Switch account' : 'See plans'}
          </Link>
        </div>
      </div>
    );
  }

  /* ---------- unexpected error ---------- */
  if (state.phase === 'error') {
    return (
      <div className="glass glass-gold mx-auto max-w-lg rounded-2xl px-8 py-10 text-center">
        <TriangleAlert size={22} className="mx-auto mb-3 text-[#bc9863]" />
        <p className="text-[14px] leading-relaxed text-[#c7c2b8]">{state.message}</p>
        <button
          onClick={retry}
          className="mx-auto mt-5 inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-[#bc9863]/40 px-5 text-[13.5px] font-semibold text-[#e7cfa3] transition hover:bg-[#bc9863]/10"
        >
          <RefreshCw size={14} /> Try again
        </button>
      </div>
    );
  }

  /* ---------- ready ---------- */
  const { files, retentionDays } = state;

  if (files.length === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-[#bc9863]/18 bg-[#bc9863]/[0.04] px-8 py-12 text-center">
        <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full border border-[#bc9863]/35 bg-[#bc9863]/10 text-[#e7cfa3]">
          <Clapperboard size={20} />
        </span>
        <h2 className="font-[family-name:var(--font-sora)] text-[20px] font-semibold text-[#f4efe6]">Nothing here yet.</h2>
        <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-[#8b8f99]">
          Your finished renders land here automatically. Make your first one:
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/video"
            className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-5 text-[13.5px] font-semibold text-black transition hover:brightness-105"
          >
            <Film size={15} /> Generate video
          </Link>
          <Link
            href="/image"
            className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-[#bc9863]/40 px-5 text-[13.5px] font-semibold text-[#e7cfa3] transition hover:bg-[#bc9863]/10"
          >
            <ImageIcon size={15} /> Generate image
          </Link>
          <Link
            href="/audio"
            className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-[#bc9863]/40 px-5 text-[13.5px] font-semibold text-[#e7cfa3] transition hover:bg-[#bc9863]/10"
          >
            <AudioLines size={15} /> Generate audio
          </Link>
        </div>
      </div>
    );
  }

  // Vault filtering: output kind → project facet → model facet → free search
  // (search matches the scene note, the model name and any recipe fields).
  const models = Array.from(new Set(files.map((f) => f.model))).sort();
  const projects = Array.from(new Set(files.map((f) => f.project).filter((p): p is string => Boolean(p)))).sort();
  const q = query.trim().toLowerCase();
  const visible = files.filter((f) => {
    if (filter !== 'all' && f.output !== filter) return false;
    if (modelFilter !== 'all' && f.model !== modelFilter) return false;
    if (projectFilter !== 'all' && f.project !== projectFilter) return false;
    if (!q) return true;
    const recipeText = f.recipe ? Object.values(f.recipe).filter(Boolean).join(' ') : '';
    return `${f.note} ${f.model} ${f.project ?? ''} ${recipeText}`.toLowerCase().includes(q);
  });
  const countFor = (key: Filter) => (key === 'all' ? files.length : files.filter((f) => f.output === key).length);

  return (
    <div>
      {/* summary + the Vault policy line */}
      <div className="mb-4">
        <p className="font-mono text-[12px] tracking-[0.04em] text-[#8b909e]">
          {files.length} {files.length === 1 ? 'render' : 'renders'} stored · kept about {retentionDays} days on your plan · fair use
        </p>
        <p className="mt-1 text-[11.5px] leading-relaxed text-[#8b909e]">
          The Vault keeps your renders with their full camera recipe. Never deleted while you are subscribed, within
          your plan&apos;s window and a fair-use storage cap.
        </p>
      </div>

      {/* search + facets + kind chips */}
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8b909e]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search prompts, models, recipes…"
              aria-label="Search your library"
              className="w-full rounded-lg border border-white/10 bg-black/40 py-2 pl-8 pr-3 text-[12.5px] text-[#f4efe6] outline-none transition focus:border-[#bc9863] placeholder:text-[#8b909e]"
            />
          </div>
          {models.length > 1 && (
            <select
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
              aria-label="Filter by model"
              className="cursor-pointer rounded-lg border border-white/10 bg-black/40 px-2.5 py-2 font-mono text-[11px] text-[#c7c2b8] outline-none transition focus:border-[#bc9863]"
            >
              <option value="all">Every model</option>
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          )}
          {projects.length > 0 && (
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              aria-label="Filter by project"
              className="cursor-pointer rounded-lg border border-white/10 bg-black/40 px-2.5 py-2 font-mono text-[11px] text-[#c7c2b8] outline-none transition focus:border-[#bc9863]"
            >
              <option value="all">Every project</option>
              {projects.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by output type">
          {FILTERS.map(({ key, label }) => {
            const active = filter === key;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                aria-pressed={active}
                className={`inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-lg border px-4 font-mono text-[11px] tracking-[0.12em] uppercase transition ${
                  active
                    ? 'border-[#bc9863] bg-[#bc9863]/12 text-[#e7cfa3]'
                    : 'border-white/10 text-[#8b8f99] hover:border-[#bc9863]/40 hover:text-[#c7c2b8]'
                }`}
              >
                {label}
                <span className={active ? 'text-[#bc9863]' : 'text-[#8b909e]/70'}>{countFor(key)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-white/6 bg-black/30 px-4 py-10 text-center font-mono text-[12px] text-[#8b909e]">
          {q || modelFilter !== 'all' || projectFilter !== 'all'
            ? 'Nothing matches those filters.'
            : `No ${filter} renders in your library yet.`}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((f, i) => (
            <FileTile key={f.id} file={f} index={i} reduce={reduce} />
          ))}
        </div>
      )}
    </div>
  );
}
