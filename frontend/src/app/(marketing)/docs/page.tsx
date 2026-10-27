import type { Metadata } from 'next';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { DocsView, type ShowcasePayload } from './view';

export const metadata: Metadata = {
  title: 'Documentation | Meridian Grid',
  description: 'Product pitch, technical documentation, and live system facts for Meridian Grid.',
  robots: { index: false, follow: false },
};

async function LiveDocs() {
  await connection();
  const base = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  let data: ShowcasePayload | null = null;
  try {
    const response = await fetch(`${base}/showcase/public`, { cache: 'no-store' });
    if (response.ok) data = await response.json() as ShowcasePayload;
  } catch { /* Fail closed when the API is unavailable. */ }
  return data ? <DocsView initial={data} /> : <Unavailable />;
}

function Unavailable() {
  return <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col justify-center px-6 py-20"><p className="text-xs font-bold uppercase tracking-[.2em] text-[var(--accent-clean)]">Meridian Grid documentation</p><h1 className="mt-4 text-4xl font-extrabold">Not Available</h1><p className="mt-5 text-[var(--text-muted)]">This documentation is outside its public publishing window or the documentation service is unavailable.</p></section>;
}

export default function DocsPage() {
  return <Suspense fallback={<div className="mx-auto max-w-6xl px-6 py-20 text-[var(--text-muted)]">Checking documentation availability…</div>}><LiveDocs /></Suspense>;
}
