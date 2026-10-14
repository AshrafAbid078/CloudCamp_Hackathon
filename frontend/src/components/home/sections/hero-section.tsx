'use client';

import React from 'react';
import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import {
  Cpu,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export function HeroSection() {
  return (
    <>
      {/* Adapter Framing Line */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl p-2.5 sm:p-3 rounded-2xl bg-[var(--bg-surface)]/90 border border-[var(--border-hairline)] backdrop-blur-md mb-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
      >
        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
          <span className="font-bold uppercase tracking-wider text-[10px] text-[var(--accent-solar)] font-mono">
            Engine Status:
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--accent-clean)]/15 text-[var(--accent-clean)] border border-[var(--accent-clean)]/30 font-semibold text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-clean)] animate-pulse" />
            Live: Bangladesh (BPDB + Electricity Maps)
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--tag-architecture-ready)]/20 text-[var(--tag-architecture-ready)] border border-[var(--tag-architecture-ready)]/40 font-mono text-[10px]">
            Architecture-Ready: EU, US
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--accent-clean)]/15 text-[var(--accent-clean)] border border-[var(--accent-clean)]/30 font-semibold text-[11px]">
            <Cpu className="w-3 h-3 text-[var(--accent-clean)]" />
            Live: Industrial + Battery
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--tag-architecture-ready)]/20 text-[var(--tag-architecture-ready)] border border-[var(--tag-architecture-ready)]/40 font-mono text-[10px]">
            Ready: EV Fleet
          </span>
        </div>
      </motion.div>

      {/* Tagline Treatment */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] text-xs text-[var(--text-muted)] mb-6 shadow-sm"
      >
        <Sparkles className="w-3.5 h-3.5 text-[var(--accent-solar)]" />
        <span className="font-medium text-[var(--text-primary)]">
          One engine. Any flexible load. Anywhere the sun and the grid don&apos;t quite agree.
        </span>
      </motion.div>

      {/* Hero Title */}
      <motion.h1
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-5xl leading-[1.08] font-heading text-[var(--text-primary)]"
      >
        Autonomous Solar Load Scheduling & Intelligent Grid Coordination
      </motion.h1>

      {/* Hero One-Line Pitch */}
      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-6 text-base sm:text-xl text-[var(--text-muted)] max-w-3xl leading-relaxed"
      >
        An AI engine that forecasts solar output and grid stress, then schedules any flexible energy asset into the cheapest, cleanest window — and explains every decision in plain language.
      </motion.p>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mt-10 flex flex-col sm:flex-row items-center gap-4"
      >
        <Link
          href="/login"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-[var(--accent-solar)] hover:brightness-110 text-[var(--bg-base)] font-extrabold text-sm transition-all shadow-xl shadow-[var(--accent-solar)]/25 active:scale-95"
        >
          <span>Open Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/signup"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] text-[var(--text-primary)] font-semibold text-sm transition-all shadow-md"
        >
          <ShieldCheck className="w-4 h-4 text-[var(--accent-clean)]" />
          <span>Create Operator Account</span>
        </Link>
      </motion.div>

      {/* Stats Bar */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mt-14 w-full max-w-5xl grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-left"
      >
        <motion.div variants={itemVariants} className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] backdrop-blur-md">
          <div className="text-[10px] font-bold text-[var(--accent-clean)] uppercase tracking-wider mb-1 font-mono">
            Live Session Savings
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[var(--text-primary)]">
            $4,820
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">
            Avoided peak demand surcharges & carbon penalties today
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] backdrop-blur-md">
          <div className="text-[10px] font-bold text-[var(--accent-solar)] uppercase tracking-wider mb-1 font-mono">
            GHI Forecasts Run
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[var(--text-primary)]">
            148
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">
            LightGBM inferences vs NSRDB persistence benchmark
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] backdrop-blur-md">
          <div className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1 font-mono">
            Facilities Simulated
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[var(--text-primary)]">
            12 Sites
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">
            Bangladesh industrial data (Chittagong corridor, synthetic)
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] backdrop-blur-md">
          <div className="text-[10px] font-bold text-[var(--accent-clean)] uppercase tracking-wider mb-1 font-mono">
            Clean Energy Offset
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[var(--text-primary)]">
            318 gCO₂
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">
            Per kWh shifted from evening gas peakers to midday solar
          </p>
        </motion.div>
      </motion.div>
    </>
  );
}
