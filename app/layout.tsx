import type { Metadata, Viewport } from 'next';
import { Sora, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Atmosphere } from '@/components/Atmosphere';
import { PwaProvider } from '@/components/PwaProvider';

const sora = Sora({ variable: '--font-sora', subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], display: 'swap' });
const inter = Inter({ variable: '--font-inter', subsets: ['latin'], display: 'swap' });
const mono = JetBrains_Mono({ variable: '--font-mono', subsets: ['latin'], weight: ['400', '500', '600'], display: 'swap' });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cinemasterstudio.com';

export const metadata: Metadata = {
  // metadataBase makes every relative OG/canonical URL resolve to an absolute
  // https URL that social scrapers and search engines can actually fetch
  // (without it the one OG image resolved to http://localhost:3000).
  metadataBase: new URL(SITE_URL),
  title: 'CMA Studio — every frontier AI video, image & audio model, on your own key',
  description:
    'Stop renting credits that expire. One flat software fee for a cinematic studio over every top AI video, image and audio model — compute billed straight to your own fal.ai key at fal’s rate, no markup, and your renders kept in your library.',
  applicationName: 'CMA Studio',
  // openGraph/twitter deliberately omit title & description so each page's own
  // title/description flow into its social card automatically; only the shared
  // defaults (site name, card type, cover image) live here and cascade.
  openGraph: {
    type: 'website',
    siteName: 'CMA Studio',
    locale: 'en_US',
    images: [{ url: '/og-cover.png', width: 1200, height: 630, alt: 'CMA Studio — own your AI renders, on your own key' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og-cover.png'],
  },
  // Favicon + apple-touch icon come from app/icon.png and app/apple-icon.png
  // (the real gold logo on deep black), auto-wired by Next. PWA install icons
  // live in app/manifest.ts.
  appleWebApp: { capable: true, title: 'CMA Studio', statusBarStyle: 'black' },
};

// Organization structured data (site-wide entity for search) — one source of
// truth, emitted in the body so it ships in the SSR HTML of every page.
const ORG_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'CMA Studio',
  legalName: 'CineMaster Academy',
  url: SITE_URL,
  logo: `${SITE_URL}/logo-full.png`,
  description: 'A cinematic AI production studio over every top AI video, image and audio model, run on the user’s own fal.ai key.',
};

export const viewport: Viewport = {
  themeColor: '#07080b',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${inter.variable} ${mono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black text-[#f4efe6]">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }} />
        <Atmosphere />
        <div className="relative z-[2] flex min-h-full flex-1 flex-col">{children}</div>
        <PwaProvider />
      </body>
    </html>
  );
}
