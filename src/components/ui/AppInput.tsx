'use client';

import React, { InputHTMLAttributes, ReactNode, useId } from 'react';
import { cn } from '@/lib/utils/cn';

interface AppInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  leftIcon?: string | ReactNode;
  error?: string;
  wrapperClassName?: string;
}

export default function AppInput({
  label,
  leftIcon,
  error,
  className,
  wrapperClassName,
  disabled,
  id: customId,
  type = 'text',
  ...props
}: AppInputProps) {
  const defaultId = useId();
  const id = customId || defaultId;

  const renderIcon = (icon: string | ReactNode) => {
    if (typeof icon === 'string') {
      return (
        <span className="material-symbols-outlined text-outline absolute left-4 top-1/2 -translate-y-1/2 text-[18px]">
          {icon}
        </span>
      );
    }
    return (
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center">
        {icon}
      </div>
    );
  };

  return (
    <div className={cn("space-y-2 w-full", wrapperClassName)}>
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-bold text-outline uppercase tracking-widest pl-1 block select-none"
        >
          {label}
        </label>
      )}

      <div className="relative w-full group/input">
        {leftIcon && renderIcon(leftIcon)}
        <input
          id={id}
          type={type}
          disabled={disabled}
          className={cn(
            "w-full rounded-xl border outline-none text-sm transition-all duration-200",
            "bg-surface-container-lowest py-3.5 px-4",
            leftIcon ? "pl-11" : "pl-4",
            disabled
              ? "opacity-50 bg-surface-container-low/50 border-outline-variant/30 cursor-not-allowed text-outline"
              : "border-outline-variant/50 hover:bg-surface-container-low hover:border-primary/30 focus:bg-surface-container-lowest focus:border-primary focus:ring-4 focus:ring-primary/10 text-on-surface",
            error ? "border-error focus:border-error focus:ring-error/10" : "",
            className
          )}
          {...props}
        />
      </div>

      {error && (
        <span className="text-xs text-error pl-1 block font-medium">
          {error}
        </span>
      )}
    </div>
  );
}
