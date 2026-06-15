'use client';

import React, { SelectHTMLAttributes, useId } from 'react';
import { cn } from '@/lib/utils/cn';

interface AppSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  leftIcon?: string;
  error?: string;
  wrapperClassName?: string;
}

export default function AppSelect({
  label,
  leftIcon,
  error,
  children,
  className,
  wrapperClassName,
  disabled,
  id: customId,
  ...props
}: AppSelectProps) {
  const defaultId = useId();
  const id = customId || defaultId;

  return (
    <div className={cn("space-y-2 w-full", wrapperClassName)}>
      {label && (
        <label
          htmlFor={id}
          className="flex items-center gap-2 text-xs font-bold text-outline uppercase tracking-widest pl-1 select-none"
        >
          {leftIcon && (
            <span className="material-symbols-outlined text-sm text-primary/70">
              {leftIcon}
            </span>
          )}
          {label}
        </label>
      )}

      <div className="relative group/select w-full">
        <select
          id={id}
          disabled={disabled}
          className={cn(
            "w-full appearance-none rounded-xl border outline-none text-sm transition-all cursor-pointer",
            "bg-surface-container-lowest py-3.5 px-4 pr-10",
            disabled
              ? "opacity-50 bg-surface-container-low/50 border-outline-variant/30 cursor-not-allowed text-outline"
              : "border-outline-variant/50 hover:bg-surface-container-low hover:border-primary/30 focus:border-primary focus:ring-4 focus:ring-primary/10 text-on-surface",
            error ? "border-error focus:border-error focus:ring-error/10" : "",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <span
          className={cn(
            "material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-outline-variant transition-colors",
            disabled ? "opacity-30" : "group-hover/select:text-primary"
          )}
        >
          expand_more
        </span>
      </div>

      {error && (
        <span className="text-xs text-error pl-1 block font-medium">
          {error}
        </span>
      )}
    </div>
  );
}
