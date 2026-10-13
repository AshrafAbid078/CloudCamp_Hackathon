import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Meridian Grid | Universal Flexible-Load Forecasting & Optimization Engine',
  description:
    'An AI engine that forecasts solar output and grid stress, then schedules any flexible energy asset into the cheapest, cleanest window — and explains every decision in plain language.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-[var(--bg-base)] text-[var(--text-primary)] selection:bg-[var(--accent-solar)] selection:text-[var(--bg-base)]">
        {children}
      </body>
    </html>
  );
}
