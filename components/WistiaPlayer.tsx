'use client';

/**
 * WistiaPlayer — embeds a Wistia video via their <wistia-player> web component.
 * Nothing is self-hosted: the clip streams from Wistia's CDN (CSP is scoped to
 * Wistia in next.config.mjs). The player.js runtime + the per-media module are
 * injected once on mount. A blurred swatch shows while the component upgrades.
 */
import { createElement, useEffect } from 'react';

function ensureScript(src: string, module = false) {
  if (typeof document === 'undefined') return;
  if (document.querySelector(`script[data-wistia="${src}"]`)) return;
  const s = document.createElement('script');
  s.src = src;
  s.async = true;
  s.dataset.wistia = src;
  if (module) s.type = 'module';
  document.head.appendChild(s);
}

export function WistiaPlayer({
  mediaId,
  aspect = '1.7777777777777777',
  className,
}: {
  mediaId: string;
  aspect?: string;
  className?: string;
}) {
  useEffect(() => {
    ensureScript('https://fast.wistia.com/player.js');
    ensureScript(`https://fast.wistia.com/embed/${mediaId}.js`, true);
  }, [mediaId]);

  return (
    <>
      {/* blurred poster while the web component is still upgrading */}
      <style>{`wistia-player[media-id='${mediaId}']:not(:defined){background:center/contain no-repeat url('https://fast.wistia.com/embed/medias/${mediaId}/swatch');display:block;filter:blur(5px);padding-top:56.25%;}`}</style>
      {createElement('wistia-player', {
        'media-id': mediaId,
        aspect,
        class: className,
        style: { display: 'block', width: '100%' },
      })}
    </>
  );
}
