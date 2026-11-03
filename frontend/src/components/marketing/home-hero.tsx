import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { EnergyPreview } from './energy-preview';

export function HomeHero() {
  return <section className="border-b border-[#dfe6da] bg-[#f5f7ef]">
    <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1fr_1fr] lg:gap-12 lg:py-24">
      <div>
        <p className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.22em] text-[#55725d]"><span className="h-px w-8 bg-[#9bb18b]" /> Bangladesh / energy planning</p>
        <h1 className="mt-7 max-w-xl text-[clamp(2.9rem,5.4vw,5rem)] font-extrabold leading-[1.06] tracking-[-.055em] text-[#17342d]">A better time<br />to use energy.</h1>
        <p className="mt-7 max-w-lg text-lg leading-8 text-[#637267]">Turn a regional solar outlook and flexible machine schedules into a plan your team can understand, compare, and review.</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="#how-it-works" className="inline-flex items-center gap-3 rounded-md bg-[#163f34] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#23745e]">See how it works <ArrowRight size={17} /></Link>
          <Link href="/login" className="inline-flex items-center gap-3 rounded-md border border-[#bfcdbd] bg-white/50 px-5 py-3.5 text-sm font-semibold text-[#324e3d] hover:bg-white">Open workspace <ArrowUpRight size={17} /></Link>
        </div>
        <p className="mt-6 text-xs leading-6 text-[#637568]">Just exploring? <Link href="/guide" className="font-semibold text-[#345c47] underline underline-offset-4">Read the public guide</Link> — no account needed.</p>
      </div>
      <EnergyPreview />
    </div>
    <div className="mx-auto grid max-w-7xl grid-cols-2 gap-5 border-t border-[#dbe3d5] px-5 py-6 text-[12px] font-semibold text-[#536b54] sm:px-8 md:grid-cols-4">
      {['01 / Understand the outlook', '02 / Respect operating limits', '03 / Compare the trade-offs', '04 / Keep people in control'].map(label => <span key={label}>{label}</span>)}
    </div>
  </section>;
}
