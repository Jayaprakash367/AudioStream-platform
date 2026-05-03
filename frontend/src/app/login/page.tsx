'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Music2, Eye, EyeOff, ArrowRight, Disc3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

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
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Animation variants
  const containerVars = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1], staggerChildren: 0.1 }
    }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 relative overflow-hidden font-sans selection:bg-neon-pink/30">
      
      {/* ── Breathtaking Animated Background ── */}
      <div className="absolute inset-0 z-0">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-r from-neon-purple/20 to-transparent blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.5, 1], rotate: [0, -90, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[40%] -right-[20%] w-[700px] h-[700px] rounded-full bg-gradient-to-l from-neon-pink/20 to-transparent blur-[150px]"
        />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <motion.div 
        variants={containerVars}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md relative z-10"
      >
        {/* Logo & Header */}
        <motion.div variants={itemVars} className="flex flex-col items-center mb-10 text-center">
          <div className="relative group cursor-pointer mb-6">
            <div className="absolute inset-0 bg-gradient-to-tr from-neon-pink to-neon-blue rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-500" />
            <div className="relative w-16 h-16 rounded-2xl bg-surface-950 border border-white/10 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent" />
              <Music2 size={32} className="text-white relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/50 tracking-tight mb-2">
            Welcome back
          </h1>
          <p className="text-surface-400 font-medium">
            Enter your credentials to access <span className="text-white">Auralux X</span>
          </p>
        </motion.div>

        {/* Glassmorphic Form Card */}
        <motion.div variants={itemVars} className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-b from-white/10 to-transparent rounded-[2rem] blur-[2px] pointer-events-none" />
          <div className="relative bg-surface-900/40 backdrop-blur-2xl border border-white/10 p-8 rounded-[2rem] shadow-2xl">
            
            <form onSubmit={handleLogin} className="space-y-5">
              
              <div className="relative group">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder=" "
                  required
                  className="peer w-full bg-black/20 border border-white/10 rounded-xl px-4 pt-6 pb-2 text-white outline-none transition-all focus:border-neon-pink/50 focus:bg-black/40 hover:border-white/20"
                />
                <label 
                  htmlFor="email"
                  className="absolute left-4 top-4 text-surface-400 text-sm transition-all duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:text-neon-pink font-medium pointer-events-none uppercase tracking-wider peer-valid:top-1.5 peer-valid:text-[11px]"
                >
                  Email Address
                </label>
              </div>

              <div className="relative group">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder=" "
                  required
                  className="peer w-full bg-black/20 border border-white/10 rounded-xl px-4 pt-6 pb-2 pr-12 text-white outline-none transition-all focus:border-neon-purple/50 focus:bg-black/40 hover:border-white/20"
                />
                <label 
                  htmlFor="password"
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

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="text-[13px] text-red-200 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 font-medium">
                      {error}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-4 h-4">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-4 h-4 border border-surface-500 rounded peer-checked:bg-neon-pink peer-checked:border-neon-pink transition-colors group-hover:border-neon-pink/50" />
                    <motion.svg 
                      initial={false}
                      animate={rememberMe ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                      className="absolute w-3 h-3 text-white pointer-events-none" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="3" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </motion.svg>
                  </div>
                  <span className="text-sm font-medium text-surface-300 group-hover:text-white transition-colors select-none">
                    Remember me
                  </span>
                </label>
                <Link href="#" className="text-sm font-medium text-surface-400 hover:text-white transition-colors">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="relative w-full group overflow-hidden rounded-xl mt-4"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-neon-pink to-neon-purple opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-[url('/noise.png')] mix-blend-overlay" />
                <div className="relative px-6 py-4 flex items-center justify-center gap-2 text-white font-bold tracking-wide">
                  {loading ? (
                    <motion.div 
                      animate={{ rotate: 360 }} 
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <>
                      SIGN IN
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </button>

            </form>
          </div>
        </motion.div>

        <motion.div variants={itemVars} className="mt-8 text-center">
          <p className="text-surface-400 font-medium">
            New to Auralux?{' '}
            <Link href="/signup" className="text-white hover:text-neon-pink transition-colors relative group inline-block">
              Create an account
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-neon-pink transition-all duration-300 group-hover:w-full" />
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
