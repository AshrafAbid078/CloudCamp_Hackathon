'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Zap,
  ArrowRight,
  Lock,
  User as UserIcon,
  Mail,
  AlertCircle,
  Server,
} from 'lucide-react';
import { Button, Input } from '@/components/common';
import { useAuthStore } from '@/lib/store';
import type { UserRole } from '@/lib/types/auth';

export default function SignupPage() {
  const router = useRouter();
  const { signup, isLoading, error, clearError, checkBackendStatus, backendOnline } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('facility_manager');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    checkBackendStatus();
    clearError();
  }, [checkBackendStatus, clearError]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters long.');
      return;
    }

    const success = await signup({
      fullName,
      username,
      email: email || username,
      password,
      role,
    });

    if (success) {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[var(--bg-base)] p-6 relative overflow-hidden text-[var(--text-primary)]">
      {/* Background Matrix & Twilight Glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `linear-gradient(to right, var(--border-hairline) 1px, transparent 1px), linear-gradient(to bottom, var(--border-hairline) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-[var(--accent-solar)]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[450px] h-[450px] bg-[var(--accent-clean)]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Signup Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-lg p-8 sm:p-10 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] shadow-2xl relative z-10 backdrop-blur-2xl space-y-6"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[var(--accent-solar)] via-[var(--accent-clean)] to-[var(--bg-surface-raised)] p-0.5 shadow-lg shadow-[var(--accent-solar)]/25 mb-3">
            <div className="w-full h-full bg-[var(--bg-base)] rounded-[14px] flex items-center justify-center text-[var(--accent-solar)]">
              <Zap className="w-6 h-6 fill-current" />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight font-heading">
            CREATE MERIDIAN ACCOUNT
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs">
            Join the universal flexible-load forecasting & optimization network
          </p>
        </div>

        {/* Backend Status Feedback */}
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] text-xs">
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span className="text-[var(--text-muted)]">Backend Service:</span>
            {backendOnline ? (
              <span className="font-semibold text-[var(--accent-clean)] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-clean)] animate-pulse" />
                FastAPI Port 8000 Online
              </span>
            ) : (
              <span className="font-semibold text-[var(--accent-solar)] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-solar)]" />
                Autonomous Client Mode
              </span>
            )}
          </div>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">SQLite Backend</span>
        </div>

        {/* Role Selection */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider block font-mono">
            Operational Persona / Account Role
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole('facility_manager')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                role === 'facility_manager'
                  ? 'border-[var(--accent-solar)] bg-[var(--accent-solar)]/15 text-[var(--text-primary)] shadow-md shadow-[var(--accent-solar)]/10'
                  : 'border-[var(--border-hairline)] bg-[var(--bg-base)] text-[var(--text-muted)] hover:border-[var(--border-hairline)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-xs">
                <span>Facility Manager</span>
                <span>⚡</span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-1 leading-tight">
                Factory load optimization & solar arbitrage
              </p>
            </button>

            <button
              type="button"
              onClick={() => setRole('grid_operator')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                role === 'grid_operator'
                  ? 'border-[var(--accent-clean)] bg-[var(--accent-clean)]/15 text-[var(--text-primary)] shadow-md shadow-[var(--accent-clean)]/10'
                  : 'border-[var(--border-hairline)] bg-[var(--bg-base)] text-[var(--text-muted)] hover:border-[var(--border-hairline)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-xs">
                <span>Grid Operator</span>
                <span>🏭</span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-1 leading-tight">
                National feeder stress & DERMS balancing
              </p>
            </button>
          </div>
        </div>

        {(validationError || error) && (
          <div className="p-3 rounded-xl bg-[var(--accent-stress)]/15 border border-[var(--accent-stress)]/30 text-xs text-[var(--accent-stress)] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError || error}</span>
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSignup} className="space-y-3.5">
          <Input
            label="Full Name"
            type="text"
            placeholder="e.g. Tariq Rahman"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            leftIcon={<UserIcon className="w-4 h-4" />}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Username"
              type="text"
              placeholder="e.g. trahman_bd"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              leftIcon={<UserIcon className="w-4 h-4" />}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              leftIcon={<Mail className="w-4 h-4" />}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Password (min 8 chars)"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              leftIcon={<Lock className="w-4 h-4" />}
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="solar"
              size="lg"
              className="w-full font-extrabold"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Register & Launch Console
            </Button>
          </div>
        </form>

        {/* Bidirectional Link to Sign In */}
        <div className="text-center text-xs text-[var(--text-muted)] pt-3 border-t border-[var(--border-hairline)] flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Already have a Meridian account?</span>
          <Link
            href="/login"
            className="text-[var(--accent-solar)] hover:underline font-bold transition-colors"
          >
            Sign In to Console →
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
