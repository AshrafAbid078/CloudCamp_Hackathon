'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solar' | 'clean' | 'stress' | 'surface' | 'outline' | 'ghost' | 'primary' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'solar',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold transition-colors duration-150 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-clean)]/35 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none';

    const variants = {
      solar:
        'bg-[var(--accent-clean)] text-white hover:bg-[#106b65]',
      primary:
        'bg-[var(--accent-clean)] text-white hover:bg-[#106b65]',
      amber:
        'bg-[var(--accent-solar)] text-[#172635] hover:bg-[#c89136]',
      clean:
        'bg-[var(--accent-clean)] text-white hover:bg-[#106b65]',
      stress:
        'bg-[var(--accent-stress)] text-white hover:bg-[#9f4142]',
      surface:
        'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-hairline)] hover:bg-[var(--bg-surface-raised)]',
      outline:
        'border border-[var(--border-hairline)] bg-white text-[var(--text-primary)] hover:bg-[var(--bg-surface-raised)] hover:border-[var(--accent-clean)]',
      ghost:
        'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-raised)]',
    };

    const sizes = {
      sm: 'text-xs px-3 py-2 gap-1.5',
      md: 'text-sm px-4 py-2.5 gap-2',
      lg: 'text-sm sm:text-base px-6 py-3 gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-0.5 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!isLoading && leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
