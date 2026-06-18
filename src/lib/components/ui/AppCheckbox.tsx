'use client';

import React, { InputHTMLAttributes, useId } from 'react';
import { cn } from '@/lib/utils/cn.utils';

interface AppCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  wrapperClassName?: string;
}

export default function AppCheckbox({
  label,
  className,
  wrapperClassName,
  disabled,
  id: customId,
  ...props
}: AppCheckboxProps) {
  const defaultId = useId();
  const id = customId || defaultId;

  return (
    <div className={cn("inline-flex items-center gap-2", wrapperClassName)}>
      <input
        id={id}
        type="checkbox"
        disabled={disabled}
        className={cn(
          "rounded border-outline-variant/60 text-primary focus:ring-primary h-4 w-4 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      />
      {label && (
        <label
          htmlFor={id}
          className={cn(
            "text-sm font-semibold select-none cursor-pointer text-on-surface",
            disabled ? "opacity-50 cursor-not-allowed" : "hover:text-primary transition-colors"
          )}
        >
          {label}
        </label>
      )}
    </div>
  );
}
