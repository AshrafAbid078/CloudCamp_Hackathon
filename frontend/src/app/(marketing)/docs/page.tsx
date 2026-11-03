import type { Metadata } from 'next';
import { Suspense } from 'react';
import { connection } from 'next/server';
import Link from 'next/link';
import { DocsView, type ShowcasePayload } from './view';

export const metadata: Metadata = {
  title: 'Documentation & System Showcase | Meridian Grid',
  description: 'Published product documentation and live application facts for Meridian Grid.',
  robots: { index: false, follow: false },
};

async function LiveDocs() {
  await connection();
  const base = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  let data: ShowcasePayload | null = null;
  let closed = false;
  try {
    const response = await fetch(`${base}/showcase/public`, {
      cache: 'no-store', signal: AbortSignal.timeout(8_000),
    });
    closed = response.status === 403 || response.status === 404;
    if (response.ok) data = await response.json() as ShowcasePayload;
  } catch {
    // Publishing authorization cannot be inferred from an unavailable backend.
  }
  if (!data) return <div className="mx-auto max-w-3xl px-6 py-24">
    <h1 className="text-4xl font-extrabold">{closed ? 'Not Available' : 'Documentation temporarily unavailable'}</h1>
    <p className="mt-4 text-[var(--text-muted)]">{closed
      ? 'The public documentation is not published for this time window.'
      : 'The publishing service could not be reached. Please try again shortly.'}</p>
    <Link href="/guide" className="mt-6 inline-block font-semibold text-[var(--accent-clean)] underline underline-offset-4">Read the public product guide — no account required</Link>
  </div>;
  return <DocsView initial={data} />;
}

export default function DocsPage() {
  return <Suspense fallback={<div className="mx-auto max-w-6xl px-6 py-20">Checking documentation availability…</div>}>
    <LiveDocs />
  </Suspense>;
}
