import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Brand } from './brand';

export function Navbar() {
  return <header className="border-b border-[#dfe6e3] bg-[#fbfcfa]">
    <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-x-4 gap-y-4 px-5 py-5 sm:px-8 md:flex md:gap-x-8">
      <Link href="/" aria-label="Meridian Grid home"><Brand /></Link>
      <nav aria-label="Main navigation" className="col-span-2 row-start-2 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] font-semibold md:ml-auto md:gap-x-8">
        <Link href="/#how-it-works" className="text-[#52675f] hover:text-[#137d76]">How it works</Link>
        <Link href="/about" className="text-[#52675f] hover:text-[#137d76]">About</Link>
        <Link href="/guide" className="text-[#52675f] hover:text-[#137d76]">Documentation</Link>
      </nav>
      <Link href="/login" className="col-start-2 row-start-1 inline-flex items-center gap-2 rounded-md bg-[#123c35] px-3 py-2.5 text-xs font-semibold text-white hover:bg-[#176b5c] sm:px-4 sm:text-[13px]">Open workspace <ArrowUpRight size={15} /></Link>
    </div>
  </header>;
}
