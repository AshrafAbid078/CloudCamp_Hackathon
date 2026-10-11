'use client';

import React from 'react';
import { Sidebar, Header } from '@/components/layout';
import { useCopilot } from '@/hooks';
import { X, Send, Bot, Sparkles } from 'lucide-react';
import { Button } from '@/components/common';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen, toggle, messages, isLoading, sendMessage } = useCopilot();
  const [inputVal, setInputVal] = React.useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isLoading) return;
    sendMessage(inputVal);
    setInputVal('');
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main App Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 sm:p-8">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>

      {/* Slide-over Copilot Drawer (Accessible from any dashboard page) */}
      {isOpen && (
        <aside className="w-96 shrink-0 h-screen border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl flex flex-col z-40 transition-all">
          {/* Drawer Header */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Solar & Grid Copilot
                </h3>
                <p className="text-[10px] text-zinc-500">Telemetry-Grounded Intelligence</p>
              </div>
            </div>
            <button
              onClick={toggle}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[88%] p-3 rounded-2xl ${
                    msg.sender === 'user'
                      ? 'bg-sky-600 text-white rounded-br-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-bl-xs'
                  }`}
                >
                  <p className="leading-relaxed">{msg.content}</p>
                </div>
                <span className="text-[10px] text-zinc-400 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-zinc-400 text-xs italic p-2">
                <Bot className="w-4 h-4 animate-bounce text-amber-500" />
                <span>Analyzing telemetry channels...</span>
              </div>
            )}
          </div>

          {/* Drawer Input */}
          <form
            onSubmit={handleSend}
            className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask about GHI, dispatch, or curtailment..."
              className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <Button
              type="submit"
              size="sm"
              variant="amber"
              disabled={isLoading || !inputVal.trim()}
              className="px-2.5"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        </aside>
      )}
    </div>
  );
}
