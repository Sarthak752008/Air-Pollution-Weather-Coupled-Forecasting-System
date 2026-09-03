'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowRight, Activity, Github } from 'lucide-react';

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#06090e]/90 backdrop-blur-md border-b border-white/[0.08] shadow-2xl py-3'
          : 'bg-transparent border-b border-white/[0.04] py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:border-sky-400/60 transition-colors">
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              AeroSense
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                NCR
              </span>
            </span>
            <span className="text-[10px] text-slate-400 -mt-0.5 tracking-wide">
              Atmospheric Intelligence
            </span>
          </div>
        </Link>

        {/* Navigation Anchors */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-300">
          <a href="#product" className="hover:text-white transition-colors">
            Product
          </a>
          <a href="#how-it-works" className="hover:text-white transition-colors">
            How It Works
          </a>
          <a href="#technology" className="hover:text-white transition-colors">
            Technology
          </a>
          <a href="#research" className="hover:text-white transition-colors">
            Research
          </a>
        </nav>

        {/* Right Action CTAs */}
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/Sarthak752008/Air-Pollution-Weather-Coupled-Forecasting-System"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white border border-white/10 hover:border-white/20 rounded-md transition-all bg-white/[0.02] hover:bg-white/[0.05]"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub</span>
            <ArrowUpRight className="w-3 h-3 text-slate-500" />
          </a>

          <Link
            href="/workbench"
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-md transition-all shadow-[0_0_20px_rgba(56,189,248,0.25)] hover:shadow-[0_0_25px_rgba(56,189,248,0.4)]"
          >
            <span>Open Live Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
