'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Zap, ArrowRight } from 'lucide-react';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border-hairline)] bg-[var(--bg-base)]/85 backdrop-blur-md transition-all">
      <div className="h-16 sm:h-20 px-6 sm:px-12 flex items-center justify-between max-w-7xl w-full mx-auto">
        <Link href="/" className="flex items-center gap-3.5">
          <motion.div
            whileHover={{ rotate: 10, scale: 1.05 }}
            className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[var(--accent-solar)] via-[var(--accent-clean)] to-[var(--bg-surface-raised)] p-0.5 shadow-lg shadow-[var(--accent-solar)]/25"
          >
            <div className="w-full h-full bg-[var(--bg-base)] rounded-[14px] flex items-center justify-center text-[var(--accent-solar)]">
              <Zap className="w-5 h-5 fill-current" />
            </div>
          </motion.div>
          <div>
            <span className="font-extrabold text-base tracking-tight font-heading text-[var(--text-primary)]">
              MERIDIAN GRID
            </span>
            <div className="text-[10px] text-[var(--accent-solar)] font-semibold uppercase tracking-widest font-mono">
              ClimaTech • Idea to Unicorn
            </div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-[var(--text-muted)]">
          <Link href="/dashboard" className="hover:text-[var(--text-primary)] transition-colors">
            Dashboard
          </Link>
          <Link href="/forecast" className="hover:text-[var(--text-primary)] transition-colors">
            Solar GHI Model
          </Link>
          <Link href="/dispatch" className="hover:text-[var(--text-primary)] transition-colors">
            Dispatch Optimizer
          </Link>
          <Link href="/copilot" className="hover:text-[var(--text-primary)] transition-colors">
            AI Copilot
          </Link>
          <Link href="/about" className="hover:text-[var(--accent-solar)] transition-colors">
            Business Model
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-surface-raised)] transition-all border border-[var(--border-hairline)]"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--bg-surface-raised)] hover:border-[var(--accent-solar)] border border-[var(--border-hairline)] text-xs font-bold text-[var(--text-primary)] transition-all"
          >
            Sign Up
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl bg-[var(--accent-solar)] hover:brightness-110 text-[var(--bg-base)] text-xs font-extrabold transition-all shadow-lg shadow-[var(--accent-solar)]/25 active:scale-95"
          >
            <span>Launch Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
