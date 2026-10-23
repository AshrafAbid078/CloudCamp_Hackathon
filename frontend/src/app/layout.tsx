import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Meridian Grid | Energy Planning Demo', description: 'Explore archived Bangladesh solar forecasts and modeled dispatch plans for synthetic assets.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" className="h-full antialiased"><body className="min-h-full bg-[var(--bg-base)] text-[var(--text-primary)]">{children}</body></html>; }
