import type { MetadataRoute } from 'next';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://cinemasterstudio.com';

/**
 * robots.txt (Next serves it at /robots.txt) — allow the public marketing +
 * tool + legal surfaces, keep crawlers out of API and authenticated/app-only
 * paths, and declare the sitemap (which the previously-served robots lacked).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/files', '/login', '/reset-password', '/unlock', '/gallery/queue'],
    },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
