import type { MetadataRoute } from 'next';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://cinemasterstudio.com';

/**
 * Public sitemap (Next serves it at /sitemap.xml). Only crawlable public
 * surfaces are listed — auth/app/api routes are omitted. Referenced from
 * robots.ts via the Sitemap directive.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '/', priority: 1.0, changeFrequency: 'weekly' },
    { path: '/pricing', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/video', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/image', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/audio', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/studio', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/marketing', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/real-estate', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/faq', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/key-guide', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/app', priority: 0.4, changeFrequency: 'monthly' },
    { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/refunds', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/acceptable-use', priority: 0.3, changeFrequency: 'yearly' },
  ];
  return routes.map((r) => ({
    url: `${SITE}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
