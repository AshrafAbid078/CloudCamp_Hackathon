'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { useCopilot } from '@/hooks/use-copilot';
import { useRoleStore } from '@/lib/store/useRoleStore';
import { dispatchApi } from '@/lib/api';

type ScenarioResult = Awaited<ReturnType<typeof dispatchApi.compareScenario>>;

const SAMPLE_PROMPTS = [
  { label: '☀️ Today\'s Solar Forecast', text: 'What is today\'s solar generation forecast and grid carbon intensity?' },
  { label: '⚡ Simulate 200 kW Solar', text: 'What happens if we install 200 kW rooftop solar capacity?' },
  { label: '🔋 Battery Arbitrage Rationale', text: 'Explain the decision logic for the battery charge and discharge windows.' },
  { label: '🏭 24h Peak Shaving Status', text: 'What are today\'s baseline vs optimized costs and peak load reduction?' },
];

export default function CopilotStudioPage() {
  const { messages, sendMessage, isLoading, clearMessages } = useCopilot();
  const { role, toggleRole } = useRoleStore();
  const [inputPrompt, setInputPrompt] = useState('');
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});

  // Scenario quick widget state
  const [capacity, setCapacity] = useState('250');
  const [scenarioResult, setScenarioResult] = useState<ScenarioResult | null>(null);
  const [scenarioBusy, setScenarioBusy] = useState(false);
  const [scenarioError, setScenarioError] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!inputPrompt.trim() || isLoading) return;
    const text = inputPrompt;
    setInputPrompt('');
    await sendMessage(text);
  }

  async function runQuickScenario(e: FormEvent) {
    e.preventDefault();
    const val = Number(capacity);
    if (!Number.isFinite(val) || val < 0) {
      setScenarioError('Enter valid capacity in kW');
      return;
    }
    setScenarioBusy(true);
    setScenarioError('');
    try {
      const res = await dispatchApi.compareScenario(val);
      setScenarioResult(res);
    } catch (err) {
      setScenarioError(err instanceof Error ? err.message : 'Scenario run failed');
    } finally {
      setScenarioBusy(false);
    }
  }

  function toggleToolDetails(id: string) {
    setExpandedTools((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <main className="space-y-6">
      {/* Header with Role Perspective Switcher */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="page-kicker">Intelligence / Phase 5</p>
          <h1 className="page-title">AI Copilot & MCP Studio</h1>
          <p className="page-subtitle">
            Source-labelled demo tools with optional Gemini reasoning and a separate local MCP server
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-overlay)] px-3 py-1.5 text-xs">
            <span className="text-[var(--text-muted)]">Active Role: </span>
            <span className="font-semibold text-[var(--accent-clean)]">
              {role === 'facility_manager' ? '🏢 Facility Manager' : '⚡ Grid Operator'}
            </span>
          </div>
          <button
            onClick={toggleRole}
            className="rounded-md border border-[var(--accent-clean)] bg-[var(--surface-card)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-clean)] transition-colors hover:bg-[var(--accent-clean)] hover:text-white"
          >
            Switch Role View
          </button>
        </div>
      </header>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chat Stream (2 Cols on lg) */}
        <section className="surface-panel flex flex-col h-[700px] lg:col-span-2 overflow-hidden border border-[var(--border-subtle)]">
          {/* Top Chat Bar */}
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-3.5 bg-[var(--surface-overlay)]">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Live Grounded Session
              </span>
            </div>
            <button
              onClick={clearMessages}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              Reset Chat
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {messages.map((msg, index) => {
              const isUser = msg.sender === 'user';
              const isSystem = msg.sender === 'system';
              return (
                <div
                  key={msg.id || index}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-[var(--accent-clean)] text-white rounded-tr-none'
                        : isSystem
                        ? 'border border-red-500/30 bg-red-950/20 text-red-200'
                        : 'border border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-primary)] rounded-tl-none shadow-sm'
                    }`}
                  >
                    {/* Role & Sender Tag */}
                    <div className="mb-1.5 flex items-center gap-2 text-[11px] opacity-75">
                      <span className="font-semibold">
                        {isUser ? 'You' : isSystem ? 'System Warning' : 'Meridian Copilot'}
                      </span>
                      <span>•</span>
                      <span>{msg.timestamp || 'Just now'}</span>
                      {msg.inferenceMode && <span>{msg.inferenceMode === 'gemini' ? 'Gemini + tool evidence' : 'Local tool response'}</span>}
                    </div>

                    {/* Markdown / Text Content */}
                    <div className="whitespace-pre-line text-sm">{msg.content}</div>

                    {/* MCP Tool Execution Badges */}
                    {msg.toolCalls && msg.toolCalls.length > 0 && (
                      <div className="mt-3 space-y-2 border-t border-[var(--border-subtle)] pt-2.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                          ⚡ Tool evidence:
                        </p>
                        {msg.toolCalls.map((tc, tcIdx) => {
                          const toolId = `${msg.id}-tc-${tcIdx}`;
                          const isExpanded = !!expandedTools[toolId];
                          return (
                            <div
                              key={tcIdx}
                              className="rounded border border-emerald-500/20 bg-emerald-950/10 p-2 text-xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-emerald-300 font-medium">
                                  {tc.toolName}()
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleToolDetails(toolId)}
                                  className="text-[11px] text-emerald-400 underline hover:text-emerald-300"
                                >
                                  {isExpanded ? 'Hide Payload' : 'Inspect Output'}
                                </button>
                              </div>
                              {isExpanded && tc.outputSummary && (
                                <pre className="mt-2 max-h-40 overflow-x-auto rounded bg-black/40 p-2 font-mono text-[10px] text-emerald-200/90 whitespace-pre">
                                  {tc.outputSummary}
                                </pre>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] p-3">
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--accent-clean)] border-t-transparent" />
                <span>Copilot is checking demo tools and sources…</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts Carousel */}
          <div className="border-t border-[var(--border-subtle)] bg-[var(--surface-overlay)] px-6 py-2.5 overflow-x-auto">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] whitespace-nowrap">
                Quick Prompts:
              </span>
              {SAMPLE_PROMPTS.map((sp, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isLoading}
                  onClick={() => sendMessage(sp.text)}
                  className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-1 text-xs text-[var(--text-muted)] transition-colors hover:border-[var(--accent-clean)] hover:text-[var(--accent-clean)] whitespace-nowrap disabled:opacity-50"
                >
                  {sp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Input Form */}
          <form
            onSubmit={handleSend}
            className="flex items-center gap-3 border-t border-[var(--border-subtle)] bg-[var(--surface-card)] p-4"
          >
            <input
              type="text"
              maxLength={1000}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={
                role === 'facility_manager'
                  ? 'Ask about solar output, cost reductions, or equipment shifting…'
                  : 'Ask about feeder headroom, MW peak reduction, or stress windows…'
              }
              disabled={isLoading}
              className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-overlay)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-clean)] focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="rounded-lg bg-[var(--accent-clean)] px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {isLoading ? 'Thinking…' : 'Send'}
            </button>
          </form>
        </section>

        {/* Right Sidebar: MCP Tools Registry & Instant Scenario Engine */}
        <aside className="space-y-6">
          {/* Active MCP Tools Registry */}
          <section className="surface-panel p-5 border border-[var(--border-subtle)] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
                Shared Tool Registry
              </h2>
              <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-400">
                4 Mounted
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              These tools conform to the Model Context Protocol standard and execute deterministic code.
            </p>
            <div className="space-y-2.5">
              <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-overlay)] p-3 text-xs">
                <span className="font-mono font-semibold text-[var(--accent-clean)]">
                  get_solar_forecast
                </span>
                <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                  Regional GHI & grid carbon intensity lookahead (1–24h).
                </p>
              </div>
              <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-overlay)] p-3 text-xs">
                <span className="font-mono font-semibold text-[var(--accent-clean)]">
                  get_dispatch_schedule
                </span>
                <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                  Current 24h MILP schedule, cost delta & battery charge slots.
                </p>
              </div>
              <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-overlay)] p-3 text-xs">
                <span className="font-mono font-semibold text-[var(--accent-clean)]">
                  simulate_whatif
                </span>
                <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                  Dynamic re-optimization under hypothetical PV/feeder values.
                </p>
              </div>
              <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-overlay)] p-3 text-xs">
                <span className="font-mono font-semibold text-[var(--accent-clean)]">
                  explain_decision
                </span>
                <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                  Economic rationale mapping TOU tariffs to machine slots.
                </p>
              </div>
            </div>
          </section>

          {/* Instant Scenario Calculator */}
          <section className="surface-panel p-5 border border-[var(--border-subtle)] space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Instant Scenario Solver
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Test hypothetical PV capacity against baseline zero-PV using the PuLP solver.
            </p>

            <form onSubmit={runQuickScenario} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">
                  PV Capacity (kW)
                </label>
                <input
                  type="number"
                  min="0"
                  step="25"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--surface-overlay)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-clean)] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={scenarioBusy}
                className="w-full rounded-md bg-[var(--surface-card)] border border-[var(--accent-clean)] py-2 text-xs font-bold text-[var(--accent-clean)] transition-colors hover:bg-[var(--accent-clean)] hover:text-white disabled:opacity-50"
              >
                {scenarioBusy ? 'Solving MILP…' : 'Run Scenario'}
              </button>
            </form>

            {scenarioError && (
              <p className="text-xs text-red-400">{scenarioError}</p>
            )}

            {scenarioResult && (
              <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-overlay)] p-3 space-y-2 text-xs">
                <span className="text-[11px] font-semibold uppercase text-emerald-400">
                  Signed Impact Deltas:
                </span>
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="rounded bg-[var(--surface-card)] p-1.5 border border-[var(--border-subtle)]">
                    <div className="text-[10px] text-[var(--text-muted)]">Cost</div>
                    <div className="font-mono font-bold text-[var(--text-primary)]">
                      ${scenarioResult.change.cost_usd.toFixed(2)}
                    </div>
                  </div>
                  <div className="rounded bg-[var(--surface-card)] p-1.5 border border-[var(--border-subtle)]">
                    <div className="text-[10px] text-[var(--text-muted)]">Emissions</div>
                    <div className="font-mono font-bold text-[var(--text-primary)]">
                      {scenarioResult.change.emissions_kg.toFixed(1)} kg
                    </div>
                  </div>
                  <div className="rounded bg-[var(--surface-card)] p-1.5 border border-[var(--border-subtle)]">
                    <div className="text-[10px] text-[var(--text-muted)]">Peak Shaved</div>
                    <div className="font-mono font-bold text-[var(--text-primary)]">
                      {scenarioResult.change.peak_kw.toFixed(1)} kW
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
