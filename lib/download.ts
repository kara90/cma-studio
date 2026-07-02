'use client';

/**
 * lib/download.ts — save a finished render to the user's device.
 *
 * Fal media URLs are public + CORS-open, so we fetch the file to a blob and
 * trigger a real download (proper filename, no new tab). If the fetch is ever
 * blocked (CORS/network/expired), we fall back to opening the URL so the user
 * can still save it manually — it can't leave the user stuck.
 */
import type { OutputKind } from './vcpTypes';

/** Build a safe, descriptive filename from the prompt + model. */
export function renderFilename(prompt: string, output: OutputKind, model?: string): string {
  const slug = (prompt || 'render')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'render';
  const tag = (model || 'cma').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const ext = output === 'image' ? 'png' : 'mp4';
  return `cma-${slug}-${tag}.${ext}`;
}

/** Returns true if the blob download ran; false if it fell back to opening. */
export async function downloadRender(url: string, filename: string): Promise<boolean> {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objUrl), 5000);
    return true;
  } catch {
    // CORS / network / expired link — open it so the user can save manually.
    window.open(url, '_blank', 'noopener');
    return false;
  }
}
