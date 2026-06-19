'use client';

import React from 'react';

interface LoadingProps {
  /**
   * If true, displays loading as a fullscreen overlay with glassmorphism backdrop
   */
  fullscreen?: boolean;
  /**
   * Optional custom text to display under the spinner. Defaults to "Loading..."
   */
  text?: string;
  /**
   * Size of the spinner.
   * - 'sm': 24px
   * - 'md': 40px
   * - 'lg': 64px
   */
  size?: 'sm' | 'md' | 'lg';
}

export default function Loading({ fullscreen = false, text = 'Loading...', size = 'md' }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };

  const textClasses = {
    sm: 'text-xs',
    md: 'text-sm font-medium',
    lg: 'text-base font-semibold',
  };

  const spinnerContent = (
    <div className="flex flex-col items-center justify-center gap-3 text-center">
      {/* Animated rotating spinner using VietElite primary color (#348E38) */}
      <div
        className={`animate-spin rounded-full border-t-primary border-r-primary border-b-primary/20 border-l-primary/20 ${sizeClasses[size]}`}
      />
      {text && (
        <span className={`text-on-surface-variant font-body ${textClasses[size]} tracking-wide animate-pulse`}>
          {text}
        </span>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-xs transition-opacity duration-300">
        {spinnerContent}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-6 w-full h-full min-h-[150px]">
      {spinnerContent}
    </div>
  );
}
