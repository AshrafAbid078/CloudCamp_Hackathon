import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Meridian Grid | A better time to use energy', description: 'Understand the regional energy outlook, compare flexible schedules, and review modeled outcomes in a Bangladesh-focused planning prototype.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" className="h-full antialiased"><body className="min-h-full bg-[var(--bg-base)] text-[var(--text-primary)]">{children}</body></html>; }
