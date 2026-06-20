import React from 'react';
import { Difficulty } from '@/lib/actions/difficulty.action';
import { cn } from '@/lib/utils/cn.utils';
import { getDifficultyStyles } from '@/lib/constants/difficulty.constant';

interface AppBadgeProps {
  difficultyName?: string | null | undefined;
  difficulties?: Difficulty[];
  className?: string;
  color?: string; // Cho phép truyền trực tiếp mã màu để dùng cho mục đích khác
  label?: string; // Nhãn hiển thị nếu dùng cho mục đích khác
}

export default function AppBadge({
  difficultyName,
  difficulties = [],
  className,
  color,
  label
}: AppBadgeProps) {
  const displayText = label || difficultyName;
  if (!displayText) {
    return <span className={cn("text-on-surface-variant font-medium text-sm", className)}>---</span>;
  }

  // Nếu truyền trực tiếp mã màu cho mục đích khác
  let styles: React.CSSProperties = {};
  if (color) {
    styles = {
      backgroundColor: `${color}15`,
      color: color,
      borderColor: `${color}30`,
      borderWidth: '1px',
      borderStyle: 'solid'
    };
  } else {
    styles = getDifficultyStyles(difficultyName, difficulties);
  }

  return (
    <span
      className={cn(
        "px-2 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap leading-none border inline-block",
        className
      )}
      style={styles}
    >
      {displayText}
    </span>
  );
}
