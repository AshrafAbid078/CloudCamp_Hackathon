'use client';
import Link from 'next/link';
import { Brand } from './brand';
export function Navbar() { return <header className="border-b border-[var(--border-hairline)] bg-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5"><Link href="/" aria-label="Meridian Grid home"><Brand /></Link><nav className="flex flex-wrap items-center gap-4 text-sm sm:gap-7"><Link href="/about" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">About</Link><Link href="/login" className="font-semibold">Sign in</Link><Link href="/signup" className="rounded-md bg-[var(--accent-clean)] px-4 py-2.5 font-bold text-white">Create account →</Link></nav></div></header>; }
