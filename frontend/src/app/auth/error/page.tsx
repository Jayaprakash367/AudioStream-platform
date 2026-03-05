'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AlertTriangle, RefreshCw, Home, Music2, Loader2 } from 'lucide-react';

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'You denied access to your Spotify account. Connect again to enable streaming.',
  invalid_state: 'The authentication session expired. Please try connecting again.',
  token_exchange_failed: 'Failed to authenticate with Spotify. Please try again.',
  session_creation_failed: 'Could not create your session. Our servers may be temporarily unavailable.',
  unknown: 'An unexpected error occurred during authentication.',
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const errorCode = searchParams.get('error') || 'unknown';
  const errorMessage = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.unknown;

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <div className="text-center space-y-6 p-8 max-w-md">
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse opacity-20" />
          <div className="relative w-full h-full bg-surface-900 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-12 h-12 text-red-400" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Connection Failed</h1>
          <p className="text-surface-400">{errorMessage}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => (window.location.href = `${process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:4001'}/auth/login`)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-white text-sm font-semibold transition-all hover:scale-105"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-surface-700 hover:border-surface-500 text-surface-300 text-sm transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </button>
        </div>

        <div className="pt-4 border-t border-surface-800">
          <p className="text-xs text-surface-500">
            Error code: <code className="text-surface-400">{errorCode}</code>
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-neon-pink">
          <Music2 className="w-4 h-4" />
          <span className="text-sm font-medium">Auralux X</span>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-950 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-neon-pink" /></div>}>
      <AuthErrorContent />
    </Suspense>
  );
}
