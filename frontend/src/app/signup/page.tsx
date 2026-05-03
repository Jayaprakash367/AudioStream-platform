'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Music2, Eye, EyeOff, ArrowRight, Disc3, Headphones, Sparkles, Globe, Zap, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const PERKS = [
  { icon: Headphones, text: 'Lossless Hi-Res audio' },
  { icon: Sparkles, text: 'AI recommendations' },
  { icon: Globe, text: '100M+ songs, 50+ languages' },
  { icon: Zap, text: 'No credit card needed' },
];

export default function SignupPage() {
  const router = useRouter();
  const { register } = useAuth();

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
      await register({ displayName, username, email, password });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const containerVars = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.8, staggerChildren: 0.1 } }
  };
  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex relative overflow-hidden font-sans selection:bg-neon-purple/30">
      
      {/* ── Breathtaking Animated Background ── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, -90, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-gradient-to-l from-neon-purple/10 to-transparent blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.5, 1], rotate: [0, 90, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-neon-pink/10 to-transparent blur-[150px]"
        />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      {/* Left panel — info/branding */}
      <div className="hidden lg:flex flex-col justify-center w-1/2 relative px-20 z-10">
        <motion.div variants={containerVars} initial="hidden" animate="visible" className="relative">
          {/* Logo */}
          <motion.div variants={itemVars} className="flex items-center gap-3 mb-16">
            <div className="relative group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-tr from-neon-pink to-neon-blue rounded-xl blur-md opacity-40 group-hover:opacity-70 transition-opacity duration-500" />
              <div className="relative w-12 h-12 rounded-xl bg-surface-950 border border-white/10 flex items-center justify-center">
                <Music2 size={24} className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
              </div>
            </div>
            <span className="text-2xl font-bold font-display tracking-tight text-white">
              Aura<span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-pink to-neon-purple">lux</span> X
            </span>
          </motion.div>

          <motion.h2 variants={itemVars} className="text-5xl font-extrabold font-display leading-[1.1] mb-6 text-white">
            Start Your
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-pink to-neon-purple">Musical Journey</span>
          </motion.h2>
          
          <motion.p variants={itemVars} className="text-surface-400 text-lg leading-relaxed mb-12 max-w-md">
            Join millions of listeners and discover immersive audio from every corner of the world.
          </motion.p>

          {/* Perks */}
          <motion.div variants={itemVars} className="space-y-5 mb-16">
            {PERKS.map((perk, i) => (
              <motion.div 
                key={perk.text} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + (i * 0.1) }}
                className="flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-[inset_0_0_15px_rgba(255,255,255,0.02)]">
                  <perk.icon size={18} className="text-neon-pink" />
                </div>
                <span className="text-[15px] text-surface-200 font-medium tracking-wide">{perk.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Social proof */}
          <motion.div variants={itemVars} className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {['🎵', '🎶', '🎸', '🎹'].map((e, i) => (
                <div key={i} className="w-10 h-10 rounded-full bg-surface-900 border-2 border-[#050505] flex items-center justify-center text-sm shadow-xl">
                  {e}
                </div>
              ))}
            </div>
            <div className="text-sm">
              <span className="text-white font-bold">15M+</span> <span className="text-surface-500">music lovers</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md relative"
        >
          {/* Glassmorphic Form Card */}
          <div className="absolute -inset-0.5 bg-gradient-to-b from-white/10 to-transparent rounded-[2rem] blur-[2px] pointer-events-none" />
          <div className="relative bg-surface-900/40 backdrop-blur-2xl border border-white/10 p-8 sm:p-10 rounded-[2rem] shadow-2xl">
            
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
                {step === 1 ? 'Create account' : 'Final details'}
              </h1>
              <p className="text-sm text-surface-400 font-medium">
                {step === 1 ? 'Enter your email to get started.' : 'Choose a unique username and password.'}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-2 mb-8">
              <div className="h-1.5 flex-1 rounded-full bg-gradient-to-r from-neon-pink to-neon-purple" />
              <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step === 2 ? 'bg-gradient-to-r from-neon-purple to-neon-blue' : 'bg-surface-800'}`} />
            </div>

            <form onSubmit={handleSignup} className="space-y-5">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                  >
                    <div className="relative group">
                      <input
                        id="signup-email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder=" "
                        required
                        className="peer w-full bg-black/20 border border-white/10 rounded-xl px-4 pt-6 pb-2 text-white outline-none transition-all focus:border-neon-pink/50 focus:bg-black/40 hover:border-white/20"
                      />
                      <label 
                        htmlFor="signup-email"
                        className="absolute left-4 top-4 text-surface-400 text-sm transition-all duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:text-neon-pink font-medium pointer-events-none uppercase tracking-wider peer-valid:top-1.5 peer-valid:text-[11px]"
                      >
                        Email Address
                      </label>
                    </div>

                    <div className="flex items-center gap-4 py-2">
                      <div className="flex-1 h-px bg-white/[0.06]" />
                      <span className="text-[11px] text-surface-500 font-bold uppercase tracking-widest">Or continue with</span>
                      <div className="flex-1 h-px bg-white/[0.06]" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 rounded-xl py-3 hover:bg-white/10 transition-colors">
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span className="text-xs font-semibold text-surface-200">Google</span>
                      </button>
                      <button type="button" className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 rounded-xl py-3 hover:bg-white/10 transition-colors">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                        <span className="text-xs font-semibold text-surface-200">GitHub</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                  >
                    <div className="relative group">
                      <input
                        id="signup-displayName"
                        type="text"
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        placeholder=" "
                        required
                        className="peer w-full bg-black/20 border border-white/10 rounded-xl px-4 pt-6 pb-2 text-white outline-none transition-all focus:border-neon-purple/50 focus:bg-black/40 hover:border-white/20"
                      />
                      <label 
                        htmlFor="signup-displayName"
                        className="absolute left-4 top-4 text-surface-400 text-sm transition-all duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:text-neon-purple font-medium pointer-events-none uppercase tracking-wider peer-valid:top-1.5 peer-valid:text-[11px]"
                      >
                        Display Name
                      </label>
                    </div>

                    <div className="relative group">
                      <input
                        id="signup-username"
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder=" "
                        required
                        className="peer w-full bg-black/20 border border-white/10 rounded-xl px-4 pt-6 pb-2 pl-8 text-white outline-none transition-all focus:border-neon-purple/50 focus:bg-black/40 hover:border-white/20"
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 font-medium">@</span>
                      <label 
                        htmlFor="signup-username"
                        className="absolute left-8 top-4 text-surface-400 text-sm transition-all duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1.5 peer-focus:-left-0 peer-focus:text-[11px] peer-focus:text-neon-purple font-medium pointer-events-none uppercase tracking-wider peer-valid:top-1.5 peer-valid:-left-0 peer-valid:text-[11px]"
                      >
                        Username
                      </label>
                    </div>

                    <div className="relative group">
                      <input
                        id="signup-password"
                        type={showPw ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder=" "
                        minLength={8}
                        required
                        className="peer w-full bg-black/20 border border-white/10 rounded-xl px-4 pt-6 pb-2 pr-12 text-white outline-none transition-all focus:border-neon-purple/50 focus:bg-black/40 hover:border-white/20"
                      />
                      <label 
                        htmlFor="signup-password"
                        className="absolute left-4 top-4 text-surface-400 text-sm transition-all duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:text-neon-purple font-medium pointer-events-none uppercase tracking-wider peer-valid:top-1.5 peer-valid:text-[11px]"
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-white transition-colors"
                      >
                        {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    {password && (
                      <div className="flex items-center gap-1.5 mt-2">
                        {[1, 2, 3, 4].map(level => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              password.length >= level * 3
                                ? level <= 2
                                  ? 'bg-neon-orange'
                                  : 'bg-neon-cyan shadow-[0_0_8px_rgba(0,255,255,0.5)]'
                                : 'bg-surface-800'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="text-[13px] text-red-200 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 font-medium mt-2">
                      {error}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3 pt-2">
                {step === 2 && (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-shrink-0 w-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-surface-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <ArrowLeft size={18} />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="relative flex-1 group overflow-hidden rounded-xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-neon-pink to-neon-purple opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-[url('/noise.png')] mix-blend-overlay" />
                  <div className="relative px-6 py-4 flex items-center justify-center gap-2 text-white font-bold tracking-wide uppercase text-sm">
                    {loading ? (
                      <motion.div 
                        animate={{ rotate: 360 }} 
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                    ) : step === 1 ? (
                      <>Next Step <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                    ) : (
                      <>Create Account <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform" /></>
                    )}
                  </div>
                </button>
              </div>
            </form>

            {/* Footer / Login Link */}
            <div className="mt-8 text-center">
              <p className="text-[11px] text-surface-500 mb-4 leading-relaxed font-medium px-4">
                By signing up, you agree to our <a href="#" className="text-surface-300 hover:text-white underline decoration-white/20 underline-offset-2">Terms</a> & <a href="#" className="text-surface-300 hover:text-white underline decoration-white/20 underline-offset-2">Privacy</a>.
              </p>
              <p className="text-surface-400 font-medium text-sm">
                Already have an account?{' '}
                <Link href="/login" className="text-white hover:text-neon-pink transition-colors relative group inline-block">
                  Log in
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-neon-pink transition-all duration-300 group-hover:w-full" />
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
