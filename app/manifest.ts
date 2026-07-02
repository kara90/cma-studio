import type { MetadataRoute } from 'next';

/**
 * PWA manifest — makes CMA Studio installable from the site itself on every
 * phone/tablet (Android install prompt, iOS "Add to Home Screen"). Served at
 * /manifest.webmanifest and auto-linked by Next. Same origin, same Worker,
 * same accounts — the app IS the website.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'CMA Studio',
    short_name: 'CMA Studio',
    description:
      'Every frontier AI model. One flat fee. Your key. The professional AI production platform by CineMaster Academy.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#05060a',
    theme_color: '#07080b',
    categories: ['photo', 'video', 'productivity', 'entertainment'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Generate video', url: '/video', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Studio Pro', url: '/studio', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'My files', url: '/files', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ],
  };
}
