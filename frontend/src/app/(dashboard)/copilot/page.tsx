'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  RotateCcw,
  BookOpen,
  Terminal,
} from 'lucide-react';
import { Button, Chip } from '@/components/common';
import { useCopilot, useRole } from '@/hooks';

const PRESET_QUERIES = [
  {
    title: '30% Afternoon Solar Drop',
    prompt: 'What happens if solar output drops 30% this afternoon between 13:00 and 16:00?',
    type: 'whatif',
  },
  {
    title: 'Explain Dye-Vat #2 Window',
    prompt: 'Explain the decision to run Dye-Vat #2 at 11:30 instead of this morning.',
    type: 'explain',
  },
  {
    title: 'Evening Feeder Stress Mitigation',
    prompt: 'How is the BESS battery scheduled to relieve national grid stress between 18:30 and 21:00?',
    type: 'dispatch',
  },
  {
    title: 'LightGBM vs Persistence Uplift',
    prompt: 'How much more accurate is the LightGBM model compared to the persistence baseline?',
    type: 'forecast',
  },
];

export default function CopilotChatInterfacePage() {
  const { messages, isLoading, sendMessage, clearMessages } = useCopilot();
  const { isFacilityManager, toggleRole } = useRole();
  const [inputVal, setInputVal] = useState('');
  const [whatIfSliderVal, setWhatIfSliderVal] = useState(30);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isLoading) return;
    sendMessage(inputVal);
    setInputVal('');
  };

  const handleRunSliderWhatIf = async () => {
    const promptText = `Run what-if simulation: solar drops by ${whatIfSliderVal}% between 13:00 and 16:00.`;
    sendMessage(promptText);
  };

  return (
    <div className="space-y-6">
      {/* Role Tone Demonstration Banner */}
      <div className="p-4 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[var(--accent-solar)]/15 text-[var(--accent-solar)] shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2">
              <span>Dual-Perspective Agentic Reasoning Engine</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] text-[var(--accent-solar)]">
                Active Tone: {isFacilityManager ? 'Action-First (Facility Manager ⚡)' : 'Terse-Numeric (Grid Operator 🏭)'}
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              {isFacilityManager
                ? 'Responses are formatted with plain-language action items, operational savings, and shift deadline assurances.'
                : 'Responses are formatted in SCADA-grade format: constraint validation, feeder headroom deltas, and kW contingency margins.'}
            </p>
          </div>
        </div>

        <button
          onClick={toggleRole}
          className="text-xs px-4 py-2 rounded-xl font-bold bg-[var(--bg-surface-raised)] hover:bg-[var(--bg-base)] text-[var(--accent-solar)] border border-[var(--border-hairline)] transition-all cursor-pointer shrink-0"
        >
          Flip Persona Tone ⇄
        </button>
      </div>

      {/* Main Chat Interface Container */}
      <div className="h-[680px] flex flex-col rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] shadow-xl overflow-hidden">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-[var(--border-hairline)] bg-[var(--bg-surface-raised)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[var(--accent-solar)] to-[var(--accent-clean)] flex items-center justify-center text-[var(--bg-base)] font-bold shadow-md shadow-[var(--accent-solar)]/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[var(--text-primary)] font-heading">
                  Meridian Intelligence Copilot
                </h2>
                <Chip variant="clean" size="sm" dot>
                  Tool-Calling Agent
                </Chip>
              </div>
              <p className="text-[10px] text-[var(--text-muted)]">
                Grounded in Electricity Maps BD, NREL NSRDB & Real-Time Inverter Modbus Streams
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearMessages}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Reset Session
            </Button>
          </div>
        </div>

        {/* What-If Simulation Trigger Strip */}
        <div className="p-3 bg-[var(--bg-base)] border-b border-[var(--border-hairline)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider shrink-0 font-mono">
              Suggested Prompts:
            </span>
            {PRESET_QUERIES.map((p) => (
              <button
                key={p.title}
                onClick={() => sendMessage(p.prompt)}
                disabled={isLoading}
                className="px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-[var(--text-primary)] hover:border-[var(--accent-solar)] text-[11px] shrink-0 transition-all cursor-pointer shadow-xs"
              >
                {p.title}
              </button>
            ))}
          </div>

          {/* Interactive What-If Slider */}
          <div className="flex items-center gap-2 shrink-0 bg-[var(--bg-surface-raised)] px-3 py-1.5 rounded-xl border border-[var(--border-hairline)]">
            <span className="text-[10px] font-mono text-[var(--accent-solar)] font-bold">
              Solar Drop: {whatIfSliderVal}%
            </span>
            <input
              type="range"
              min="10"
              max="70"
              step="5"
              value={whatIfSliderVal}
              onChange={(e) => setWhatIfSliderVal(parseInt(e.target.value, 10))}
              className="w-20 accent-[var(--accent-solar)] cursor-pointer"
            />
            <button
              onClick={handleRunSliderWhatIf}
              className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--accent-solar)] text-[var(--bg-base)] cursor-pointer"
            >
              Simulate
            </button>
          </div>
        </div>

        {/* Chat Messages Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs shadow-md ${
                    isUser
                      ? 'bg-[var(--accent-solar)] text-[var(--bg-base)]'
                      : 'bg-[var(--bg-surface-raised)] text-[var(--accent-clean)] border border-[var(--border-hairline)]'
                  }`}
                >
                  {isUser ? 'ME' : <Sparkles className="w-4 h-4 fill-current" />}
                </div>

                <div
                  className={`p-4 rounded-3xl text-xs space-y-3 leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-[var(--accent-solar)] text-[var(--bg-base)] font-medium rounded-tr-xs'
                      : 'bg-[var(--bg-surface-raised)] text-[var(--text-primary)] rounded-tl-xs border border-[var(--border-hairline)]'
                  }`}
                >
                  <p className="whitespace-pre-line text-xs leading-relaxed">{msg.content}</p>

                  {/* Tool-Call Tracer Chips with Monospace Arguments */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="pt-2 border-t border-[var(--border-hairline)]/80 space-y-1.5">
                      <span className="text-[10px] font-bold text-[var(--accent-solar)] uppercase tracking-wider font-mono flex items-center gap-1">
                        <Terminal className="w-3 h-3" />
                        <span>Copilot Tool Execution Traces</span>
                      </span>

                      <div className="space-y-1">
                        {msg.toolCalls.map((tc, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[11px] font-mono space-y-1"
                          >
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-[var(--accent-clean)] font-bold">
                                ⚡ [tool] {tc.toolName}
                              </span>
                              <span className="text-[var(--text-muted)]">{tc.durationMs}ms</span>
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)] truncate">
                              args: {JSON.stringify(tc.args)}
                            </div>
                            <div className="text-[10px] text-[var(--text-primary)]">
                              ↳ {tc.outputSummary}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grounding Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="pt-2 border-t border-[var(--border-hairline)]/60 flex flex-wrap gap-1.5">
                      {msg.citations.map((c, i) => (
                        <div
                          key={i}
                          className="px-2 py-0.5 rounded-lg bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[10px] text-[var(--text-muted)] flex items-center gap-1.5"
                        >
                          <BookOpen className="w-3 h-3 text-[var(--accent-solar)]" />
                          <span>{c.title}</span>
                          {c.metricValue && (
                            <strong className="text-[var(--accent-clean)]">({c.metricValue})</strong>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-[9px] text-[var(--text-muted)] text-right font-mono">
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-3 p-4 max-w-md rounded-2xl bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] text-xs text-[var(--accent-solar)]">
              <Bot className="w-5 h-5 animate-spin" />
              <div className="space-y-0.5">
                <span className="font-semibold block">Executing Agent Telemetry Tools...</span>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">
                  invoking get_forecast, run_whatif, and MILP re-solver
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-[var(--border-hairline)] bg-[var(--bg-surface-raised)] flex items-center gap-3"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask Meridian Copilot (e.g. 'What if solar drops 30%?', 'Explain Dye-Vat window')..."
              className="w-full rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-base)] px-4 py-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-solar)]"
            />
          </div>
          <Button
            type="submit"
            variant="solar"
            size="md"
            disabled={isLoading || !inputVal.trim()}
            rightIcon={<Send className="w-4 h-4" />}
            className="font-bold py-3"
          >
            Query Agent
          </Button>
        </form>
      </div>
    </div>
  );
}
