'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar, Header } from '@/components/layout';
import { useCopilot, useRole } from '@/hooks';
import { X, Send, Bot, Sparkles } from 'lucide-react';
import { Button } from '@/components/common';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen, toggle, messages, isLoading, sendMessage } = useCopilot();
  const { isFacilityManager } = useRole();
  const [inputVal, setInputVal] = React.useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isLoading) return;
    sendMessage(inputVal);
    setInputVal('');
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)]">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main App Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[var(--bg-base)]">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>

      {/* Slide-over Copilot Drawer (Accessible from any dashboard page) */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="w-96 shrink-0 h-screen border-l border-[var(--border-hairline)] bg-[var(--bg-surface)] shadow-2xl flex flex-col z-40"
          >
          {/* Drawer Header */}
          <div className="p-4 border-b border-[var(--border-hairline)] flex items-center justify-between bg-[var(--bg-surface-raised)]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[var(--accent-solar)]/15 text-[var(--accent-solar)]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <span>Meridian Copilot</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--accent-solar)]/20 text-[var(--accent-solar)] font-mono">
                    {isFacilityManager ? 'Manager' : 'Operator'}
                  </span>
                </h3>
                <p className="text-[10px] text-[var(--text-muted)]">
                  Contextual Agent with Live Tool Tracing
                </p>
              </div>
            </div>
            <button
              onClick={toggle}
              className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-base)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[92%] p-3.5 rounded-2xl ${
                      isUser
                        ? 'bg-[var(--accent-solar)] text-[var(--bg-base)] font-medium rounded-br-xs'
                        : 'bg-[var(--bg-surface-raised)] text-[var(--text-primary)] rounded-bl-xs border border-[var(--border-hairline)]'
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-line">{msg.content}</p>
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-[var(--border-hairline)]/80 text-[10px] text-[var(--text-muted)] space-y-1">
                        <span className="font-semibold text-[var(--accent-clean)]">Telemetry Grounding:</span>
                        {msg.citations.map((c, i) => (
                          <div key={i} className="truncate">
                            • {c.title} {c.metricValue && `(${c.metricValue})`}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-[var(--text-muted)] mt-1 px-1">{msg.timestamp}</span>
                </div>
              );
            })}
            {isLoading && (
              <div className="flex items-center gap-2 text-[var(--accent-solar)] text-xs italic p-2 bg-[var(--bg-surface-raised)] rounded-xl border border-[var(--border-hairline)]">
                <Bot className="w-4 h-4 animate-spin text-[var(--accent-solar)]" />
                <span>Invoking telemetry tools (get_forecast, run_whatif)...</span>
              </div>
            )}
          </div>

          {/* Drawer Input */}
          <form
            onSubmit={handleSend}
            className="p-3 border-t border-[var(--border-hairline)] bg-[var(--bg-surface-raised)] flex items-center gap-2"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask about GHI drop, peak stress, or what-if..."
              className="flex-1 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-solar)]"
            />
            <Button
              type="submit"
              size="sm"
              variant="solar"
              disabled={isLoading || !inputVal.trim()}
              className="px-3"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        </motion.aside>
      )}
    </AnimatePresence>
  </div>
  );
}
