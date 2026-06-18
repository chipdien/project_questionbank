'use client';

import React from 'react';
import { Difficulty } from '@/lib/actions/difficulty.action';
import { cn } from '@/lib/utils/cn.utils';

interface AppBadgeProps {
  difficultyName: string | null | undefined;
  difficulties?: Difficulty[];
  className?: string;
}

export default function AppBadge({
  difficultyName,
  difficulties = [],
  className
}: AppBadgeProps) {
  if (!difficultyName) {
    return <span className={cn("text-on-surface-variant font-medium text-sm", className)}>---</span>;
  }

  // Tìm màu từ database
  const found = difficulties.find(d => d.name.toLowerCase() === difficultyName.toLowerCase());
  if (found) {
    const color = found.color_code;
    return (
      <span
        className={cn(
          "px-2 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap leading-none border inline-block",
          className
        )}
        style={{
          color: color,
          backgroundColor: `${color}12`,
          borderColor: `${color}30`
        }}
      >
        {found.name}
      </span>
    );
  }

  // Fallback nếu không tìm thấy cấu hình động
  const diff = difficultyName.toLowerCase();
  let color = '#888888';
  if (diff.includes('hard') || diff.includes('khó')) color = '#ef4444';
  else if (diff.includes('easy') || diff.includes('dễ')) color = '#22c55e';
  else if (diff.includes('medium') || diff.includes('trung')) color = '#eab308';

  return (
    <span
      className={cn(
        "px-2 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap leading-none border inline-block",
        className
      )}
      style={{
        color: color,
        backgroundColor: `${color}12`,
        borderColor: `${color}30`
      }}
    >
      {difficultyName}
    </span>
  );
}
