'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, Music2 } from 'lucide-react';

function AuthSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          const redirect = searchParams.get('redirect') || '/dashboard';
          router.push(redirect);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <div className="text-center space-y-6 p-8">
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 bg-gradient-to-r from-neon-pink to-neon-purple rounded-full animate-pulse opacity-30" />
          <div className="relative w-full h-full bg-surface-900 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-neon-cyan" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Connected to Spotify!</h1>
          <p className="text-surface-400">Your account is now linked. Enjoy full-quality streaming.</p>
        </div>

        <div className="flex items-center justify-center gap-2 text-surface-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Redirecting in {countdown}s...</span>
        </div>

        <div className="flex items-center justify-center gap-2 text-neon-pink">
          <Music2 className="w-4 h-4" />
          <span className="text-sm font-medium">Auralux X</span>
        </div>
      </div>
    </div>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-950 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-neon-pink" /></div>}>
      <AuthSuccessContent />
    </Suspense>
  );
}
