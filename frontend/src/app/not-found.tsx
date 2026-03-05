import { Music2, Home, Search } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950 px-4">
      <div className="text-center max-w-md space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center">
          <Music2 className="w-8 h-8 text-pink-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent font-outfit">
            404
          </h1>
          <h2 className="text-xl font-semibold text-white">
            Page not found
          </h2>
          <p className="text-zinc-400 text-sm">
            This track seems to have been removed from the playlist. Let&apos;s get you back on track.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            <Search className="w-4 h-4" />
            Browse Music
          </Link>
        </div>
      </div>
    </div>
  );
}
