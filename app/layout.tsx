import type { Metadata } from 'next';
import { Sora, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Atmosphere } from '@/components/Atmosphere';

const sora = Sora({ variable: '--font-sora', subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], display: 'swap' });
const inter = Inter({ variable: '--font-inter', subsets: ['latin'], display: 'swap' });
const mono = JetBrains_Mono({ variable: '--font-mono', subsets: ['latin'], weight: ['400', '500', '600'], display: 'swap' });

export const metadata: Metadata = {
  title: 'CMA Studio — Virtual Camera Package | CineMaster Academy',
  description:
    'Direct it before you shoot it. A Bring-Your-Own-Key virtual camera package that renders cinematic video & photos from real film-camera and lens signatures — powered by Fal.ai.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${inter.variable} ${mono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black text-[#f4efe6]">
        <Atmosphere />
        <div className="relative z-[2] flex min-h-full flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
