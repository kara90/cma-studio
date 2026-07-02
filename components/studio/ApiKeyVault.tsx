'use client';

/**
 * ApiKeyVault — BYOK local vault. The user's Fal.ai token lives ONLY in this
 * browser (localStorage), is sent per-render to our edge route, and is never
 * stored on CMA servers. `embedded` drops the outer card chrome when the parent
 * already frames it as a step.
 */
import { memo, useEffect, useState } from 'react';
import { KeyRound, Check, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react';

const STORAGE_KEY = 'cma_fal_key';

function ApiKeyVaultImpl({ onKeyChange, embedded = false }: { onKeyChange: (key: string) => void; embedded?: boolean }) {
  const [key, setKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (stored) {
      setKey(stored);
      setSaved(true);
      onKeyChange(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function save() {
    const trimmed = key.trim();
    if (!trimmed) return;
    window.localStorage.setItem(STORAGE_KEY, trimmed);
    setSaved(true);
    onKeyChange(trimmed);
  }
  function clear() {
    window.localStorage.removeItem(STORAGE_KEY);
    setKey('');
    setSaved(false);
    onKeyChange('');
  }

  const inner = (
    <>
      {!embedded && (
        <div className="mb-3 flex items-center gap-2">
          <KeyRound size={14} className="text-[#bc9863]" />
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#8b8f99]">Fal.ai Key Vault</span>
          {saved && (
            <span className="ml-auto inline-flex items-center gap-1 font-mono text-[10px] text-emerald-400">
              <Check size={12} /> Linked
            </span>
          )}
        </div>
      )}
      <div className="flex gap-2">
        {/* eye lives INSIDE the input, over the field you type into */}
        <div className="relative min-w-0 flex-1">
          <input
            type={reveal ? 'text' : 'password'}
            value={key}
            onChange={(e) => { setKey(e.target.value); setSaved(false); }}
            placeholder="Paste your Fal.ai key…"
            autoComplete="off"
            spellCheck={false}
            aria-label="Fal.ai API key"
            className="w-full rounded-lg border border-white/10 bg-black/50 py-2.5 pl-3 pr-9 font-mono text-sm text-[#f4efe6] outline-none transition focus:border-[#bc9863] placeholder:text-[#8b909e]"
          />
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            aria-label={reveal ? 'Hide key' : 'Show key'}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-[#8b8f99] hover:text-[#e7cfa3]"
          >
            {reveal ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={!key.trim() || saved}
          className="flex-none cursor-pointer rounded-lg bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-3.5 py-2.5 text-sm font-semibold text-black transition disabled:opacity-40"
        >
          {saved ? 'Saved' : 'Connect'}
        </button>
        {saved && (
          <button type="button" onClick={clear} aria-label="Clear key" className="flex-none cursor-pointer rounded-lg border border-white/10 px-2.5 text-[#8b8f99] transition hover:border-red-500/50 hover:text-red-400">
            <Trash2 size={15} />
          </button>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="font-mono text-[10px] leading-relaxed text-[#8b909e]">Used only at render. Never stored.</p>
        <a href="https://fal.ai/dashboard/keys" target="_blank" rel="noopener" className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] text-[#bc9863] hover:text-[#e7cfa3]">
          Get a key <ExternalLink size={11} />
        </a>
      </div>
    </>
  );

  if (embedded) return inner;
  return <div className="glass glass-gold rounded-2xl p-4">{inner}</div>;
}

export const ApiKeyVault = memo(ApiKeyVaultImpl);
