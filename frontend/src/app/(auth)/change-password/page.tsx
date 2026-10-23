'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { Brand } from '@/components/layout/brand';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await authApi.changePassword(current, next);
      useAuthStore.getState().logout();
      router.replace('/login');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Password change failed.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="grid min-h-screen lg:grid-cols-2"><section className="flex min-h-[280px] flex-col justify-between bg-[#122232] px-8 py-9 text-white lg:min-h-screen lg:px-20 lg:py-14"><Brand inverse/><div className="py-12"><p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#d6a34b]">Account security</p><h1 className="max-w-lg text-4xl font-extrabold">Your workspace starts with a secure account.</h1></div><p className="text-xs text-[#8ea3b4]">Meridian Grid demo</p></section><section className="flex items-center justify-center bg-white px-7 py-12"><form onSubmit={submit} className="w-full max-w-md space-y-5"><p className="page-kicker">Required update</p><h2 className="text-3xl font-extrabold">Change your password</h2>
      <p className="text-sm text-[var(--text-muted)]">A new password is required before you can use the console. Sign in again after changing it.</p>
      <label className="block text-sm font-semibold">Current password<input className="form-control mt-2" type="password" required value={current} onChange={event => setCurrent(event.target.value)} /></label>
      <label className="block text-sm font-semibold">New password<input className="form-control mt-2" type="password" minLength={8} required value={next} onChange={event => setNext(event.target.value)} /></label>
      {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button disabled={busy} className="w-full rounded-md bg-[var(--accent-clean)] p-3 font-bold text-white">{busy ? 'Saving…' : 'Change password'}</button>
    </form></section>
  </main>;
}
