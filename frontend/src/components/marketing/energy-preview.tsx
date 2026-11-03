import { ArrowRight, BatteryCharging, Check, Sun } from 'lucide-react';

export function EnergyPreview() {
  return <div className="relative isolate lg:ml-3">
    <div aria-hidden="true" className="absolute -right-4 -top-4 -z-10 h-40 w-40 rounded-full border border-[#c6d4bc] sm:-right-6" />
    <div className="overflow-hidden rounded-xl border border-[#cedad1] bg-white shadow-[0_24px_70px_-35px_#24453555]">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#142e2b] px-6 py-5 text-white">
        <div className="flex items-center gap-2.5"><span className="h-2 w-2 rounded-full bg-[#e4b35f]" /><strong className="text-sm font-semibold">A day in the planning workspace</strong></div>
        <span className="text-[10px] uppercase tracking-[.16em] text-[#c4d5c9]">Illustrative preview</span>
      </div>
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between text-sm"><span className="inline-flex items-center gap-2 font-bold text-[#324b3c]"><Sun size={17} className="text-[#b78024]" /> Solar outlook</span><span className="text-xs text-[#627669]">Regional weather</span></div>
        <svg viewBox="0 0 480 170" className="mt-5 w-full" role="img" aria-label="Illustrative solar curve rising towards midday and falling in the evening">
          <path d="M 20 35 H 460 M 20 80 H 460 M 20 125 H 460" fill="none" stroke="#e8ece6" />
          <path d="M 20 125 C 95 125 95 113 135 75 S 190 19 240 20 S 300 46 340 84 S 400 125 460 125 L 460 126 H 20 Z" fill="#f6e8c9" />
          <path d="M 20 125 C 95 125 95 113 135 75 S 190 19 240 20 S 300 46 340 84 S 400 125 460 125" fill="none" stroke="#c59337" strokeWidth="3" />
          <circle cx="240" cy="20" r="5" fill="#c59337" stroke="white" strokeWidth="3" />
          <g fill="#627669" fontSize="11" fontFamily="Arial, sans-serif"><text x="20" y="155">Morning</text><text x="216" y="155">Midday</text><text x="417" y="155">Evening</text></g>
        </svg>
        <div className="mt-3 rounded-lg border border-[#dce6dd] bg-[#f7faf5] p-4">
          <div className="flex items-center justify-between gap-3 text-xs"><strong className="text-[#304d3c]">Flexible production batch</strong><span className="rounded bg-white px-2 py-1 text-[#68806a]">Deadline respected</span></div>
          <div className="mt-4 grid grid-cols-12 gap-1" aria-label="Illustrative proposed production window">{Array.from({ length: 12 }, (_, i) => <span key={i} className={`h-7 rounded-sm ${i >= 4 && i < 8 ? 'bg-[#237963]' : 'bg-[#e3ebe0]'}`} />)}</div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-[#72816f]"><span>Start of horizon</span><span className="font-semibold text-[#237963]">Proposed window</span><span>End of horizon</span></div>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#e8ece6] pt-5 text-xs text-[#627361]">
          <span className="inline-flex items-center gap-2"><BatteryCharging size={16} /> Battery constraints included</span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-[#237963]"><Check size={14} /> Ready for human review <ArrowRight size={14} /></span>
        </div>
      </div>
    </div>
    <p className="mt-4 text-center text-[11px] leading-5 text-[#7a887c]">A visual explanation of the product. Sign in to generate a plan from backend data.</p>
  </div>;
}
