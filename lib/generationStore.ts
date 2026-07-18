'use client';

/**
 * lib/generationStore.ts — the user's generation history.
 * Backed by localStorage for the beta (per-device). SWAP SEAM: to make history
 * account-linked + cross-device, replace read()/persist()/addGeneration() with
 * calls to a Supabase `generations` table keyed by the authenticated user id —
 * the component API (useGenerations / addGeneration) stays the same.
 */
import { useEffect, useState } from 'react';
import type { OutputKind } from './vcpTypes';

export interface Generation {
  id: string;
  /** the full-quality asset URL on Fal (may expire — the "open full file" link) */
  url: string;
  output: OutputKind;
  prompt: string;
  model: string;
  createdAt: number;
  /**
   * A tiny self-contained JPEG data-URL preview (~a few KB) generated at render
   * time. This is what the strip shows — it survives the full 7-day TTL below
   * even after the Fal URL expires, and keeps our storage footprint light (no
   * full files kept).
   */
  thumb?: string;
}

const KEY = 'cma_generations';
const CAP = 30;
/**
 * Light previews auto-clear after 7 DAYS — matching Fal's official "available for
 * at least 7 days" media retention, so the preview + the "open full file on Fal"
 * link stay valid for the whole window the user can still download the real file.
 * At ~12KB per preview this is still tiny. "Continuous storage" can later be a
 * paid pricing add-on. (Fal permanently deletes files after ~7 days.)
 */
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

const listeners = new Set<() => void>();

function read(): Generation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as Generation[]) : [];
    const now = Date.now();
    const fresh = list.filter((g) => now - g.createdAt < TTL_MS);
    if (fresh.length !== list.length) {
      try {
        window.localStorage.setItem(KEY, JSON.stringify(fresh));
      } catch {
        /* ignore */
      }
    }
    return fresh;
  } catch {
    return [];
  }
}

function persist(list: Generation[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, CAP)));
  } catch {
    /* quota / privacy mode — ignore */
  }
  listeners.forEach((l) => l());
}

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `g_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  }
}

export function addGeneration(g: Omit<Generation, 'id' | 'createdAt'>) {
  const entry: Generation = { ...g, id: newId(), createdAt: Date.now() };
  persist([entry, ...read()]);
}

/** Subscribe a component to the history. */
export function useGenerations(): Generation[] {
  const [items, setItems] = useState<Generation[]>([]);
  useEffect(() => {
    const sync = () => setItems(read());
    sync();
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, []);
  return items;
}
