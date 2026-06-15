# Research: Quản lý Giáo trình (Syllabus/Topics) và Thẻ (Tags)

## Khảo sát Cấu trúc hiện tại

1. **Materialized Path trong `lms_topics`**:
   - Trường `path` được lưu trữ dưới dạng chuỗi chứa ID của các cấp cha từ gốc đến hiện tại (ví dụ: `/1/12/35/`).
   - Đã có sẵn module `src/lib/materialized-path.ts` để tính toán path và cập nhật đệ quy các node con khi đổi cha.

2. **Hệ thống API hiện có**:
   - `GET /api/topics` và `POST /api/topics` đã có sẵn.
   - `PATCH /api/topics/[id]` và `DELETE /api/topics/[id]` đã có sẵn nhưng cần sửa đổi cơ chế DELETE theo Option A (chặn xóa nếu có liên kết).

## Quyết định Thiết kế UI/UX & Công nghệ

### 1. Giao diện Cây Chủ đề (Syllabus/Topics Tree View)
- **Phương án**: Xây dựng giao diện Tree View đệ quy sử dụng React Components thuần kết hợp Tailwind CSS. Giao diện hỗ trợ mở rộng/thu gọn, thêm nhanh node con, chỉnh sửa trực tiếp, và nút Xóa.
- **Tại sao chọn**: Giữ giao diện nhẹ nhàng, dễ tùy biến giao diện premium và đồng bộ hiệu ứng mượt mà.
- **Kéo thả / Sắp xếp**: Sử dụng `react-sortablejs` đã cài đặt sẵn trong dự án để cho phép thay đổi thứ tự hiển thị `order_index` giữa các node cùng cấp.

### 2. Giao diện Quản lý Thẻ Tag
- **Phương án**: Bảng danh sách thẻ tag (Data Table) phân trang, cho phép lọc theo `category`, tìm kiếm nhanh theo tên tag. Hỗ trợ modal Tạo mới / Chỉnh sửa tag.

### 3. Cơ chế Xóa Chủ đề an toàn (Option A)
- **API DELETE `/api/topics/[id]`**: Thay vì tự động set null và xóa liên kết như cũ, API mới sẽ kiểm tra:
  - Nếu node có con (`parent_id === id`), trả về lỗi `400` kèm thông báo chặn.
  - Nếu node có câu hỏi liên kết (`lms_topics_questions`), trả về lỗi `400` kèm thông báo chặn.
- **API hỗ trợ**:
  - `GET /api/topics/[id]/related`: Lấy số lượng và danh sách câu hỏi đang liên kết trực tiếp/gián tiếp để hiển thị lên UI cho người dùng xem.
  - `POST /api/topics/[id]/transfer`: Di chuyển hàng loạt câu hỏi thuộc chủ đề này sang một chủ đề đích khác được chỉ định.

## Các giải pháp thay thế đã xem xét
- **Xóa tự động (Cascade Delete)**: Bị loại bỏ do yêu cầu từ người dùng để tránh rủi ro mất liên kết học liệu của câu hỏi.
- **Sử dụng thư viện Tree View ngoài (ví dụ: react-accessible-treeview)**: Không cần thiết vì cấu trúc tự dựng với Tailwind CSS dễ tạo hiệu ứng glassmorphism và đồng bộ với theme hiện tại của dự án hơn.
