'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, Shield, ArrowRight, CheckCircle2, Lock } from 'lucide-react';
import { Button, Input, Chip } from '@/components/common';
import { useRole } from '@/hooks';
import type { UserRole } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const { role, setRole, allRoles } = useRole();
  const [email, setEmail] = useState('operator@heliosgrid.energy');
  const [password, setPassword] = useState('••••••••••••');
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    if (selectedRole === 'operator') setEmail('operator@heliosgrid.energy');
    if (selectedRole === 'analyst') setEmail('analyst@heliosgrid.energy');
    if (selectedRole === 'executive') setEmail('executive@heliosgrid.energy');
    if (selectedRole === 'engineer') setEmail('engineer@heliosgrid.energy');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/dashboard');
    }, 600);
  };

  const currentRoleMeta = allRoles.find((r) => r.role === role);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-950 p-6 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl relative z-10 backdrop-blur-xl">
        {/* Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-sky-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 mb-3">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">HELIOS GRID CONSOLE</h1>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise Access for Fleet Irradiance & BESS Storage Dispatch
          </p>
        </div>

        {/* Role Quick Selector */}
        <div className="mb-6 space-y-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Select Role Profile for Demo
          </label>
          <div className="grid grid-cols-2 gap-2">
            {allRoles.map((r) => {
              const isSelected = r.role === role;
              return (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => handleRoleSelect(r.role as UserRole)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10 text-white shadow-sm'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="capitalize font-semibold text-xs">{r.role}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                    {r.canOverrideDispatch ? 'Override Permitted' : 'Read-Only Telemetry'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Operator Email / ID"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-slate-950/80 border-slate-700 text-white"
          />

          <Input
            label="Security Passkey"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-slate-950/80 border-slate-700 text-white"
            leftIcon={<Lock className="w-4 h-4 text-slate-500" />}
          />

          {currentRoleMeta && (
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
              <span className="font-semibold text-amber-400">Active Permissions: </span>
              {currentRoleMeta.description}
            </div>
          )}

          <Button
            type="submit"
            variant="amber"
            size="lg"
            className="w-full font-bold mt-2"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Authenticate as {role.toUpperCase()}
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          <Link href="/about" className="hover:text-slate-300 transition-colors">
            Learn more about the technical architecture →
          </Link>
        </div>
      </div>
    </div>
  );
}
