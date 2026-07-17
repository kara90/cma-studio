'use client';

/**
 * RecipePanel — save the current camera setup as a NAMED RECIPE, re-apply or
 * duplicate saved ones, and share any of them at /r/[id] (the id encodes the
 * whole recipe, like photographers sharing EXIF).
 *
 * ⚠ SEAM (accounts pass): recipes persist in this browser's localStorage until
 * account sync lands. Share links already work everywhere (self-contained id).
 */
import { useEffect, useState } from 'react';
import { BookMarked, Copy, Link2, Play, Trash2, Check } from 'lucide-react';
import {
  listRecipes,
  saveRecipe,
  duplicateRecipe,
  deleteRecipe,
  encodeRecipeId,
  recipeSummary,
  type RecipeSettings,
  type SavedRecipe,
} from '@/lib/recipes';
import { track } from '@/lib/track';

export function RecipePanel({
  current,
  onApply,
}: {
  current: RecipeSettings;
  onApply: (settings: RecipeSettings) => void;
}) {
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [name, setName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setRecipes(listRecipes());
  }, []);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    saveRecipe(name, current);
    setName('');
    setRecipes(listRecipes());
  }

  async function share(r: SavedRecipe) {
    const url = `${window.location.origin}/r/${encodeRecipeId(r.settings)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(r.id);
      track('recipe_share');
      setTimeout(() => setCopiedId((prev) => (prev === r.id ? null : prev)), 2000);
    } catch {
      // Clipboard blocked — open the share page instead so the URL is visible.
      window.open(url, '_blank', 'noopener');
      track('recipe_share');
    }
  }

  return (
    <div className="glass glass-gold rounded-2xl p-4">
      <h3 className="mb-3.5 flex items-center gap-2 border-b border-[#bc9863]/12 pb-2 font-[family-name:var(--font-sora)] text-[13px] font-semibold tracking-[0.01em] text-[#e7cfa3]">
        <BookMarked size={13} className="text-[#bc9863]" /> Camera recipes
      </h3>

      {/* save the rig on screen right now */}
      <form onSubmit={handleSave} className="mb-3 flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder="Name this setup…"
          aria-label="Recipe name"
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[12.5px] text-[#f4efe6] outline-none transition focus:border-[#bc9863] placeholder:text-[#8b909e]"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="flex-none cursor-pointer rounded-lg bg-gradient-to-b from-[#e7cfa3] to-[#bc9863] px-3.5 py-2 text-[12.5px] font-semibold text-black transition hover:brightness-105 disabled:opacity-40"
        >
          Save
        </button>
      </form>

      {recipes.length === 0 ? (
        <p className="text-[11.5px] leading-relaxed text-[#8b909e]">
          Dial a look you love, name it, and it lives here — re-apply it on any future render or share it as a link,
          the way photographers share EXIF.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {recipes.map((r) => (
            <li key={r.id} className="rounded-xl border border-white/8 bg-black/30 p-2.5">
              <p className="truncate text-[12.5px] font-medium text-[#f4efe6]">{r.name}</p>
              <p className="mt-0.5 line-clamp-1 font-mono text-[9.5px] text-[#8b909e]">{recipeSummary(r.settings)}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => onApply(r.settings)}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-[#bc9863]/40 bg-[#bc9863]/8 px-2 py-1 font-mono text-[10px] text-[#e7cfa3] transition hover:bg-[#bc9863]/15"
                  title="Load this recipe into the console"
                >
                  <Play size={10} /> Apply
                </button>
                <button
                  type="button"
                  onClick={() => void share(r)}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-white/10 px-2 py-1 font-mono text-[10px] text-[#c7c2b8] transition hover:border-[#bc9863]/40 hover:text-[#e7cfa3]"
                  title="Copy the public share link"
                >
                  {copiedId === r.id ? <Check size={10} className="text-emerald-400" /> : <Link2 size={10} />}
                  {copiedId === r.id ? 'Copied' : 'Share'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    duplicateRecipe(r.id);
                    setRecipes(listRecipes());
                  }}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-white/10 px-2 py-1 font-mono text-[10px] text-[#c7c2b8] transition hover:border-[#bc9863]/40 hover:text-[#e7cfa3]"
                  title="Duplicate this recipe"
                >
                  <Copy size={10} /> Duplicate
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteRecipe(r.id);
                    setRecipes(listRecipes());
                  }}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-white/10 px-2 py-1 font-mono text-[10px] text-[#8b8f99] transition hover:border-red-500/40 hover:text-red-400"
                  title="Delete this recipe"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 font-mono text-[9px] leading-relaxed tracking-[0.04em] text-[#8b909e]">
        Saved in this browser for now; account sync arrives with CMA accounts. Share links work everywhere already.
      </p>
    </div>
  );
}
