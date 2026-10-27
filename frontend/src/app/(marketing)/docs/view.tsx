'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { API_BASE_URL } from '@/lib/api/client';
import { ArrowRight, BookOpen, Copy, Download, Search } from 'lucide-react';

export type Section = { id: string; title: string; group: 'pitch' | 'technical'; body: string; body_html?: string | null };
export type Member = { name: string; role: string; email: string; photo_url: string | null };
export type Content = { team_name: string; team: Member[]; sections: Section[]; architecture_nodes: string[]; data_flow_nodes: string[] };
export type Live = { as_of: string; features: { name: string; status: string; detail: string }[]; metrics: Record<string, number | string | null>; api_routes: { method: string; path: string; summary: string; auth: string }[]; events: { type: string; at: string }[] };
export type ShowcasePayload = { content: Content; version: number; versions: { version: number; published_at: string }[]; live: Live; plugins: { slug: string; title: string; data?: Record<string, unknown>; unavailable?: boolean }[] };

function Flow({ nodes }: { nodes: string[] }) {
  const wordsToLines = (label: string) => {
    const lines: string[] = [''];
    for (const word of label.split(/\s+/)) {
      const last = lines.length - 1;
      if ((lines[last] + ' ' + word).trim().length > 20) lines.push(word);
      else lines[last] = `${lines[last]} ${word}`.trim();
    }
    return lines.slice(0, 4);
  };
  return <div className="overflow-x-auto rounded-md border border-[var(--border-hairline)] bg-[#f8fbfb] p-4"><svg width={nodes.length * 190} height={112} viewBox={`0 0 ${nodes.length * 190} 112`} role="img" aria-label={nodes.join(' then ')}>{nodes.map((node, index) => <g key={`${node}-${index}`}><rect x={index * 190 + 2} y={11} width={157} height={88} rx={8} fill="#e8f4f1" stroke="#88bcb3" /><text x={index * 190 + 80} y={54 - (wordsToLines(node).length - 1) * 9} textAnchor="middle" fill="#214257" fontSize="13" fontWeight="700">{wordsToLines(node).map((line, lineIndex) => <tspan key={lineIndex} x={index * 190 + 80} dy={lineIndex ? 18 : 0}>{line}</tspan>)}</text>{index < nodes.length - 1 && <path d={`M ${index * 190 + 165} 55 H ${(index + 1) * 190 - 12} M ${(index + 1) * 190 - 19} 49 L ${(index + 1) * 190 - 12} 55 L ${(index + 1) * 190 - 19} 61`} fill="none" stroke="#137d76" strokeWidth="2" />}</g>)}</svg></div>;
}

function TeamPortrait({ member }: { member: Member }) {
  const [failed, setFailed] = useState(false);
  return <div className="grid aspect-[4/3] place-items-center bg-[#e8f0ef]">{member.photo_url && !failed ? <Image src={member.photo_url} alt={`Portrait of ${member.name}`} width={400} height={300} unoptimized onError={() => setFailed(true)} className="h-full w-full object-cover" /> : <span className="grid h-20 w-20 place-items-center rounded-full bg-[#b8d6d1] text-3xl font-extrabold text-[#174b46]" aria-label="No profile photo">{member.name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()}</span>}</div>;
}

function SectionBody({ section }: { section: Section }) {
  if (section.body_html) return <div className="docs-richtext mt-3 text-sm leading-7 text-[var(--text-muted)]" dangerouslySetInnerHTML={{ __html: section.body_html }} />;
  return <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[var(--text-muted)]">{section.body}</p>;
}

function toMarkdown(data: ShowcasePayload): string {
  const { content, live, version } = data;
  return [`# Meridian Grid — Documentation`, `Published version ${version}`, '', '## Pitch deck',
    ...content.sections.filter(s => s.group === 'pitch').flatMap(s => [`### ${s.title}`, s.body, '']),
    '## Technical documentation', ...content.sections.filter(s => s.group === 'technical').flatMap(s => [`### ${s.title}`, s.body, '']),
    '## Architecture flow', content.architecture_nodes.join(' → '), '', '## Data flow', content.data_flow_nodes.join(' → '), '',
    '## Team', content.team.length ? content.team.map(m => `- ${m.name} — ${m.role} (${m.email})`).join('\n') : 'No team profiles published.', '',
    '## Live system snapshot', `As of ${live.as_of}`, ...live.features.map(f => `- ${f.name}: ${f.status} — ${f.detail}`),
    ...Object.entries(live.metrics).map(([key, value]) => `- ${key}: ${value ?? 'unavailable'}`), '',
    '## Recent application events', ...live.events.map(event => `- ${event.at}: ${event.type}`), '',
    '## Documentation versions', ...data.versions.map(v => `- v${v.version}: ${v.published_at}`), '',
    '## Additional modules', ...data.plugins.map(plugin => `- ${plugin.title}: ${plugin.unavailable ? 'unavailable' : JSON.stringify(plugin.data)}`), '',
    '## Registered API routes', ...live.api_routes.map(r => `- ${r.method} ${r.path}: ${r.summary} (${r.auth})`), '',
    'These metrics are prototype activity, not customer traction or real-site impact.', ''].join('\n');
}

export function DocsView({ initial }: { initial: ShowcasePayload }) {
  const [data, setData] = useState(initial);
  const [closed, setClosed] = useState(false);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/showcase/public`, { cache: 'no-store' });
        if (!active) return;
        if (!response.ok) { setClosed(true); return; }
        setData(await response.json() as ShowcasePayload);
        setClosed(false);
      } catch { if (active) setClosed(true); }
    };
    const timer = window.setInterval(() => { void refresh(); }, 10_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  const pitch = useMemo(() => data.content.sections.filter(s => s.group === 'pitch' && `${s.title} ${s.body}`.toLowerCase().includes(query.toLowerCase())), [data, query]);
  const technical = useMemo(() => data.content.sections.filter(s => s.group === 'technical' && `${s.title} ${s.body}`.toLowerCase().includes(query.toLowerCase())), [data, query]);
  const searchHits = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return [
      ...data.content.sections.filter(s => `${s.title} ${s.body}`.toLowerCase().includes(term)).map(s => ({ label: s.title, category: s.group === 'pitch' ? 'Pitch' : 'Technical', href: s.group === 'pitch' ? `#${s.id}` : `#tech-${s.id}` })),
      ...data.content.team.filter(m => `${m.name} ${m.role} ${m.email}`.toLowerCase().includes(term)).map(m => ({ label: m.name, category: 'Team', href: '#team' })),
      ...data.live.features.filter(f => `${f.name} ${f.status} ${f.detail}`.toLowerCase().includes(term)).map(f => ({ label: f.name, category: 'Feature', href: '#live' })),
      ...data.live.api_routes.filter(r => `${r.method} ${r.path} ${r.summary}`.toLowerCase().includes(term)).map(r => ({ label: `${r.method} ${r.path}`, category: 'API', href: '#apis' })),
      ...data.live.events.filter(e => e.type.toLowerCase().includes(term)).map(e => ({ label: e.type, category: 'Event', href: '#live' })),
      ...data.plugins.filter(plugin => plugin.title.toLowerCase().includes(term)).map(plugin => ({ label: plugin.title, category: 'Module', href: '#modules' })),
    ];
  }, [data, query]);
  if (closed) return <div className="mx-auto max-w-3xl px-6 py-24"><h1 className="text-4xl font-extrabold">Not Available</h1><p className="mt-4 text-[var(--text-muted)]">The public documentation window has closed.</p></div>;

  const download = () => {
    const blob = new Blob([toMarkdown(data)], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'meridian-grid-docs.md'; anchor.click(); URL.revokeObjectURL(url);
  };
  const share = async () => { await navigator.clipboard.writeText(window.location.href); setNotice('Link copied'); window.setTimeout(() => setNotice(''), 2500); };

  return <div className="bg-[var(--bg-base)] print:bg-white">
    <section className="border-b border-[var(--border-hairline)] bg-white"><div className="mx-auto max-w-7xl px-6 pb-14 pt-16 sm:pb-20 sm:pt-20"><span className="inline-flex items-center gap-2 rounded-full border border-[#c7e4df] bg-[#edf8f5] px-3 py-1.5 text-xs font-bold text-[#176d67]"><BookOpen size={15} /> Live documentation · v{data.version}</span><h1 className="mt-7 max-w-4xl text-4xl font-extrabold leading-tight text-[#0c1929] sm:text-6xl">One plan for cleaner, more flexible energy.</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--text-muted)]">Meridian Grid brings regional forecasts, constrained dispatch, and human review into one Bangladesh-focused planning prototype.</p><div className="mt-7 flex flex-wrap gap-3 print:hidden"><Link href="/login" className="inline-flex items-center gap-2 rounded-md bg-[var(--accent-clean)] px-5 py-3 text-sm font-bold text-white">Open demo <ArrowRight size={16} /></Link><button onClick={download} className="inline-flex items-center gap-2 rounded-md border border-[var(--border-hairline)] px-4 py-3 text-sm font-bold"><Download size={16} /> Markdown</button><button onClick={() => window.print()} className="rounded-md border border-[var(--border-hairline)] px-4 py-3 text-sm font-bold">Print / PDF</button><button onClick={() => void share()} className="inline-flex items-center gap-2 rounded-md border border-[var(--border-hairline)] px-4 py-3 text-sm font-bold"><Copy size={16} /> Share</button></div><p aria-live="polite" className="mt-2 text-sm text-[var(--accent-clean)]">{notice}</p><p className="mt-4 text-sm text-[var(--text-muted)]">Synthetic assets · modeled outcomes · no equipment control</p></div></section>

    <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[225px_minmax(0,1fr)] lg:gap-14"><nav aria-label="Documentation sections" className="h-fit rounded-lg border border-[var(--border-hairline)] bg-white p-5 print:hidden lg:sticky lg:top-6"><label htmlFor="docs-search" className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Search sections</label><div className="relative mt-3"><Search size={16} className="absolute left-3 top-3 text-[var(--text-muted)]" /><input id="docs-search" type="search" value={query} onChange={event => setQuery(event.target.value)} className="w-full rounded border border-[var(--border-hairline)] py-2 pl-9 pr-2 text-sm" placeholder="Search docs" /></div><div className="mt-5 space-y-1 text-sm"><a href="#pitch" className="block rounded px-2 py-2 font-bold hover:bg-[#edf5f3]">Pitch deck</a><a href="#team" className="block rounded px-2 py-2 hover:bg-[#edf5f3]">Team</a><a href="#technical" className="block rounded px-2 py-2 font-bold hover:bg-[#edf5f3]">Technical docs</a><a href="#live" className="block rounded px-2 py-2 hover:bg-[#edf5f3]">Live system</a><a href="#apis" className="block rounded px-2 py-2 hover:bg-[#edf5f3]">API inventory</a></div></nav>

      <div className="min-w-0 space-y-20 pb-16">{query.trim() && <section aria-label="Search results" className="surface-panel p-5"><h2 className="text-lg font-bold">Search results ({searchHits.length})</h2><div className="mt-3 flex flex-wrap gap-2">{searchHits.map((hit, index) => <a key={`${hit.category}-${hit.label}-${index}`} href={hit.href} className="rounded border border-[var(--border-hairline)] px-3 py-2 text-sm hover:border-[var(--accent-clean)]"><span className="mr-2 text-xs uppercase text-[var(--text-muted)]">{hit.category}</span>{hit.label}</a>)}</div>{!searchHits.length && <p className="mt-3 text-sm text-[var(--text-muted)]">No matching documentation or live records.</p>}</section>}<section id="pitch" className="scroll-mt-8"><p className="text-xs font-bold uppercase tracking-[.2em] text-[var(--accent-clean)]">Business view</p><h2 className="mt-3 text-3xl font-extrabold">Pitch deck</h2><div className="mt-7 grid gap-4 md:grid-cols-2">{pitch.map((s, index) => <article key={s.id} id={s.id} className="surface-panel scroll-mt-8 p-6"><span className="text-xs font-bold text-[var(--accent-solar)]">{String(index + 1).padStart(2, '0')}</span><h3 className="mt-3 text-xl font-bold">{s.title}</h3><SectionBody section={s} /></article>)}</div>{!pitch.length && <p className="mt-5 text-[var(--text-muted)]">No matching pitch sections.</p>}</section>

      <section id="team" className="scroll-mt-8"><p className="text-xs font-bold uppercase tracking-[.2em] text-[var(--accent-clean)]">People</p><h2 className="mt-3 text-3xl font-extrabold">{data.content.team_name || 'Team'}</h2>{data.content.team.length ? <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{data.content.team.map(member => <article key={member.email} className="surface-panel overflow-hidden"><TeamPortrait member={member} /><div className="p-5"><h3 className="text-lg font-bold">{member.name}</h3><p className="mt-1 text-sm text-[var(--text-muted)]">{member.role}</p><a href={`mailto:${member.email}`} className="mt-3 block break-all text-sm font-semibold text-[var(--accent-clean)]">{member.email}</a></div></article>)}</div> : <p className="mt-5 text-sm text-[var(--text-muted)]">Team profiles have not been published yet.</p>}</section>

      <section id="technical" className="scroll-mt-8"><p className="text-xs font-bold uppercase tracking-[.2em] text-[var(--accent-clean)]">Engineering view</p><h2 className="mt-3 text-3xl font-extrabold">Technical documentation</h2><div className="mt-7 space-y-4">{technical.map(s => <article key={s.id} id={`tech-${s.id}`} className="surface-panel scroll-mt-8 p-6"><h3 className="text-xl font-bold">{s.title}</h3><SectionBody section={s} />{s.id === 'architecture' && <div className="mt-6"><Flow nodes={data.content.architecture_nodes} /></div>}{s.id === 'data-flow' && <div className="mt-6"><Flow nodes={data.content.data_flow_nodes} /></div>}</article>)}</div>{!technical.length && <p className="mt-5 text-[var(--text-muted)]">No matching technical sections.</p>}</section>

      <section id="live" className="scroll-mt-8"><p className="text-xs font-bold uppercase tracking-[.2em] text-[var(--accent-clean)]">Live application state</p><h2 className="mt-3 text-3xl font-extrabold">Implementation & activity snapshot</h2><p className="mt-3 text-sm text-[var(--text-muted)]">Refreshed every 10 seconds while open. Last response: {new Date(data.live.as_of).toLocaleString()}. Feature labels describe implementation status, not a runtime health check. Counts describe prototype activity, not customers or impact.</p><div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Object.entries(data.live.metrics).filter(([key]) => key !== 'latest_carbon_snapshot_at').map(([key, value]) => <div key={key} className="surface-panel p-5"><span className="text-xs uppercase tracking-wider text-[var(--text-muted)]">{key.replaceAll('_', ' ')}</span><strong className="mt-2 block text-2xl">{value ?? '—'}</strong></div>)}</div><div className="surface-panel mt-5 divide-y divide-[var(--border-hairline)]">{data.live.features.map(feature => <div key={feature.name} className="flex flex-wrap items-start justify-between gap-3 p-5 text-sm"><div><strong>{feature.name}</strong><p className="mt-1 text-[var(--text-muted)]">{feature.detail}</p></div><span className={`rounded px-2 py-1 text-xs font-bold ${feature.status === 'implemented' ? 'bg-[#e3f4ef] text-[#176d67]' : 'bg-[#eff1f4] text-[#526576]'}`}>{feature.status}</span></div>)}</div><h3 className="mt-7 text-xl font-bold">Recent events</h3><div className="surface-panel mt-3 divide-y divide-[var(--border-hairline)]">{data.live.events.length ? data.live.events.map((event, index) => <div key={`${event.at}-${index}`} className="flex flex-wrap justify-between gap-2 p-4 text-sm"><span>{event.type}</span><time dateTime={event.at} className="text-[var(--text-muted)]">{new Date(event.at).toLocaleString()}</time></div>) : <p className="p-4 text-sm text-[var(--text-muted)]">No saved plans or decisions yet.</p>}</div><h3 className="mt-7 text-xl font-bold">Documentation changelog</h3><div className="surface-panel mt-3 divide-y divide-[var(--border-hairline)]">{data.versions.map(version => <div key={version.version} className="flex flex-wrap justify-between gap-2 p-4 text-sm"><strong>Version {version.version}</strong><time dateTime={version.published_at} className="text-[var(--text-muted)]">{new Date(version.published_at).toLocaleString()}</time></div>)}</div></section>

      <section id="modules" className="scroll-mt-8"><p className="text-xs font-bold uppercase tracking-[.2em] text-[var(--accent-clean)]">Extensible modules</p><h2 className="mt-3 text-3xl font-extrabold">Additional live views</h2><div className="mt-6 grid gap-4 sm:grid-cols-2">{data.plugins.map(plugin => <article key={plugin.slug} className="surface-panel p-5"><h3 className="font-bold">{plugin.title}</h3>{plugin.unavailable ? <p className="mt-2 text-sm text-[var(--text-muted)]">Module unavailable.</p> : <dl className="mt-3 space-y-2 text-sm">{Object.entries(plugin.data || {}).map(([key, value]) => <div key={key} className="flex flex-wrap justify-between gap-2"><dt className="text-[var(--text-muted)]">{key.replaceAll('_', ' ')}</dt><dd className="font-semibold">{String(value ?? 'No reading')}</dd></div>)}</dl>}</article>)}</div></section>
      <section id="apis" className="scroll-mt-8"><p className="text-xs font-bold uppercase tracking-[.2em] text-[var(--accent-clean)]">Registered at runtime</p><h2 className="mt-3 text-3xl font-extrabold">API inventory</h2><div className="surface-panel mt-6 max-h-[420px] overflow-auto"><table className="quiet-table min-w-[660px]"><thead><tr><th>Method</th><th>Path</th><th>Purpose</th><th>Access</th></tr></thead><tbody>{data.live.api_routes.map((route, index) => <tr key={`${route.method}-${route.path}-${index}`}><td className="font-bold">{route.method}</td><td className="font-mono text-xs">{route.path}</td><td>{route.summary}</td><td>{route.auth}</td></tr>)}</tbody></table></div></section></div>
    </div>
  </div>;
}
