'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Music2, Eye, EyeOff, ArrowRight, Disc3 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:3100/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('accessToken', data.accessToken);
        router.push('/dashboard');
      } else {
        // Demo fallback
        router.push('/dashboard');
      }
    } catch {
      // Demo fallback — always redirect
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-neon-purple/8 blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-neon-pink/6 blur-[100px]" />
      <div className="absolute top-10 right-10 animate-spin-slow opacity-5">
        <Disc3 size={200} />
      </div>

      <div className="w-full max-w-md relative animate-scale-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-pink via-neon-purple to-neon-blue flex items-center justify-center mb-4 shadow-xl shadow-neon-pink/20">
            <Music2 size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold font-display">Welcome back</h1>
          <p className="text-sm text-surface-400 mt-1">Log in to Auralux X</p>
        </div>

        {/* Social buttons */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full flex items-center justify-center gap-3 bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-sm font-semibold hover:bg-white/[0.08] transition-all group"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="text-surface-200 group-hover:text-white transition-colors">
              Continue with Google
            </span>
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full flex items-center justify-center gap-3 bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-sm font-semibold hover:bg-white/[0.08] transition-all group"
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <span className="text-surface-200 group-hover:text-white transition-colors">
              Continue with GitHub
            </span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-xs text-surface-500 font-medium">or</span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-surface-300 mb-2">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-surface-800/60 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder-surface-500 focus:outline-none focus:border-neon-pink/40 focus:ring-2 focus:ring-neon-pink/10 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-surface-800/60 border border-white/[0.06] rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-surface-500 focus:outline-none focus:border-neon-pink/40 focus:ring-2 focus:ring-neon-pink/10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-white transition-colors"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-surface-400 cursor-pointer">
              <input type="checkbox" className="rounded border-surface-600 bg-surface-800 text-neon-pink focus:ring-neon-pink/20" />
              Remember me
            </label>
            <a href="#" className="text-surface-400 hover:text-neon-pink transition-colors font-medium">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-neon-pink to-neon-purple text-white rounded-xl py-3.5 font-bold text-sm hover:shadow-lg hover:shadow-neon-pink/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Log in <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Sign up link */}
        <div className="text-center mt-8">
          <span className="text-sm text-surface-500">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-neon-pink hover:text-neon-pink/80 font-semibold transition-colors">
              Sign up for Auralux
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
