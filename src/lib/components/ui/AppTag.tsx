'use client';

import React from 'react';
import { getTagStyles } from '@/lib/constants/tag.constant';

export interface TagData {
  id?: number | bigint | string;
  name: string;
  category: string;
  color_code?: string | null;
}

interface AppTagProps {
  tag: TagData;
  isSelected?: boolean;
  className?: string;
}

/**
 * Component hiển thị thẻ Tag học thuật (ví dụ: #Đại số, #2024).
 * Đồng bộ màu sắc động từ Database (color_code) và tự động fallback theo category.
 */
export default function AppTag({ tag, isSelected = false, className }: AppTagProps) {
  const styles = getTagStyles(tag.category, tag.color_code, isSelected);
  return (
    <span
      style={styles}
      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase whitespace-nowrap leading-none border inline-block transition-all duration-150 ${className || ''}`}
    >
      #{tag.name}
    </span>
  );
}
