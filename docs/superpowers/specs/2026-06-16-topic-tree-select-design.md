# Tài liệu thiết kế: Component TopicTreeSelect dùng chung

Tài liệu này đặc tả thiết kế kỹ thuật, giao diện và cách sử dụng của Component `TopicTreeSelect` phục vụ việc lựa chọn cây chủ đề học thuật phân cấp trong dự án.

## 1. Yêu cầu & Mục tiêu
- **Tự động tải dữ liệu**: Tự gọi API thông qua `topicsService.fetchTopics()` để lấy danh sách phẳng các chủ đề và tự phân cấp đệ quy.
- **Lọc phân cấp**: Hiển thị cấu trúc cây dạng thu gọn/mở rộng. Cho phép chọn các nút ở giữa (cha, con) bằng checkbox/radio độc lập mà không bắt buộc phải xuống nút lá nhỏ nhất.
- **Hiển thị ngữ cảnh**: Khi hover vào kết quả đã chọn, hiển thị tooltip đường dẫn phân cấp đầy đủ dạng `Cha > Con > Cháu` để người dùng dễ dàng biết mình đang ở đâu.
- **Hỗ trợ tìm kiếm**: Ô tìm kiếm trong menu tự động lọc các chủ đề khớp và tự động mở rộng (auto-expand) các nút cha để hiển thị kết quả trực quan nhất.
- **Linh hoạt**: Hỗ trợ cả chế độ chọn đơn (Single Select) và chọn nhiều (Multi Select) qua prop điều khiển. Dễ dàng import và sử dụng ở bất kỳ đâu trong toàn bộ dự án.

## 2. API Đặc tả (Interface Props)

```typescript
import React from 'react';

export interface TopicTreeSelectProps {
  // Chế độ chọn nhiều
  multiple?: boolean;
  
  // Giá trị được chọn: string (chọn đơn) hoặc string[] (chọn nhiều)
  value?: string | string[];
  
  // Callback khi thay đổi giá trị chọn
  onChange?: (value: any) => void;
  
  // Giao diện placeholder của ô chọn
  placeholder?: string;
  
  // Giới hạn các loại chủ đề được phép chọn (ví dụ: ['LESSON', 'SUB_LESSON'])
  allowedTypes?: string[];
  
  // Trạng thái vô hiệu hóa component
  disabled?: boolean;
  
  // CSS class bổ sung cho ô select trigger
  className?: string;
}
```

## 3. Kiến trúc Luồng Dữ liệu (Data Flow)

1. **Khởi tạo và Tải dữ liệu (fetch)**:
   Component sử dụng `useEffect` để kích hoạt `topicsService.fetchTopics()`. Kết quả trả về là một mảng phẳng các chủ đề học thuật.

2. **Dựng cấu trúc cây (Tree Construction)**:
   Hàm phụ trợ sẽ chuyển danh sách phẳng thành cấu trúc cây đệ quy trong `useMemo`:
   ```typescript
   interface TopicNode {
     id: string;
     title: string;
     code: string | null;
     parent_id: string | null;
     path: string | null;
     type: string;
     order_index: string;
     children: TopicNode[];
     breadcrumb: string; // Tích lũy đường đi từ gốc: "Toán 12 > Đại số > ..."
   }
   ```

3. **Thuật toán tìm kiếm (Search/Filter Algorithm)**:
   Khi người dùng gõ từ khóa tìm kiếm:
   - Hệ thống lọc đệ quy các nút khớp với `title` hoặc `code`.
   - Nếu một nút con khớp, toàn bộ các nút cha trên đường đi của nó cũng được giữ lại để đảm bảo ngữ cảnh hiển thị. Các nút cha này sẽ được ép buộc trạng thái mở rộng (`expanded`).

4. **Trạng thái đóng mở cây (Collapse/Expand State)**:
   Quản lý thông qua một `Set<string>` lưu trữ danh sách ID các nút đang được mở rộng.

## 4. UI/UX & Styling

- **Trigger Box**: Dựng theo phong cách Material Design / Glassmorphism thống nhất với hệ thống. Sử dụng thẻ Tag có nút xóa `x` cho chế độ multi-select.
- **Tooltip**: Sử dụng thẻ div với absolute position, tự động kích hoạt khi hover (`group-hover:block` hoặc quản lý bằng React state `hoveredId`) hiển thị đường dẫn đầy đủ từ gốc tới nút đó.
- **Tree Node Render**:
  - Dùng margin-left tăng dần theo cấp độ (ví dụ: `level * 16px` hoặc `pl-4` lặp lại) để tạo phân cấp.
  - Sử dụng biểu tượng `ChevronRight` / `ChevronDown` của Lucide Icons cho việc đóng mở.
  - Có Checkbox (chọn nhiều) hoặc Radio (chọn đơn) tương ứng để người chọn click trực tiếp vào nút.
