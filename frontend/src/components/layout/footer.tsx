import Link from 'next/link';
import { Brand } from './brand';

export function Footer() {
  return <footer className="border-t border-[#dfe6e3] bg-[#fbfcfa]">
    <div className="mx-auto flex max-w-7xl flex-wrap items-start justify-between gap-8 px-5 py-12 sm:px-8">
      <div><Brand /><p className="mt-4 max-w-xs text-sm leading-6 text-[#64766e]">A clearer view of when to use energy.<br />Built around Bangladesh. Designed for human review.</p></div>
      <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm text-[#435c50]">
        <Link href="/#how-it-works">How it works</Link><Link href="/about">About the project</Link>
        <Link href="/guide">Public documentation</Link><Link href="/docs">Published showcase</Link>
        <Link href="/login">Sign in</Link><Link href="/signup">Create an account</Link>
      </nav>
    </div>
    <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 border-t border-[#e2e8e3] px-5 py-5 text-xs text-[#718177] sm:px-8">
      <span>© Meridian Grid · Bangladesh planning prototype</span><span>Regional data · Synthetic equipment · Modeled outcomes</span>
    </div>
  </footer>;
}
