'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helperText, error, leftIcon, rightIcon, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--text-primary)]"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full rounded-md border bg-white px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/60 transition-all',
              'focus:outline-none focus:ring-2 focus:ring-[var(--accent-clean)]/20 focus:border-[var(--accent-clean)]',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error
                ? 'border-[var(--accent-stress)] focus:border-[var(--accent-stress)] focus:ring-[var(--accent-stress)]/20'
                : 'border-[var(--border-hairline)]',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-[var(--accent-stress)] font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[var(--text-muted)]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
