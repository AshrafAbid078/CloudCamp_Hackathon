import Link from 'next/link';
import { ArrowRight, BookOpen, Factory, Network, ScanLine } from 'lucide-react';
import { HomeHero } from '@/components/marketing/home-hero';
import { WorkflowWalkthrough } from '@/components/marketing/workflow-walkthrough';

export default function LandingPage() {
  return <>
    <HomeHero />
    <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[.8fr_1.3fr]">
      <div><p className="text-[11px] font-bold uppercase tracking-[.22em] text-[#64806a]">The planning problem</p><h2 className="mt-4 text-3xl font-extrabold leading-tight text-[#1a392f] sm:text-4xl">The work has a deadline.<br />The energy outlook changes.</h2><p className="mt-5 max-w-md text-sm leading-7 text-[#6a7b6f]">Production needs to finish. Sunlight varies. Batteries have limits. Meridian Grid brings those decisions into one place, so a person can compare the options before choosing a schedule.</p></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-xl border border-[#dce4da] bg-white p-7"><Factory size={25} className="text-[#9f7c3f]" /><p className="mt-6 text-[10px] font-bold uppercase tracking-[.15em] text-[#68795f]">For facility managers</p><h3 className="mt-3 text-xl font-bold text-[#254636]">A schedule you can question.</h3><p className="mt-3 text-sm leading-7 text-[#5d705b]">Add a machine, inspect its suggested window, and compare the modeled cost and carbon effect against a baseline.</p></article>
        <article className="rounded-xl border border-[#dce4da] bg-[#eef3e9] p-7"><Network size={25} className="text-[#4b7b58]" /><p className="mt-6 text-[10px] font-bold uppercase tracking-[.15em] text-[#68795f]">For grid planning</p><h3 className="mt-3 text-xl font-bold text-[#254636]">See the shared constraints.</h3><p className="mt-3 text-sm leading-7 text-[#5d705b]">Explore how flexible loads, batteries and a feeder limit affect the portfolio’s proposed grid-import profile.</p></article>
      </div>
    </section>
    <WorkflowWalkthrough />
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
      <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
        <div><p className="text-[11px] font-bold uppercase tracking-[.22em] text-[#64806a]">Clarity before claims</p><h2 className="mt-4 max-w-md text-3xl font-extrabold leading-tight text-[#1a392f] sm:text-4xl">Know what is behind every result.</h2><p className="mt-5 max-w-md text-sm leading-7 text-[#6a7b6f]">The prototype shows its assumptions. Regional forecasts, synthetic equipment and modeled comparisons each have a different meaning.</p><Link href="/guide#reading-results" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#23745c]">Learn to read a plan <ArrowRight size={16} /></Link></div>
        <div className="divide-y divide-[#dfe6da] border-y border-[#dfe6da]">{[
          ['Sources stay visible', 'Weather and carbon inputs are labelled. An archived fallback is shown as archived.'],
          ['Trade-offs keep their sign', 'Negative savings stay negative. A plan can improve one metric while increasing another.'],
          ['A person makes the decision', 'Save, adjust, approve or reject a demo plan. No equipment command is sent.'],
        ].map(([title, text]) => <article key={title} className="flex gap-4 py-6"><ScanLine size={20} className="mt-1 shrink-0 text-[#81926f]" /><div><h3 className="text-base font-bold text-[#31523b]">{title}</h3><p className="mt-2 text-sm leading-7 text-[#5d705b]">{text}</p></div></article>)}</div>
      </div>
    </section>
    <section className="border-t border-[#dfe6da] bg-white"><div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[.75fr_1.25fr]"><div><p className="text-[11px] font-bold uppercase tracking-[.22em] text-[#64806a]">Before you explore</p><h2 className="mt-4 text-3xl font-extrabold text-[#1a392f]">A few useful answers.</h2></div><div className="space-y-1">{[
      ['Do I need an account to understand the product?', 'No. This website, the interactive walkthrough, About page and public documentation are open to everyone. An account is needed for the planning workspace and saved runs.'],
      ['Is this connected to a real factory?', 'This is a working software prototype with synthetic factory assets and tariffs. Regional API data is used when available. A permissioned facility pilot is a next step.'],
      ['Does the AI control my equipment?', 'No. The optimizer proposes a modeled schedule. The Copilot helps inspect tool evidence. Saving or approving a plan records a decision in the application.'],
      ['What happens when a data provider is unavailable?', 'The app uses a labelled historical fallback when available. Check the source badges and timestamps before interpreting any plan.'],
    ].map(([question, answer]) => <details key={question} className="group border-b border-[#e2e8de] py-5"><summary className="cursor-pointer text-sm font-bold leading-6 text-[#36563e]">{question}</summary><p className="mt-3 pr-4 text-sm leading-7 text-[#5f705d]">{answer}</p></details>)}</div></div></section>
    <section className="bg-[#173d32] text-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-8 px-5 py-14 sm:px-8"><div className="max-w-lg"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#c3d6b8]">Start with understanding</p><h2 className="mt-4 text-3xl font-extrabold">Explore the idea. Then explore the workspace.</h2></div><Link href="/guide" className="inline-flex items-center gap-3 rounded-md bg-[#e9c487] px-5 py-3.5 text-sm font-bold text-[#30432c]"><BookOpen size={17} /> Read the public guide <ArrowRight size={17} /></Link></div></section>
  </>;
}
