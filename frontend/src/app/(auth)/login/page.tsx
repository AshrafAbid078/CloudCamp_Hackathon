'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, ArrowRight, Lock, User, AlertCircle, Info } from 'lucide-react';
import { Button, Input } from '@/components/common';
import { useRole } from '@/hooks';
import type { UserRole } from '@/lib/types/auth';

export default function LoginPage() {
  const router = useRouter();
  const { role, setRole } = useRole();
  const [username, setUsername] = useState('admin@meridiangrid.energy');
  const [password, setPassword] = useState('••••••••••••');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleRoleToggle = (selectedRole: UserRole) => {
    setRole(selectedRole);
    if (selectedRole === 'facility_manager') {
      setUsername('manager@chittagong-textile.bd');
    } else {
      setUsername('operator@bpdb-national-grid.bd');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);

    // Simulated JWT Auth exchange
    setTimeout(() => {
      try {
        const mockJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.meridian.${role}.${Date.now()}`;
        if (typeof window !== 'undefined') {
          localStorage.setItem('meridian_token', mockJwt);
          localStorage.setItem('meridian_role', role);
        }
        setIsLoading(false);
        router.push('/dashboard');
      } catch {
        setIsLoading(false);
        setAuthError('Authentication failed. Please verify credentials.');
      }
    }, 500);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[var(--bg-base)] p-6 relative overflow-hidden text-[var(--text-primary)]">
      {/* Background Matrix & Twilight Glow */}
      <div className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `linear-gradient(to right, var(--border-hairline) 1px, transparent 1px), linear-gradient(to bottom, var(--border-hairline) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[var(--accent-solar)]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-[var(--accent-clean)]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] shadow-2xl relative z-10 backdrop-blur-2xl space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[var(--accent-solar)] via-[var(--accent-clean)] to-[var(--bg-surface-raised)] p-0.5 shadow-lg shadow-[var(--accent-solar)]/25 mb-3">
            <div className="w-full h-full bg-[var(--bg-base)] rounded-[14px] flex items-center justify-center text-[var(--accent-solar)]">
              <Zap className="w-6 h-6 fill-current" />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight font-heading">
            MERIDIAN GRID CONSOLE
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs">
            Universal flexible-load forecasting & dispatch optimization engine
          </p>
        </div>

        {/* Persona Pre-Selection Toggle */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider block font-mono">
            Select Operational Persona for Session
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleRoleToggle('facility_manager')}
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
                Industrial load shifting & peak tariff avoidance
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleRoleToggle('grid_operator')}
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
                Feeder stress balancing & curtailment mitigation
              </p>
            </button>
          </div>
        </div>

        {/* First-Boot Notice */}
        <div className="p-3 rounded-2xl bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] text-xs text-[var(--text-muted)] flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[var(--accent-solar)] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-[var(--text-primary)]">First-Boot Notice:</strong> The seeded admin account credentials are pre-filled below. Password must be changed upon first production sign-in.
          </p>
        </div>

        {authError && (
          <div className="p-3 rounded-xl bg-[var(--accent-stress)]/15 border border-[var(--accent-stress)]/30 text-xs text-[var(--accent-stress)] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Username / Enterprise Email"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            leftIcon={<User className="w-4 h-4" />}
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            leftIcon={<Lock className="w-4 h-4" />}
          />

          <Button
            type="submit"
            variant="solar"
            size="lg"
            className="w-full font-extrabold mt-3"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Authenticate & Open Dashboard
          </Button>
        </form>

        <div className="text-center text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-hairline)]">
          <Link href="/about" className="hover:text-[var(--accent-solar)] transition-colors">
            Read ClimaTech Architecture & Business Model →
          </Link>
        </div>
      </div>
    </div>
  );
}
