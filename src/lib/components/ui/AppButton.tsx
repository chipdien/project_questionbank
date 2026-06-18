'use client';

import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn.utils';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: string | ReactNode;
  rightIcon?: string | ReactNode;
}

export default function AppButton({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  children,
  type = 'button',
  ...props
}: AppButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-bold transition-all duration-200 select-none relative overflow-hidden active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:hover:shadow-none cursor-pointer";

  const variants = {
    primary: "bg-primary text-on-primary hover:shadow-lg hover:shadow-primary/20 hover:opacity-95",
    secondary: "bg-secondary text-on-secondary hover:shadow-lg hover:shadow-secondary/20 hover:opacity-95",
    outline: "bg-transparent border border-outline-variant/30 text-primary hover:bg-primary/5 hover:border-primary/20",
    ghost: "bg-transparent text-outline hover:bg-surface-container-low hover:text-primary",
    danger: "bg-error text-on-error hover:shadow-lg hover:shadow-error/20 hover:opacity-95"
  };

  const sizes = {
    sm: "px-3 py-1.5 rounded-lg text-xs gap-1.5",
    md: "px-4 py-2 rounded-xl text-sm gap-2",
    lg: "px-6 py-3.5 rounded-2xl text-base gap-2.5"
  };

  const isBtnDisabled = disabled || isLoading;

  const renderIcon = (icon: string | ReactNode) => {
    if (typeof icon === 'string') {
      return <span className="material-symbols-outlined text-[18px]">{icon}</span>;
    }
    return icon;
  };

  return (
    <button
      type={type}
      disabled={isBtnDisabled}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {/* Loading Spinner */}
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}

      {/* Left Icon (only when not loading) */}
      {!isLoading && leftIcon && renderIcon(leftIcon)}

      {children}

      {/* Right Icon */}
      {rightIcon && renderIcon(rightIcon)}

      {/* Ripple/Overlay Effect on Hover */}
      <span className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
    </button>
  );
}
