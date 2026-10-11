'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  RotateCcw,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { Button, Chip } from '@/components/common';
import { useCopilot, useRole } from '@/hooks';

const PROMPT_PRESETS = [
  {
    title: 'Analyze 13:00 GHI Dip',
    prompt: 'Explain what caused the 120 W/m² GHI dip at 13:00 and how the optimizer responded.',
    category: 'Solar Forecast',
  },
  {
    title: 'Curtailment Risk Evaluation',
    prompt: 'What is the curtailment risk at the Mohave Interconnection Substation today?',
    category: 'Grid Reliability',
  },
  {
    title: 'Battery Arbitrage Strategy',
    prompt: 'Explain the battery charge and discharge schedule strategy for the evening peak prices.',
    category: 'Arbitrage',
  },
  {
    title: 'Manual Override Feasibility',
    prompt: 'Can I discharge 30 MW between 16:00 and 17:00 without violating warranty thermal limits?',
    category: 'Operations',
  },
];

export default function CopilotChatInterfacePage() {
  const { messages, isLoading, sendMessage, clearMessages } = useCopilot();
  const { role } = useRole();
  const [inputVal, setInputVal] = useState('');
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

  const handleSelectPreset = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md overflow-hidden">
      {/* Copilot Header */}
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-sky-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Helios Solar & Grid Copilot
              </h2>
              <Chip variant="amber" size="sm">
                LLM Grounded SCADA
              </Chip>
            </div>
            <p className="text-[11px] text-zinc-500">
              Contextually bound to GOES-16 satellite imagery, ground pyranometers & CAISO LMP feeds.
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
            Clear History
          </Button>
          <Chip variant="info" size="sm" className="capitalize">
            Active: {role}
          </Chip>
        </div>
      </div>

      {/* Preset Suggestions Strip */}
      <div className="p-3 bg-zinc-100/50 dark:bg-zinc-900/50 border-b border-zinc-200/60 dark:border-zinc-800 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider shrink-0 px-2">
          Suggested Queries:
        </span>
        {PROMPT_PRESETS.map((p) => (
          <button
            key={p.title}
            onClick={() => handleSelectPreset(p.prompt)}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-amber-500 hover:text-amber-500 text-xs shrink-0 transition-all cursor-pointer shadow-2xs"
          >
            {p.title}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-xs ${
                  isUser
                    ? 'bg-sky-600'
                    : 'bg-gradient-to-tr from-amber-500 to-amber-600 text-zinc-950'
                }`}
              >
                {isUser ? 'OP' : <Sparkles className="w-4 h-4 fill-current text-white" />}
              </div>

              <div
                className={`p-4 rounded-2xl text-xs space-y-3 leading-relaxed shadow-xs ${
                  isUser
                    ? 'bg-sky-600 text-white rounded-tr-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-xs border border-zinc-200/60 dark:border-zinc-700/60'
                }`}
              >
                <p className="whitespace-pre-line">{msg.content}</p>

                {/* Grounding Citations */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700/80 space-y-1">
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                      Grounded Telemetry Sources:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.citations.map((c, i) => (
                        <div
                          key={i}
                          className="px-2 py-1 rounded bg-white/60 dark:bg-zinc-900/60 border border-zinc-300/60 dark:border-zinc-700 text-[10px] text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5"
                        >
                          <BookOpen className="w-3 h-3 text-sky-500" />
                          <span>{c.title}</span>
                          {c.metricValue && (
                            <strong className="text-amber-500">({c.metricValue})</strong>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-[10px] text-zinc-400 dark:text-zinc-500 text-right">
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3 p-4 max-w-md rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-500">
            <Bot className="w-5 h-5 text-amber-500 animate-spin" />
            <span>Consulting GHI neural weights and CAISO LMP node...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center gap-3"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Ask Helios Copilot about solar forecasts, battery arbitrage, or SCADA interlocks..."
            className="w-full rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <Button
          type="submit"
          variant="amber"
          size="md"
          disabled={isLoading || !inputVal.trim()}
          rightIcon={<Send className="w-4 h-4" />}
          className="font-bold py-3"
        >
          Send Query
        </Button>
      </form>
    </div>
  );
}
