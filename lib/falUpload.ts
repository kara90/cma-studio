'use client';

/**
 * lib/falUpload.ts — upload a local frame image STRAIGHT to fal storage on the
 * user's own key, from the browser. The file never touches CMA servers.
 *
 * PRIMARY PATH — mirrors fal's official JS client (@fal-ai/client storage.upload):
 *   1. POST https://rest.alpha.fal.ai/storage/upload/initiate?storage_type=fal-cdn-v3
 *      headers { Authorization: 'Key <apiKey>', 'Content-Type': 'application/json' }
 *      body    { content_type, file_name }
 *      → JSON { upload_url, file_url }
 *   2. PUT the raw file bytes to upload_url (Content-Type = the file's type)
 *   3. return file_url — a fal CDN URL the render endpoints accept directly.
 *
 * FALLBACK on ANY failure (network error, CSP block, endpoint moved, response
 * shape change): FileReader → base64 data URI. Every wired fal model accepts a
 * data URI wherever it accepts an image URL, so frames KEEP WORKING even if fal
 * changes the initiate endpoint out from under us. The fallback rejects files
 * over 8 MB (a data URI that large bloats the request body) with a clear,
 * user-facing error.
 */

const INITIATE_URL = 'https://rest.alpha.fal.ai/storage/upload/initiate?storage_type=fal-cdn-v3';
const FALLBACK_MAX_BYTES = 8 * 1024 * 1024; // 8 MB — data-URI fallback ceiling
const FALLBACK_ERROR = 'Could not upload the frame. Try a smaller image.';

export async function uploadToFal(file: File, apiKey: string): Promise<string> {
  try {
    const initRes = await fetch(INITIATE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content_type: file.type || 'image/png',
        file_name: file.name || 'frame.png',
      }),
    });
    if (!initRes.ok) throw new Error(`initiate HTTP ${initRes.status}`);
    const data = (await initRes.json()) as { upload_url?: unknown; file_url?: unknown };
    if (typeof data.upload_url !== 'string' || typeof data.file_url !== 'string') {
      throw new Error('initiate response shape changed');
    }
    const putRes = await fetch(data.upload_url, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'image/png' },
      body: file,
    });
    if (!putRes.ok) throw new Error(`upload HTTP ${putRes.status}`);
    return data.file_url;
  } catch {
    // Any failure above lands here — keep the frame working via a data URI.
    return fileToDataUri(file);
  }
}

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > FALLBACK_MAX_BYTES) {
      reject(new Error(FALLBACK_ERROR));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const out = reader.result;
      if (typeof out === 'string' && out.startsWith('data:')) resolve(out);
      else reject(new Error(FALLBACK_ERROR));
    };
    reader.onerror = () => reject(new Error(FALLBACK_ERROR));
    reader.readAsDataURL(file);
  });
}
