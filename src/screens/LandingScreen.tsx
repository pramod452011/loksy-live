import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Shield, Compass, Heart, ArrowRight, Video, MessageCircle } from 'lucide-react';

export const LandingScreen: React.FC = () => {
  const { navigateTo, login } = useApp();

  const handleQuickDemo = () => {
    login('aarav@loksy.app', 'Aarav Sharma');
  };

  const highlights = [
    {
      icon: Compass,
      title: 'Desi Stories & Reels',
      desc: 'Celebrate regional cultures, arts, travels, street food, and indie music.',
      color: 'from-[#FF4668] to-[#FF8A00]',
    },
    {
      icon: Heart,
      title: 'Genuine Community',
      desc: 'Connect with people who share your passion. No toxic algorithms, just authentic stories.',
      color: 'from-[#FF8A00] to-[#E040FB]',
    },
    {
      icon: Shield,
      title: 'Safety First Platform',
      desc: 'Proactive blocking, reporting, and moderation built for your digital peace of mind.',
      color: 'from-[#00E5FF] to-[#6366F1]',
    },
  ];

  return (
    <div id="loksy-landing-page" className="min-h-screen bg-[#070A12] text-white flex flex-col justify-between relative overflow-hidden">
      {/* Background Ambience / Gradient orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-[#FF4668]/20 via-[#FF8A00]/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-[300px] h-[300px] bg-[#00E5FF]/10 blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-10 max-w-6xl mx-auto w-full px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 select-none">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 aspect-square bg-[#070A12] border border-white/15 p-0.5 shadow-md shadow-[#FF4668]/20 flex items-center justify-center">
            <img
              src="/loksy-logo.png"
              alt="LOKSY Logo"
              className="w-full h-full aspect-square object-contain drop-shadow"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src.endsWith('.png')) {
                  target.src = '/loksy-logo.svg';
                }
              }}
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="font-black text-2xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent font-sans leading-none">
              LOK<span className="bg-gradient-to-r from-[#FF4668] to-[#FF9E00] bg-clip-text text-transparent">SY</span>
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF4668] animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            id="landing-login-nav-btn"
            onClick={() => navigateTo('login')}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-all"
          >
            Log In
          </button>
          <button
            id="landing-signup-nav-btn"
            onClick={() => navigateTo('signup')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF4668] to-[#FF8A00] text-white text-sm font-bold shadow-md shadow-[#FF4668]/20 hover:brightness-110 active:scale-95 transition-all"
          >
            Join LOKSY
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-10 sm:py-12 text-center flex-1 flex flex-col items-center justify-center">
        {/* Featured Square LOKSY App Logo Showcase */}
        <div className="relative mb-5 group select-none">
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-[#FF4668] via-[#FF8A00] to-[#00E5FF] opacity-60 blur-xl group-hover:opacity-90 transition-all duration-500 pointer-events-none" />
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-2 border-white/20 bg-[#070A12] shadow-2xl p-1.5 flex items-center justify-center aspect-square ring-1 ring-white/10 group-hover:scale-105 transition-transform duration-300">
            <img
              src="/loksy-logo.png"
              alt="LOKSY Official Logo"
              className="w-full h-full aspect-square object-contain drop-shadow-2xl"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src.endsWith('.png')) {
                  target.src = '/loksy-logo.svg';
                }
              }}
            />
          </div>
        </div>

        {/* Tagline Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-xs font-semibold text-[#FF8A00] mb-6 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-[#FF8A00]" />
          <span>Apni Duniya, Apne Log</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6">
          India's Next-Gen <br />
          <span className="bg-gradient-to-r from-[#FF4668] via-[#FFA000] to-[#00E5FF] bg-clip-text text-transparent">
            Social Expression
          </span>
        </h1>

        <p className="max-w-xl text-gray-300 text-base sm:text-lg leading-relaxed mb-8">
          A vibrant space crafted for Indian creators, storytellers, travelers, and thinkers.
          Share moments, watch captivating reels, and chat with your community.
        </p>

        {/* Primary CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full max-w-md mb-12">
          <button
            id="landing-get-started-btn"
            onClick={() => navigateTo('signup')}
            className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#FF4668] via-[#FF8A00] to-[#E040FB] text-white font-bold text-base shadow-xl shadow-[#FF4668]/30 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Create Free Account</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            id="landing-demo-explore-btn"
            onClick={handleQuickDemo}
            className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold text-base transition-all flex items-center justify-center gap-2"
          >
            <span>Explore Demo Feed</span>
          </button>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full text-left">
          {highlights.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-[#0B0F19]/80 border border-white/5 hover:border-white/15 transition-all"
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${item.color} p-[1px] mb-3 flex items-center justify-center`}
                >
                  <div className="w-full h-full rounded-[11px] bg-[#070A12] flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <h3 className="font-bold text-white text-base mb-1">{item.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-6 px-6 text-center text-xs text-gray-500">
        <p className="mb-1">LOKSY — "Apni Duniya, Apne Log" • Made with pride in India 🇮🇳</p>
        <p className="text-[11px] text-gray-600">
          Designed mobile-first. Ready for seamless Firebase & Android integration.
        </p>
      </footer>
    </div>
  );
};
