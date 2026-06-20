# Thiết kế đồng bộ hóa màu sắc độ khó (Difficulty) động từ Database

Tài liệu này đặc tả giải pháp đồng bộ hóa màu sắc của các cấp độ khó (Difficulty) trên toàn bộ hệ thống bằng cách lấy trực tiếp giá trị màu `color_code` và tên `name` từ Database tại Runtime.

## Giải pháp: Dynamic 100% bằng Inline Style từ Database

Do Tailwind CSS biên dịch tĩnh (Static Compilation), nó không thể nhận diện các class động dạng `bg-[${colorCode}]` được tải từ Database tại Runtime. Vì vậy, giải pháp tối ưu nhất là sử dụng `React.CSSProperties` thông qua thuộc tính `style` kết hợp các class định dạng cơ bản của Tailwind (như padding, border-radius, font-weight).

### 1. File Hằng số & Helper toàn cục

Chúng ta sẽ tạo mới file [difficulty.constant.ts](file:///d:/VietElite/project_questionbank/src/lib/constants/difficulty.constant.ts) để quản lý cấu trúc dữ liệu và logic xử lý style:

```typescript
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
export function getDifficultyStyle(
  name: string | null | undefined,
  colorCode: string | null | undefined
): DifficultyStyle {
  const label = name || 'Chưa phân loại';
  
  // Màu mặc định (Slate-500) nếu không có màu trong DB hoặc gặp lỗi
  const color = colorCode && colorCode.startsWith('#') ? colorCode : '#64748b';

  return {
    label,
    badgeStyle: {
      backgroundColor: `${color}15`, // Nền mờ ~8.2%
      color: color,
      borderColor: `${color}30`, // Viền mờ ~18.8%
      borderWidth: '1px',
      borderStyle: 'solid',
    },
    textStyle: {
      color: color,
    },
  };
}
```

### 2. Các điểm cần cập nhật trong dự án

Cần tìm kiếm và cập nhật tất cả các màn hình hiển thị độ khó của câu hỏi bao gồm:
- Bảng danh sách câu hỏi: `QuestionListTable.tsx`
- Chi tiết câu hỏi / Modal xem chi tiết: `QuestionDetailModal.tsx`
- Bất kỳ bộ lọc hoặc component nào có hiển thị Badge độ khó.

## Kế hoạch kiểm thử

- Xác minh màu sắc hiển thị chính xác theo mã hex nhận từ DB.
- Đảm bảo khi tên độ khó là null/undefined, hệ thống hiển thị label mặc định "Chưa phân loại" với màu Slate mờ.
