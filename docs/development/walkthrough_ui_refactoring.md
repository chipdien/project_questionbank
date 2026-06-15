# TÀI LIỆU BÀN GIAO TÁI CẤU TRÚC HỆ THỐNG COMPONENT UI (MINI DESIGN SYSTEM)

Dự án đã hoàn thành việc tái cấu trúc hệ thống Component UI, thay thế các thành phần giao diện lặp lại và phân mảnh bằng một **Mini Design System** thống nhất tại thư mục `src/components/ui/`. Đồng thời, các màn hình nghiệp vụ chính trong ngân hàng câu hỏi đã được cập nhật để sử dụng các component dùng chung mới này.

---

## 🛠️ Các Component Đã Triển Khai

Tất cả các component dùng chung đều tuân thủ quy tắc đặt tên dạng `App + [Tên Component]` và sử dụng helper `cn` (`src/lib/utils/cn.ts`) để gộp CSS Tailwind linh hoạt:

1. **`AppBadge`** (`src/components/ui/AppBadge.tsx`):
   - Thay thế hoàn toàn hàm `getDifficultyBadge` cứng nhắc trước đây.
   - Nhận diện màu sắc độ khó động từ cấu hình cơ sở dữ liệu (`color_code`).
   - Có cơ chế dự phòng màu thông minh (`#888888`) nếu không tìm thấy dữ liệu cấu hình.

2. **`AppSelect`** (`src/components/ui/AppSelect.tsx`):
   - Thẻ select tùy biến hỗ trợ icon trái (Google Material Symbols hoặc ReactNode), nhãn (label) và trạng thái bị vô hiệu hóa (`disabled`).
   - Đồng bộ hiệu ứng hover, focus ring chuẩn UI/UX thương hiệu.

3. **`AppButton`** (`src/components/ui/AppButton.tsx`):
   - Hỗ trợ nhiều variant: `primary`, `secondary`, `outline`, `ghost`, `danger`.
   - Hỗ trợ các kích thước (`sm`, `md`, `lg`) và tự động hiển thị vòng xoay tải dữ liệu (`isLoading`).
   - Tích hợp hiệu ứng overlay nhẹ khi hover và click chuyển động thu nhỏ (`active:scale-95`).

4. **`AppInput`** (`src/components/ui/AppInput.tsx`):
   - Ô nhập liệu chuẩn hóa hỗ trợ label động, icon trái và tích hợp hiển thị thông báo lỗi (`error`) trực quan.

5. **`AppCheckbox`** (`src/components/ui/AppCheckbox.tsx`):
   - Ô chọn lựa đồng bộ, hỗ trợ các sự kiện và trạng thái tích chọn mượt mà.

---

## 🔄 Các Module Đã Tái Cấu Trúc

### 1. `QuestionsDataGrid.tsx` (`src/app/(main)/question-bank/components/QuestionsDataGrid.tsx`)
- Thay thế checkbox thuần bằng `<AppCheckbox />`.
- Thay thế badge độ khó bằng `<AppBadge />` liên kết với cấu hình động từ DB.
- Thay thế các nút hành động (Xem, Xóa, v.v.) bằng `<AppButton />`.

### 2. `QuestionClassificationCard.tsx` (`src/app/(main)/question-bank/components/QuestionClassificationCard.tsx`)
- Chuyển đổi toàn bộ các hộp chọn select lọc (Khối lớp, Độ khó, Môn học, Bài học, v.v.) sang `<AppSelect />`.
- Chuyển các nút bấm (Tìm kiếm, Chọn tệp) sang sử dụng `<AppButton />`.
- Loại bỏ mã CSS trùng lặp và đồng bộ hóa chiều rộng, chiều cao của các trường nhập liệu.

### 3. `QuestionBankManager.tsx` (`src/app/(main)/question-bank/components/QuestionBankManager.tsx`)
- Tích hợp `<AppBadge />` vào danh sách câu hỏi nguồn (`QuestionItem` - mode `source` và `selected`).
- Nâng cấp các trường chọn lọc bộ lọc câu hỏi bằng `<AppSelect />`.
- Thay đổi nút "Xóa lọc", "Thêm vào đề", "Tạo bộ sưu tập" sang `<AppButton />` với các biến thể phù hợp.

### 4. `CollectionSaveModal.tsx` & `AddToCollectionModal.tsx` (`src/app/(main)/collection/components/`)
- Cấu trúc lại toàn bộ các nút bấm nghiệp vụ lưu trữ bộ sưu tập bằng `<AppButton />`.
- Sử dụng `<AppInput />` để quản lý nhập tên bộ sưu tập, tự động xử lý và hiển thị thông báo lỗi validation khi người dùng bỏ trống trường.

---

## 🧪 Kết Quả Kiểm Thử & Xác Minh

- **Build Production**: Đã chạy thử nghiệm quá trình đóng gói production bằng lệnh `npm run build`.
- **Kết quả**:
  ```bash
  ✓ Compiled successfully in 8.3s
  Running TypeScript ...
  Finished TypeScript in 7.2s ...
  ✓ Generating static pages using 11 workers (13/13) in 608ms
  Finalizing page optimization ...
  Exit code: 0
  ```
  Quá trình biên dịch và kiểm tra kiểu TypeScript hoàn thành 100% thành công mà không phát sinh bất kỳ lỗi biên dịch nào.

---

## 🏆 Thành Tựu Đạt Được

1. **Loại bỏ Code Duplication**: Xóa bỏ hoàn toàn các đoạn code gán màu tĩnh cho độ khó và các inline-style lặp đi lặp lại của select/button/input.
2. **Dynamic UI**: Badge độ khó tự động thay đổi màu sắc và hiển thị theo đúng cấu hình lưu trong Database thông qua API.
3. **Thống Nhất Trải Nghiệm**: Người dùng có trải nghiệm hover, focus và active đồng nhất trên mọi nút bấm và bộ lọc trong hệ thống.
4. **Mở Rộng Tương Lai**: Dễ dàng cập nhật theme, đổi màu sắc thương hiệu toàn dự án chỉ cần thay đổi tại file CSS cốt lõi hoặc các file UI component dùng chung này.
