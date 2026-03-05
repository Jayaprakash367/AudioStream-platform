'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Music2, Eye, EyeOff, ArrowRight, Disc3, Check, Headphones, Sparkles, Globe, Zap } from 'lucide-react';

const PERKS = [
  { icon: Headphones, text: 'Lossless Hi-Res audio' },
  { icon: Sparkles, text: 'AI recommendations' },
  { icon: Globe, text: '100M+ songs, 50+ languages' },
  { icon: Zap, text: 'No credit card needed' },
];

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!email) return;
      setStep(2);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:3100/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, username, email, password }),
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch {
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex relative overflow-hidden">
      {/* Left panel — info/branding */}
      <div className="hidden lg:flex flex-col justify-center w-1/2 relative px-16">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-neon-pink/10 via-neon-purple/5 to-surface-950" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-neon-purple/10 blur-[80px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[200px] h-[200px] rounded-full bg-neon-pink/8 blur-[60px]" />
        <div className="absolute top-20 right-20 animate-spin-slow opacity-[0.03]">
          <Disc3 size={300} />
        </div>

        <div className="relative">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-12">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-pink via-neon-purple to-neon-blue flex items-center justify-center shadow-lg shadow-neon-pink/20">
              <Music2 size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold font-display">
              Aura<span className="text-gradient-pink">lux</span> X
            </span>
          </div>

          <h2 className="text-4xl font-extrabold font-display leading-tight mb-4">
            Start Your
            <br />
            <span className="text-gradient-pink">Musical Journey</span>
          </h2>
          <p className="text-surface-400 text-lg leading-relaxed mb-10 max-w-md">
            Join millions of listeners and discover music from every corner of the world.
          </p>

          {/* Perks */}
          <div className="space-y-4 mb-10">
            {PERKS.map(perk => (
              <div key={perk.text} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                  <perk.icon size={16} className="text-neon-pink" />
                </div>
                <span className="text-sm text-surface-300 font-medium">{perk.text}</span>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {['🎵', '🎶', '🎸', '🎹'].map((e, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-surface-800 border-2 border-surface-950 flex items-center justify-center text-sm">
                  {e}
                </div>
              ))}
            </div>
            <div className="text-xs text-surface-500">
              <span className="text-surface-300 font-semibold">15M+</span> music lovers already here
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-scale-in">
          {/* Mobile logo */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neon-pink via-neon-purple to-neon-blue flex items-center justify-center mb-3 shadow-xl shadow-neon-pink/20">
              <Music2 size={24} className="text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold font-display mb-1">
            {step === 1 ? 'Sign up to start listening' : 'Create your account'}
          </h1>
          <p className="text-sm text-surface-400 mb-8">
            {step === 1 ? 'Enter your email to get started' : 'Just a few more details'}
          </p>

          {/* Progress indicator */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`h-1 flex-1 rounded-full transition-all ${step >= 1 ? 'bg-gradient-to-r from-neon-pink to-neon-purple' : 'bg-surface-800'}`} />
            <div className={`h-1 flex-1 rounded-full transition-all ${step >= 2 ? 'bg-gradient-to-r from-neon-purple to-neon-blue' : 'bg-surface-800'}`} />
          </div>

          {/* Social buttons (step 1) */}
          {step === 1 && (
            <>
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
                  <span className="text-surface-200 group-hover:text-white">Sign up with Google</span>
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full flex items-center justify-center gap-3 bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-sm font-semibold hover:bg-white/[0.08] transition-all group"
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  <span className="text-surface-200 group-hover:text-white">Sign up with GitHub</span>
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-xs text-surface-500 font-medium">or</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            {step === 1 && (
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
            )}

            {step === 2 && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-surface-300 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    required
                    className="w-full bg-surface-800/60 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder-surface-500 focus:outline-none focus:border-neon-pink/40 focus:ring-2 focus:ring-neon-pink/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="@username"
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
                      placeholder="Min. 8 characters"
                      minLength={8}
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
                  {/* Password strength */}
                  {password && (
                    <div className="flex items-center gap-1 mt-2">
                      {[1, 2, 3, 4].map(level => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-all ${
                            password.length >= level * 3
                              ? level <= 2
                                ? 'bg-neon-orange'
                                : 'bg-neon-cyan'
                              : 'bg-surface-700'
                          }`}
                        />
                      ))}
                      <span className="text-[10px] text-surface-500 ml-2">
                        {password.length < 8 ? 'Too short' : password.length < 12 ? 'Good' : 'Strong'}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}

            {error && (
              <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-neon-pink to-neon-purple text-white rounded-xl py-3.5 font-bold text-sm hover:shadow-lg hover:shadow-neon-pink/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : step === 1 ? (
                <>Next <ArrowRight size={16} /></>
              ) : (
                <>Create Account <ArrowRight size={16} /></>
              )}
            </button>

            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-surface-400 hover:text-white text-sm font-medium py-2 transition-colors"
              >
                ← Back
              </button>
            )}
          </form>

          {/* Terms */}
          <p className="text-[10px] text-surface-600 text-center mt-6 leading-relaxed">
            By signing up, you agree to our{' '}
            <a href="#" className="text-surface-400 hover:text-white">Terms of Service</a> and{' '}
            <a href="#" className="text-surface-400 hover:text-white">Privacy Policy</a>.
          </p>

          {/* Login link */}
          <div className="text-center mt-6">
            <span className="text-sm text-surface-500">
              Already have an account?{' '}
              <Link href="/login" className="text-neon-pink hover:text-neon-pink/80 font-semibold transition-colors">
                Log in
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
