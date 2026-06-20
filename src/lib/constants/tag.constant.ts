import React from 'react';

export const STATIC_CATEGORY_COLORS: Record<string, string> = {
  SKILL: '#3b82f6',   // Blue-500
  SOURCE: '#a855f7',  // Purple-500
  METHOD: '#10b981',  // Emerald-500
  TYPE: '#f59e0b',    // Amber-500
  EXAM: '#f43f5e',    // Rose-500
  YEAR: '#06b6d4',    // Cyan-500
};

export const PRESET_COLORS = [
  '#3b82f6', // Xanh dương (SKILL)
  '#a855f7', // Tím (SOURCE)
  '#10b981', // Xanh lá (METHOD)
  '#f59e0b', // Vàng (TYPE)
  '#f43f5e', // Đỏ Rose (EXAM)
  '#06b6d4', // Xanh ngọc (YEAR)
  '#14b8a6', // Teal
  '#f97316', // Cam
  '#64748b', // Xám Slate
];

export const TAG_CATEGORIES = ['ALL', 'SOURCE', 'METHOD', 'SKILL', 'TYPE', 'EXAM', 'YEAR'];


/**
 * Hàm helper toàn cục sinh style động cho Tag.
 * Hỗ trợ màu sắc động từ DB (colorCode) kết hợp với fallback thông minh theo category.
 * Hỗ trợ trạng thái đã chọn (isSelected) và chưa chọn.
 */
export function getTagStyles(
  category: string,
  colorCode?: string | null | undefined,
  isSelected: boolean = false
): React.CSSProperties {
  const cat = (category || '').toUpperCase();
  const color = colorCode && colorCode.startsWith('#') 
    ? colorCode 
    : (STATIC_CATEGORY_COLORS[cat] || '#64748b'); // default Slate-500

  if (isSelected) {
    return {
      backgroundColor: color,
      color: '#ffffff',
      borderColor: color,
      borderWidth: '1px',
      borderStyle: 'solid',
    };
  }

  return {
    backgroundColor: `${color}15`, // ~8% opacity
    color: color,
    borderColor: `${color}30`, // ~18% opacity
    borderWidth: '1px',
    borderStyle: 'solid',
  };
}
