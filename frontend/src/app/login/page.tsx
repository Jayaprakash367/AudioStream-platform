'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Music2, Eye, EyeOff, ArrowRight, Disc3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password, rememberMe);
      router.push('/dashboard');
    } catch (err: any) {
      // Auth service down or bad credentials
      setError(err.message || 'Login failed. Please check your credentials.');
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

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-surface-300 mb-2">
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="w-full bg-surface-800/60 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder-surface-500 focus:outline-none focus:border-neon-pink/40 focus:ring-2 focus:ring-neon-pink/10 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full bg-surface-800/60 border border-white/[0.06] rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-surface-500 focus:outline-none focus:border-neon-pink/40 focus:ring-2 focus:ring-neon-pink/10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-white transition-colors"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2"
            >
              {error}
            </div>
          )}

          {/* Remember me + Forgot password */}
          <div className="flex items-center justify-between text-xs">
            <label
              htmlFor="remember-me"
              className="flex items-center gap-2 text-surface-400 cursor-pointer select-none"
            >
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="rounded border-surface-600 bg-surface-800 text-neon-pink focus:ring-neon-pink/20"
              />
              Remember me
            </label>
            <a href="#" className="text-surface-400 hover:text-neon-pink transition-colors font-medium">
              Forgot password?
            </a>
          </div>

          <button
            id="login-submit"
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
            <Link
              href="/signup"
              className="text-neon-pink hover:text-neon-pink/80 font-semibold transition-colors"
            >
              Sign up for Auralux
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
