'use client';

import { useId, useState, type KeyboardEvent } from 'react';
import { ArrowRight, Check, ClipboardCheck, SlidersHorizontal, Sun, Workflow } from 'lucide-react';

const steps = [
  { title: 'Define the work', icon: SlidersHorizontal, label: 'The inputs',
    heading: 'Start with the work that must get done.',
    description: 'Choose a planning horizon and describe the equipment: power, run duration, earliest start, and deadline. Add battery limits or a hypothetical solar capacity when relevant.',
    inputs: ['Machine power and required run time', 'Earliest start and completion deadline', 'Optional battery, solar and feeder limits'],
    output: 'A set of operating constraints the schedule must respect.',
    example: 'Example: a synthetic 150 kW process needs four uninterrupted hours and must finish before the end of the horizon.' },
  { title: 'Read the outlook', icon: Sun, label: 'The context',
    heading: 'See the energy conditions around that work.',
    description: 'The forecast service selects regional weather around Dhaka and a grid-carbon signal. Each response labels its source, including historical data when a current source is unavailable.',
    inputs: ['Regional solar irradiance in W/m²', 'Grid-carbon intensity in gCO₂eq/kWh', 'Source labels and forecast timestamps'],
    output: 'An hourly outlook for the selected 6, 12, or 24-hour horizon.',
    example: 'The solar curve describes regional sunlight. Converting it to site generation requires an explicit solar-capacity assumption.' },
  { title: 'Compare schedules', icon: Workflow, label: 'The calculation',
    heading: 'Find a feasible window, then show the trade-offs.',
    description: 'A mathematical optimizer compares permitted machine and battery schedules. It balances modeled electricity cost, carbon and peak import while respecting the operating constraints.',
    inputs: ['The hourly outlook and synthetic tariff', 'Machine deadlines and battery limits', 'A run-immediately comparison baseline'],
    output: 'Suggested run windows and signed cost, carbon and peak comparisons.',
    example: 'A lower-cost plan is not guaranteed to reduce every metric. The interface keeps negative improvements visible.' },
  { title: 'Review the plan', icon: ClipboardCheck, label: 'The decision',
    heading: 'Make the reasoning inspectable before acting.',
    description: 'Inspect the proposed windows, compare a solar scenario or ask the Copilot about its tool evidence. Save a complete plan, adjust a window, and record approval or rejection.',
    inputs: ['A complete schedule and its assumptions', 'Baseline-versus-plan comparisons', 'Source-labelled explanations and scenarios'],
    output: 'A saved, reviewable demo plan with a decision trail.',
    example: 'Saving or approving creates an application record. It does not send a command to physical equipment.' },
];

export function WorkflowWalkthrough() {
  const [active, setActive] = useState(0);
  const uid = useId();
  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const offset = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 0;
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? steps.length - 1 : offset ? (index + offset + steps.length) % steps.length : null;
    if (next === null) return;
    event.preventDefault(); setActive(next);
    document.getElementById(`${uid}-tab-${next}`)?.focus();
  }
  return <section id="how-it-works" className="scroll-mt-8 border-y border-[#e0e6de] bg-[#f7f9f4]">
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
      <p className="text-[11px] font-bold uppercase tracking-[.22em] text-[#638066]">How it works</p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-5"><h2 className="max-w-xl text-3xl font-extrabold leading-tight text-[#17382e] sm:text-4xl">Follow one planning decision.</h2><p className="max-w-sm text-sm leading-7 text-[#6b7b6e]">Select a step to see what goes in, what happens, and what comes out.</p></div>
      <div className="mt-10 grid gap-6 lg:grid-cols-[.72fr_1.65fr]">
        <div role="tablist" aria-label="Energy planning workflow" className="grid grid-cols-2 gap-2 lg:grid-cols-1 lg:content-start">
          {steps.map((step, index) => <button key={step.title} role="tab" id={`${uid}-tab-${index}`} aria-selected={active === index} aria-controls={`${uid}-panel-${index}`} tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} onKeyDown={event => navigate(event, index)} className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors sm:p-5 ${active === index ? 'border-[#184c3b] bg-[#184c3b] text-white' : 'border-[#dbe3d7] bg-white text-[#5b715e] hover:border-[#9fb59c]'}`}>
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${active === index ? 'bg-white/15 text-[#e9c78a]' : 'bg-[#eef2e8] text-[#72856a]'}`}>{String(index + 1).padStart(2, '0')}</span>
            <span className="text-sm font-semibold">{step.title}</span><ArrowRight size={16} aria-hidden="true" className="ml-auto hidden shrink-0 sm:block" />
          </button>)}
        </div>
        <div className="min-w-0">{steps.map((selected, index) => {
          const Icon = selected.icon;
          return <div key={selected.title} role="tabpanel" hidden={active !== index} id={`${uid}-panel-${index}`} aria-labelledby={`${uid}-tab-${index}`} tabIndex={0} className="rounded-xl border border-[#dbe3d7] bg-white p-6 sm:p-9">
          <div className="flex items-center gap-3 text-[#8b6e37]"><Icon size={21} /><span className="text-[10px] font-bold uppercase tracking-[.2em]">{selected.label}</span></div>
          <h3 className="mt-5 max-w-xl text-2xl font-bold leading-snug text-[#233f31]">{selected.heading}</h3>
          <p className="mt-4 text-sm leading-7 text-[#68796a]">{selected.description}</p>
          <ul className="mt-6 space-y-3">{selected.inputs.map(input => <li key={input} className="flex items-start gap-2.5 text-sm text-[#4d6653]"><Check size={16} className="mt-0.5 shrink-0 text-[#338068]" />{input}</li>)}</ul>
          <div className="mt-7 rounded-lg border border-[#e3e9db] bg-[#f5f7ee] px-5 py-4"><span className="text-[10px] font-bold uppercase tracking-[.15em] text-[#7c8b65]">What you get</span><p className="mt-2 text-sm font-semibold leading-6 text-[#3c593c]">{selected.output}</p></div>
          <p className="mt-5 text-xs leading-6 text-[#63765e]">{selected.example}</p>
          </div>;
        })}</div>
      </div>
    </div>
  </section>;
}
