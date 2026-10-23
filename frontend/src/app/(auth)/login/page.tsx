'use client';
import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Brand } from '@/components/layout/brand';
import { useAuthStore } from '@/lib/store';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError, checkBackendStatus, backendOnline } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  useEffect(() => { void checkBackendStatus(); clearError(); }, [checkBackendStatus, clearError]);
  async function submit(event: FormEvent) { event.preventDefault(); setAuthError(''); const success = await login(username,password); if (success) router.push(useAuthStore.getState().user?.mustChangePassword?'/change-password':'/dashboard'); else setAuthError('Sign in failed. Check your credentials and try again.'); }
  return <main className="grid min-h-screen lg:grid-cols-2"><section className="flex min-h-[330px] flex-col justify-between bg-[#122232] px-8 py-9 text-white sm:px-14 lg:min-h-screen lg:px-20 lg:py-14"><Link href="/" aria-label="Meridian Grid home"><Brand inverse /></Link><div className="max-w-xl py-14"><p className="mb-5 text-xs font-bold uppercase tracking-[.22em] text-[#d6a34b]">Bangladesh planning demo</p><h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">A clearer view of your energy plan.</h1><p className="mt-6 max-w-md text-base leading-8 text-[#adbdcb]">Explore solar outlooks, modeled dispatch schedules, and saved decisions in one calm workspace.</p></div><p className="text-xs text-[#8ea3b4]">Archived data  -  synthetic assets  -  no equipment connection</p></section><section className="flex items-center justify-center bg-white px-7 py-12 sm:px-12"><div className="w-full max-w-md"><p className="page-kicker">Welcome back</p><h2 className="mt-1 text-3xl font-extrabold">Sign in to Meridian</h2><p className="mt-3 text-sm text-[var(--text-muted)]">Enter your account details to open the workspace.</p><form onSubmit={submit} className="mt-9 space-y-5"><label className="block text-sm font-semibold">Username or email<input className="form-control mt-2" value={username} onChange={event=>setUsername(event.target.value)} autoComplete="username" required/></label><label className="block text-sm font-semibold">Password<input className="form-control mt-2" type="password" value={password} onChange={event=>setPassword(event.target.value)} autoComplete="current-password" required/></label>{(authError||error)&&<p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{authError||error}</p>}<button disabled={isLoading} className="w-full rounded-md bg-[var(--accent-clean)] px-5 py-3 font-bold text-white disabled:opacity-50">{isLoading?'Signing in...':'Sign in ->'}</button></form><p className="mt-6 text-sm text-[var(--text-muted)]">New to Meridian? <Link href="/signup" className="teal-link">Create an account</Link></p><p className="mt-12 border-t border-[var(--border-hairline)] pt-4 text-xs text-[var(--text-muted)]">Demo API: {backendOnline?'connected':'unavailable or checking'}</p></div></section></main>;
}
