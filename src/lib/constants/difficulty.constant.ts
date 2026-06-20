import React from 'react';

export interface DifficultyStyle {
  label: string;
  badgeStyle: React.CSSProperties;
  textStyle: React.CSSProperties;
}

/**
 * Hàm helper toàn cục để tạo style động cho độ khó (Difficulty) dựa trên màu sắc lấy từ Database.
 * Sử dụng opacity hex (15 -> ~8.2%, 30 -> ~18.8%) để màu nền nhẹ nhàng, chữ đậm và viền tinh tế.
 */
export function getDifficultyStyles(
  diffName: string | null | undefined,
  difficulties: any[]
): React.CSSProperties {
  const diff = difficulties?.find(
    (d) => d.name.toLowerCase() === (diffName || '').toLowerCase()
  );
  
  if (diff?.color_code) {
    const color = diff.color_code;
    return {
      backgroundColor: `${color}15`, // ~8% opacity
      color: color,
      borderColor: `${color}30`, // ~18% opacity
    };
  }

  // Fallback thông minh dựa trên keyword nếu không tìm thấy trong DB
  const nameLower = (diffName || '').toLowerCase();
  let color = '#64748b'; // default slate-500
  if (nameLower.includes('hard') || nameLower.includes('khó')) color = '#ef4444';
  else if (nameLower.includes('easy') || nameLower.includes('dễ')) color = '#22c55e';
  else if (nameLower.includes('medium') || nameLower.includes('trung')) color = '#eab308';

  return {
    backgroundColor: `${color}15`,
    color: color,
    borderColor: `${color}30`,
  };
}
