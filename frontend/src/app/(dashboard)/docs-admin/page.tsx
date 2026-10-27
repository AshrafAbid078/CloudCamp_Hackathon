'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/useAuthStore';
import type { Content, Member, Section } from '../../(marketing)/docs/view';

type AdminState = { enabled: boolean; starts_at: string | null; ends_at: string | null; visible_now: boolean; draft: Content; published: Content | null; version: number; versions: { version: number; published_by: string; published_at: string }[] };
const SIX_HOURS = 6 * 60 * 60 * 1000;
const toDhakaInput = (iso: string | null) => iso ? new Date(new Date(iso).getTime() + SIX_HOURS).toISOString().slice(0, 16) : '';
const fromDhakaInput = (input: string) => input ? `${input}:00+06:00` : null;

function RichEditor({ section, onChange }: { section: Section; onChange: (html: string, text: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const escaped = section.body.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('\n', '<br>');
  const format = (command: string) => {
    ref.current?.focus();
    document.execCommand(command, false);
  };
  return <div><div className="mb-3 flex flex-wrap gap-2" role="toolbar" aria-label="Text formatting">{[['bold', 'Bold'], ['italic', 'Italic'], ['insertUnorderedList', 'Bullets'], ['insertOrderedList', 'Numbers']].map(([command, label]) => <button key={command} type="button" onMouseDown={event => event.preventDefault()} onClick={() => format(command)} className="rounded border border-[var(--border-hairline)] px-3 py-1.5 text-sm font-semibold">{label}</button>)}</div><div ref={ref} contentEditable suppressContentEditableWarning role="textbox" aria-label={`Rich text for ${section.title}`} onPaste={event => { event.preventDefault(); const text = event.clipboardData.getData('text/plain'); const selection = window.getSelection(); if (selection?.rangeCount) { const range = selection.getRangeAt(0); range.deleteContents(); range.insertNode(document.createTextNode(text)); range.collapse(false); } }} onBlur={event => onChange(event.currentTarget.innerHTML, event.currentTarget.innerText)} dangerouslySetInnerHTML={{ __html: section.body_html || escaped }} className="docs-richtext min-h-40 rounded-md border border-[var(--border-hairline)] bg-white p-5 text-sm leading-7 focus:border-[var(--accent-clean)]" /></div>;
}

export default function DocsAdminPage() {
  const role = useAuthStore(state => state.user?.role);
  const [state, setState] = useState<AdminState | null>(null);
  const [draft, setDraft] = useState<Content | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [duration, setDuration] = useState(24);
  const [richSectionId, setRichSectionId] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const load = async (preserveDraft = false) => {
    const result = await apiClient<AdminState>('/showcase/admin', { cache: 'no-store' });
    setState(result); if (!preserveDraft) setDraft(result.draft); setEnabled(result.enabled);
    setStart(toDhakaInput(result.starts_at)); setEnd(toDhakaInput(result.ends_at));
  };
  useEffect(() => {
    if (role !== 'admin') return;
    void apiClient<AdminState>('/showcase/admin', { cache: 'no-store' }).then(result => {
      setState(result); setDraft(result.draft); setEnabled(result.enabled);
      setStart(toDhakaInput(result.starts_at)); setEnd(toDhakaInput(result.ends_at));
    }).catch(error => setMessage(error instanceof Error ? error.message : 'Could not load docs.'));
  }, [role]);

  const run = async (action: () => Promise<unknown>, success: string, preserveDraft = false) => {
    setBusy(true); setMessage('');
    try { await action(); await load(preserveDraft); setMessage(success); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Action failed.'); }
    finally { setBusy(false); }
  };
  const patchDraft = (next: Content) => setDraft(next);
  const patchSection = (index: number, change: Partial<Section>) => {
    if (!draft) return;
    const sections = [...draft.sections]; sections[index] = { ...sections[index], ...change };
    if ('body' in change && !('body_html' in change)) sections[index].body_html = null;
    patchDraft({ ...draft, sections });
  };
  const moveSection = (index: number, offset: number) => {
    if (!draft || index + offset < 0 || index + offset >= draft.sections.length) return;
    const sections = [...draft.sections]; [sections[index], sections[index + offset]] = [sections[index + offset], sections[index]];
    patchDraft({ ...draft, sections });
  };
  const dropSection = (from: number, to: number) => {
    if (!draft || from === to || from < 0 || from >= draft.sections.length) return;
    const sections = [...draft.sections];
    const [moved] = sections.splice(from, 1);
    sections.splice(to, 0, moved);
    patchDraft({ ...draft, sections });
  };
  const patchMember = (index: number, change: Partial<Member>) => {
    if (!draft) return;
    const team = [...draft.team]; team[index] = { ...team[index], ...change };
    patchDraft({ ...draft, team });
  };
  const patchNodes = (key: 'architecture_nodes' | 'data_flow_nodes', value: string) => {
    if (draft) patchDraft({ ...draft, [key]: value.split('\n').map(s => s.trim()).filter(Boolean) });
  };

  if (role !== 'admin') return <div className="surface-panel p-8"><h1 className="text-2xl font-bold">Admin access required</h1><p className="mt-3 text-[var(--text-muted)]">Only the existing Admin role can manage public documentation.</p></div>;
  if (!state || !draft) return <p className="p-6 text-[var(--text-muted)]">Loading documentation controls… {message}</p>;

  return <div className="space-y-8 pb-12"><div><p className="page-kicker">Workspace / Admin</p><h1 className="page-title">Documentation publishing</h1><p className="page-subtitle">Control the public /docs page and edit its published content.</p></div>
    <div className="surface-panel p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Public availability</h2><p className="mt-1 text-sm text-[var(--text-muted)]">Currently {state.visible_now ? 'public' : 'closed'} · published version {state.version}</p></div><Link href="/docs" target="_blank" className="teal-link text-sm">Open public page →</Link></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)} /> Visibility ON</label><p className="text-sm text-[var(--text-muted)]">OFF closes access immediately, even inside the date window.</p><label className="text-sm font-semibold">Starts · Asia/Dhaka<input type="datetime-local" value={start} onChange={event => setStart(event.target.value)} className="form-control mt-2" /></label><label className="text-sm font-semibold">Ends · Asia/Dhaka<input type="datetime-local" value={end} onChange={event => setEnd(event.target.value)} className="form-control mt-2" /></label></div><div className="mt-5 flex flex-wrap items-end gap-3"><button disabled={busy} onClick={() => void run(() => apiClient('/showcase/admin/settings', { method: 'PUT', body: JSON.stringify({ enabled, starts_at: fromDhakaInput(start), ends_at: fromDhakaInput(end) }) }), 'Publishing settings saved.', true)} className="rounded-md bg-[var(--accent-clean)] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">Save visibility & schedule</button><button disabled={busy} onClick={() => void run(() => apiClient('/showcase/admin/settings', { method: 'PUT', body: JSON.stringify({ enabled: true, starts_at: null, ends_at: null }) }), 'Public access enabled now.', true)} className="rounded-md border border-[var(--border-hairline)] px-4 py-2.5 text-sm font-bold disabled:opacity-50">Publish now, no end</button><button disabled={busy} onClick={() => void run(() => apiClient('/showcase/admin/settings', { method: 'PUT', body: JSON.stringify({ enabled: false, starts_at: fromDhakaInput(start), ends_at: fromDhakaInput(end) }) }), 'Public access disabled.', true)} className="rounded-md border border-[#db9b9b] px-4 py-2.5 text-sm font-bold text-[#a53c3c] disabled:opacity-50">Turn OFF now</button></div><div className="mt-5 flex flex-wrap items-end gap-3 border-t border-[var(--border-hairline)] pt-5"><label className="text-sm font-semibold">Duration in hours<input type="number" min={1} max={2160} value={duration} onChange={event => setDuration(Number(event.target.value))} className="form-control mt-2 w-32" /></label><button disabled={busy} onClick={() => void run(() => apiClient('/showcase/admin/publish-for', { method: 'POST', body: JSON.stringify({ hours: duration }) }), `Public access enabled for ${duration} hours.`, true)} className="rounded-md border border-[var(--border-hairline)] px-4 py-2.5 text-sm font-bold disabled:opacity-50">Publish for duration</button></div><p className="mt-5 text-xs text-[var(--text-muted)]">Default window: 10 June 2027 00:00 to 14 June 2027 23:59 Asia/Dhaka. Empty start/end means no bound. The Admin role is the highest role currently defined; a separate Super Admin role does not exist.</p></div>

    <div className="surface-panel p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Section editor</h2><p className="mt-1 text-sm text-[var(--text-muted)]">Edit each card directly or use its text field. Drag cards to reorder; save the draft, then publish. Content is plain text for safety.</p></div><div className="flex gap-2"><button disabled={busy} onClick={() => void run(() => apiClient('/showcase/admin/draft', { method: 'PUT', body: JSON.stringify(draft) }), 'Draft saved.')} className="inline-flex items-center gap-2 rounded-md border border-[var(--border-hairline)] px-4 py-2.5 text-sm font-bold disabled:opacity-50"><Save size={16} /> Save draft</button><button disabled={busy} onClick={() => void run(async () => { await apiClient('/showcase/admin/draft', { method: 'PUT', body: JSON.stringify(draft) }); await apiClient('/showcase/admin/publish', { method: 'POST' }); }, 'New version published.')} className="rounded-md bg-[var(--accent-clean)] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">Publish draft</button></div></div><div className="mt-6 space-y-5">{draft.sections.map((section, index) => <div key={section.id} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); dropSection(Number(event.dataTransfer.getData('text/plain')), index); }} className="rounded-md border border-[var(--border-hairline)] p-5"><div className="flex flex-wrap items-center justify-between gap-2"><span draggable onDragStart={event => event.dataTransfer.setData('text/plain', String(index))} className="cursor-grab text-xs font-bold uppercase tracking-wider text-[var(--accent-clean)]" title="Drag to reorder">☷ {section.group} · {section.id}</span><div className="flex gap-2"><button title="Move up" aria-label={`Move ${section.title} up`} disabled={index === 0} onClick={() => moveSection(index, -1)}><ArrowUp size={17} /></button><button title="Move down" aria-label={`Move ${section.title} down`} disabled={index === draft.sections.length - 1} onClick={() => moveSection(index, 1)}><ArrowDown size={17} /></button><button title="Remove section" aria-label={`Remove ${section.title}`} onClick={() => patchDraft({ ...draft, sections: draft.sections.filter((_, i) => i !== index) })}><Trash2 size={17} /></button></div></div><select aria-label={`${section.title} category`} value={section.group} onChange={event => patchSection(index, { group: event.target.value as Section['group'] })} className="form-control mt-3"><option value="pitch">Pitch deck</option><option value="technical">Technical documentation</option></select><input aria-label="Section title" value={section.title} onChange={event => patchSection(index, { title: event.target.value })} className="form-control mt-3 font-bold" /><textarea aria-label={`${section.title} body`} value={section.body} onChange={event => patchSection(index, { body: event.target.value })} rows={4} className="form-control mt-3" /><div className="mt-4 rounded-md bg-[#f5f8f8] p-4"><p className="text-xs font-semibold uppercase text-[var(--text-muted)]">Editable page preview</p><h3 className="mt-2 text-lg font-bold">{section.title}</h3><p contentEditable suppressContentEditableWarning role="textbox" aria-label={`Edit ${section.title} directly`} onPaste={event => { event.preventDefault(); const text = event.clipboardData.getData('text/plain'); const selection = window.getSelection(); if (selection?.rangeCount) { const range = selection.getRangeAt(0); range.deleteContents(); range.insertNode(document.createTextNode(text)); range.collapse(false); } }} onBlur={event => patchSection(index, { body: event.currentTarget.innerText })} className="mt-2 min-h-16 whitespace-pre-line rounded border border-transparent p-2 text-sm leading-7 text-[var(--text-muted)] focus:border-[var(--accent-clean)]">{section.body}</p></div></div>)}</div><button onClick={() => { const id = `section-${Date.now()}`; patchDraft({ ...draft, sections: [...draft.sections, { id, title: 'New section', group: 'technical', body: '' }] }); }} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--accent-clean)]"><Plus size={17} /> Add section</button></div>

    <div className="surface-panel p-6"><h2 className="text-xl font-bold">Rich text editor</h2><p className="mt-2 text-sm text-[var(--text-muted)]">Choose a section, then format text as it will appear on the public page. HTML is cleaned by the server before saving.</p><select aria-label="Section to format" value={richSectionId || draft.sections[0]?.id || ''} onChange={event => setRichSectionId(event.target.value)} className="form-control mt-4">{draft.sections.map(section => <option key={section.id} value={section.id}>{section.title}</option>)}</select>{draft.sections.length > 0 && (() => { const index = Math.max(0, draft.sections.findIndex(section => section.id === richSectionId)); const section = draft.sections[index]; return <div className="mt-5"><RichEditor key={section.id} section={section} onChange={(html, plain) => patchSection(index, { body_html: html, body: plain })} /></div>; })()}</div>
    <div className="grid gap-5 lg:grid-cols-2"><div className="surface-panel p-6"><h2 className="text-xl font-bold">Editable diagrams</h2><p className="mt-2 text-sm text-[var(--text-muted)]">One node per line. The public page renders the sequence as a responsive flow diagram.</p><label className="mt-5 block text-sm font-semibold">Architecture nodes<textarea value={draft.architecture_nodes.join('\n')} onChange={event => patchNodes('architecture_nodes', event.target.value)} rows={5} className="form-control mt-2" /></label><label className="mt-5 block text-sm font-semibold">Data flow nodes<textarea value={draft.data_flow_nodes.join('\n')} onChange={event => patchNodes('data_flow_nodes', event.target.value)} rows={5} className="form-control mt-2" /></label></div><div className="surface-panel p-6"><h2 className="text-xl font-bold">Team showcase</h2><p className="mt-2 text-sm text-[var(--text-muted)]">Profiles remain absent publicly until you add and publish verified details.</p><label className="mt-5 block text-sm font-semibold">Team name<input value={draft.team_name} onChange={event => patchDraft({ ...draft, team_name: event.target.value })} className="form-control mt-2" /></label>{draft.team.map((member, index) => <div key={index} className="mt-4 space-y-2 rounded-md border border-[var(--border-hairline)] p-4"><input aria-label="Full name" placeholder="Full name" value={member.name} onChange={event => patchMember(index, { name: event.target.value })} className="form-control" /><input aria-label="Role" placeholder="Role" value={member.role} onChange={event => patchMember(index, { role: event.target.value })} className="form-control" /><input aria-label="Email" type="email" placeholder="Email" value={member.email} onChange={event => patchMember(index, { email: event.target.value })} className="form-control" /><input aria-label="Photo URL" placeholder="HTTPS photo URL or /local-path" value={member.photo_url || ''} onChange={event => patchMember(index, { photo_url: event.target.value || null })} className="form-control" /><button onClick={() => patchDraft({ ...draft, team: draft.team.filter((_, i) => i !== index) })} className="text-sm font-bold text-red-700">Remove member</button></div>)}<button onClick={() => patchDraft({ ...draft, team: [...draft.team, { name: '', role: '', email: '', photo_url: null }] })} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[var(--accent-clean)]"><Plus size={17} /> Add member</button></div></div>

    <div className="surface-panel p-6"><h2 className="text-xl font-bold">Published versions</h2><p className="mt-1 text-sm text-[var(--text-muted)]">Restore copies a historical version into the draft. Publish the draft to make it public.</p><div className="mt-4 divide-y divide-[var(--border-hairline)]">{state.versions.map(version => <div key={version.version} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><span>v{version.version} · {version.published_by} · {new Date(version.published_at).toLocaleString()}</span><button disabled={busy} onClick={() => void run(() => apiClient(`/showcase/admin/restore/${version.version}`, { method: 'POST' }), `Version ${version.version} restored to draft.`)} className="teal-link disabled:opacity-50">Restore to draft</button></div>)}</div></div><p role="status" className="text-sm font-semibold text-[var(--accent-clean)]">{message}</p>
  </div>;
}
