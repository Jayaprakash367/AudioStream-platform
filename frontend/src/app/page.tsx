'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Music2, Headphones, Radio, Zap, Globe, Shield, Sparkles, Play,
  ArrowRight, Check, Star, Users, Disc3, ChevronRight,
} from 'lucide-react';

const FEATURES = [
  { icon: Headphones, title: 'Lossless Audio', desc: 'Crystal-clear 24-bit/192kHz Hi-Res audio streaming', color: 'from-neon-pink to-neon-purple' },
  { icon: Zap, title: 'Ultra-Low Latency', desc: 'Sub-50ms streaming with edge computing CDN', color: 'from-neon-cyan to-neon-blue' },
  { icon: Radio, title: 'AI-Powered Radio', desc: 'Smart recommendations that learn your taste', color: 'from-neon-orange to-neon-yellow' },
  { icon: Globe, title: 'Global Library', desc: '100M+ songs in 50+ languages worldwide', color: 'from-neon-purple to-neon-blue' },
  { icon: Shield, title: 'Offline Mode', desc: 'Download and listen anywhere, anytime', color: 'from-neon-mint to-neon-cyan' },
  { icon: Users, title: 'Social Playlists', desc: 'Collaborate on playlists with friends in real-time', color: 'from-neon-pink to-neon-orange' },
];

const STATS = [
  { value: '100M+', label: 'Songs' },
  { value: '50+', label: 'Languages' },
  { value: '15M+', label: 'Users' },
  { value: '99.9%', label: 'Uptime' },
];

const LANGUAGES_SHOWCASE = [
  'English', 'Hindi', 'Tamil', 'Telugu', 'Korean', 'Japanese', 'Spanish',
  'Arabic', 'French', 'Punjabi', 'Malayalam', 'Mandarin', 'Portuguese',
  'Turkish', 'German', 'Italian', 'Bengali', 'Marathi', 'Kannada',
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="min-h-screen bg-surface-950 text-white overflow-x-hidden">
      {/* ─── Navbar ───────────────────────────────── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-surface-950/90 backdrop-blur-xl border-b border-white/[0.04] py-3' : 'py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neon-pink via-neon-purple to-neon-blue flex items-center justify-center shadow-lg shadow-neon-pink/20">
              <Music2 className="text-white" size={18} />
            </div>
            <span className="text-lg font-bold font-display">
              Aura<span className="text-gradient-pink">lux</span>
              <span className="text-[10px] ml-1.5 px-1.5 py-0.5 rounded-full bg-neon-pink/15 text-neon-pink font-semibold align-middle">
                X
              </span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {['Features', 'Languages', 'Pricing', 'About'].map(item => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm text-surface-400 hover:text-white transition-colors font-medium"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-surface-300 hover:text-white transition-colors font-semibold px-4 py-2"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-white text-surface-950 rounded-full px-5 py-2 font-bold hover:scale-105 transition-transform shadow-lg shadow-white/10"
            >
              Sign up free
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        {/* Ambient background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-neon-purple/8 blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-neon-pink/8 blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-neon-blue/5 blur-[120px]" />
        </div>

        <div className="relative text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] rounded-full px-4 py-1.5 mb-8 animate-slide-down">
            <Sparkles size={12} className="text-neon-yellow" />
            <span className="text-xs font-semibold text-surface-300">
              Now streaming in <span className="text-neon-cyan">50+ languages</span>
            </span>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold font-display leading-[0.9] mb-6 animate-slide-up">
            Music Without
            <br />
            <span className="text-gradient-pink">Boundaries</span>
          </h1>

          <p className="text-lg md:text-xl text-surface-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in">
            Stream 100 million+ songs in every language. AI-powered recommendations,
            lossless audio, and a community of music lovers worldwide.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-slide-up">
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="bg-surface-800/60 border border-white/[0.08] rounded-full pl-5 pr-32 py-4 text-base text-white placeholder-surface-500 focus:outline-none focus:border-neon-pink/40 focus:ring-2 focus:ring-neon-pink/10 w-80 transition-all"
              />
              <Link
                href="/signup"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-gradient-to-r from-neon-pink to-neon-purple text-white rounded-full px-6 py-2.5 text-sm font-bold hover:shadow-lg hover:shadow-neon-pink/30 transition-all flex items-center gap-1.5"
              >
                Start Free <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 md:gap-12 animate-fade-in">
            {STATS.map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-extrabold text-gradient-pink font-display">
                  {stat.value}
                </div>
                <div className="text-xs text-surface-500 font-medium mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <div className="w-6 h-10 rounded-full border-2 border-surface-600 flex items-start justify-center p-1.5">
            <div className="w-1 h-2 rounded-full bg-surface-400 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ─── Languages Showcase ───────────────────── */}
      <section id="languages" className="py-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold font-display mb-3">
            Every Language. <span className="text-gradient-cyan">Every Beat.</span>
          </h2>
          <p className="text-surface-400 max-w-lg mx-auto">
            From K-Pop to Bollywood, J-Pop to Reggaeton — music from every corner of the world
          </p>
        </div>

        {/* Scrolling language pills */}
        <div className="relative">
          <div className="flex gap-3 animate-marquee whitespace-nowrap">
            {[...LANGUAGES_SHOWCASE, ...LANGUAGES_SHOWCASE].map((lang, i) => (
              <span
                key={`${lang}-${i}`}
                className="inline-block px-5 py-2.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-sm font-medium text-surface-300 hover:bg-neon-pink/10 hover:border-neon-pink/20 hover:text-white transition-all cursor-pointer"
              >
                {lang}
              </span>
            ))}
          </div>
          <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-surface-950 to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-surface-950 to-transparent pointer-events-none" />
        </div>
      </section>

      {/* ─── Features ─────────────────────────────── */}
      <section id="features" className="py-20 px-6 relative">
        <div className="absolute inset-0 bg-mesh opacity-40" />
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold font-display mb-3">
              Built for <span className="text-gradient-pink">Music Lovers</span>
            </h2>
            <p className="text-surface-400 max-w-lg mx-auto">
              Enterprise-grade streaming technology meets beautiful design
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="group relative bg-white/[0.02] border border-white/[0.05] rounded-2xl p-7 hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-500 hover-lift"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                  <f.icon size={22} className="text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-surface-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ──────────────────────────────── */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold font-display mb-3">
              Simple <span className="text-gradient-warm">Pricing</span>
            </h2>
            <p className="text-surface-400">Start free. Upgrade anytime.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free */}
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-7 hover:border-white/[0.10] transition-all">
              <div className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-4">Free</div>
              <div className="text-4xl font-extrabold mb-1">$0</div>
              <div className="text-sm text-surface-500 mb-6">Forever free</div>
              <Link
                href="/signup"
                className="block w-full text-center bg-surface-800 hover:bg-surface-700 text-white rounded-full py-3 font-semibold text-sm transition-colors mb-6"
              >
                Get Started
              </Link>
              <ul className="space-y-3">
                {['Shuffle-only playback', 'Ad-supported', 'Standard quality audio', '15+ languages', 'Basic recommendations'].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-surface-400">
                    <Check size={14} className="text-surface-500 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Premium */}
            <div className="relative bg-gradient-to-b from-neon-pink/10 to-surface-950 border border-neon-pink/20 rounded-2xl p-7 shadow-xl shadow-neon-pink/5">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-neon-pink to-neon-purple text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1 rounded-full shadow-lg">
                Most Popular
              </div>
              <div className="text-xs font-bold text-neon-pink uppercase tracking-wider mb-4">Premium</div>
              <div className="text-4xl font-extrabold mb-1">
                $9<span className="text-xl">.99</span>
              </div>
              <div className="text-sm text-surface-500 mb-6">per month</div>
              <Link
                href="/signup"
                className="block w-full text-center bg-gradient-to-r from-neon-pink to-neon-purple text-white rounded-full py-3 font-bold text-sm hover:shadow-lg hover:shadow-neon-pink/30 transition-all mb-6"
              >
                Start Free Trial
              </Link>
              <ul className="space-y-3">
                {['Ad-free listening', 'On-demand playback', 'Hi-Res Lossless audio', '50+ languages', 'AI recommendations', 'Offline downloads', 'Lyrics display'].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-surface-300">
                    <Check size={14} className="text-neon-pink mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Family */}
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-7 hover:border-white/[0.10] transition-all">
              <div className="text-xs font-bold text-neon-cyan uppercase tracking-wider mb-4">Family</div>
              <div className="text-4xl font-extrabold mb-1">
                $15<span className="text-xl">.99</span>
              </div>
              <div className="text-sm text-surface-500 mb-6">per month, up to 6 accounts</div>
              <Link
                href="/signup"
                className="block w-full text-center bg-surface-800 hover:bg-surface-700 text-white rounded-full py-3 font-semibold text-sm transition-colors mb-6"
              >
                Start Free Trial
              </Link>
              <ul className="space-y-3">
                {['Everything in Premium', '6 individual accounts', 'Family mix playlists', 'Parental controls', 'Shared billing', 'Kids-safe mode'].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-surface-400">
                    <Check size={14} className="text-neon-cyan mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto relative">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-neon-pink/20 via-neon-purple/20 to-neon-blue/20 blur-xl" />
          <div className="relative bg-surface-900/80 border border-white/[0.06] rounded-3xl p-12 text-center">
            <Disc3 size={40} className="text-neon-pink mx-auto mb-5 animate-spin-slow" />
            <h2 className="text-3xl md:text-4xl font-extrabold font-display mb-4">
              Ready to Start Listening?
            </h2>
            <p className="text-surface-400 mb-8 max-w-lg mx-auto">
              Join 15 million+ music lovers streaming their favorite songs across the globe.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-neon-pink to-neon-purple text-white rounded-full px-8 py-4 font-bold text-base hover:shadow-xl hover:shadow-neon-pink/30 hover:scale-105 transition-all"
            >
              Get Auralux Free <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────── */}
      <footer className="border-t border-white/[0.04] py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center">
                  <Music2 size={15} className="text-white" />
                </div>
                <span className="font-bold font-display">Auralux X</span>
              </div>
              <p className="text-xs text-surface-500 leading-relaxed">
                Next-generation music streaming platform with AI-powered recommendations and lossless audio.
              </p>
            </div>
            {[
              { title: 'Company', links: ['About', 'Jobs', 'Press', 'Blog'] },
              { title: 'Communities', links: ['Artists', 'Developers', 'Investors', 'Vendors'] },
              { title: 'Useful Links', links: ['Support', 'Mobile App', 'Free Plan', 'Premium'] },
              { title: 'Legal', links: ['Privacy', 'Terms', 'Cookies', 'Licenses'] },
            ].map(section => (
              <div key={section.title}>
                <h4 className="text-xs font-bold text-surface-300 uppercase tracking-wider mb-4">
                  {section.title}
                </h4>
                <ul className="space-y-2">
                  {section.links.map(link => (
                    <li key={link}>
                      <a href="#" className="text-sm text-surface-500 hover:text-white transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/[0.04] pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xs text-surface-600">© 2025 Auralux X. All rights reserved.</div>
            <div className="flex items-center gap-4">
              {['Twitter', 'Instagram', 'Discord', 'GitHub'].map(s => (
                <a key={s} href="#" className="text-xs text-surface-600 hover:text-white transition-colors">
                  {s}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
