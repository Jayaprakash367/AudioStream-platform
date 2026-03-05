import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import NowPlayingBar from '@/components/player/NowPlayingBar';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'Auralux X — Stream Music in Every Language',
  description:
    'Discover, stream, and share music from around the world. 100M+ songs in 50+ languages. Lossless audio, AI recommendations, and more.',
  keywords: ['music', 'streaming', 'songs', 'playlists', 'global music', 'lossless audio'],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: '#ec4899',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="min-h-screen bg-surface-950 text-zinc-50 antialiased font-sans selection:bg-neon-pink/30 selection:text-white">
        <Providers>
          <main className="pb-[88px]">{children}</main>
          <NowPlayingBar />
        </Providers>
      </body>
    </html>
  );
}
