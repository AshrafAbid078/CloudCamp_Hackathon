'use client';

import React from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { useCopilot } from '@/hooks';
import { cn } from '@/lib/utils';

interface CopilotToggleProps {
  className?: string;
  variant?: 'button' | 'pill';
}

export function CopilotToggle({ className, variant = 'button' }: CopilotToggleProps) {
  const { toggle, isOpen } = useCopilot();

  if (variant === 'pill') {
    return (
      <button
        onClick={toggle}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border cursor-pointer select-none',
          isOpen
            ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md shadow-amber-500/20'
            : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border-zinc-700/60 hover:border-amber-500/50',
          className
        )}
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>Ask Copilot</span>
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className={cn(
        'relative p-2 rounded-xl border transition-all duration-200 cursor-pointer select-none',
        isOpen
          ? 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400'
          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-amber-500/40 hover:text-amber-500',
        className
      )}
      title="Toggle Solar & Grid Copilot"
    >
      <Bot className="w-5 h-5" />
      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
      </span>
    </button>
  );
}
